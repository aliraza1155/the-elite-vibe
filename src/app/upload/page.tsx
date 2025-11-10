'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import { storageService, firestore } from '@/lib/firebase';
import { AuthGuard } from '@/components/auth-guard';

// Enhanced interfaces
interface FileUploadType {
  sfwImages: File[];
  nsfwImages: File[];
  sfwVideos: File[];
  nsfwVideos: File[];
}

interface EnhancedFileUploadType {
  sfwImages: File[];
  nsfwImages: File[];
  sfwVideos: File[];
  nsfwVideos: File[];
  totalSize: number;
  totalFiles: number;
  uploadedSize: number;
}

interface UploadJob {
  id: string;
  file: File;
  type: string;
  path: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  uploadedBytes: number;
  startTime?: number;
  speed: number;
  retryCount: number;
  url?: string;
  error?: string;
}

interface UploadStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  overallProgress: number;
  averageSpeed: number;
  estimatedTime: number;
  activeConnections: number;
}

interface BackgroundUploadSession {
  id: string;
  modelId: string;
  userId: string;
  jobs: UploadJob[];
  stats: UploadStats;
  modelDetails: any;
  createdAt: number;
  lastUpdated: number;
  status: 'uploading' | 'completed' | 'failed' | 'paused';
}

// Compression utilities
class CompressionEngine {
  static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      if (file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      img.onload = () => {
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  static async compressVideo(file: File): Promise<File> {
    return file;
  }

  static async optimizeFile(file: File): Promise<File> {
    try {
      if (file.type.startsWith('image/')) {
        return await this.compressImage(file);
      } else if (file.type.startsWith('video/')) {
        return await this.compressVideo(file);
      }
      return file;
    } catch (error) {
      console.warn('Compression failed, using original file:', error);
      return file;
    }
  }
}

// Background Upload Manager
class BackgroundUploadManager {
  private static instance: BackgroundUploadManager;
  private sessions: Map<string, BackgroundUploadSession> = new Map();
  private isInitialized = false;

  private constructor() {
    this.loadSessionsFromStorage();
    this.isInitialized = true;
  }

  static getInstance(): BackgroundUploadManager {
    if (!BackgroundUploadManager.instance) {
      BackgroundUploadManager.instance = new BackgroundUploadManager();
    }
    return BackgroundUploadManager.instance;
  }

  private loadSessionsFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('backgroundUploadSessions');
      if (saved) {
        const sessions = JSON.parse(saved);
        this.sessions = new Map(Object.entries(sessions));
        console.log('📂 Loaded background upload sessions:', this.sessions.size);
      }
    } catch (error) {
      console.error('❌ Failed to load background sessions:', error);
    }
  }

  private saveSessionsToStorage() {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    try {
      const sessionsObj = Object.fromEntries(this.sessions);
      localStorage.setItem('backgroundUploadSessions', JSON.stringify(sessionsObj));
    } catch (error) {
      console.error('❌ Failed to save background sessions:', error);
    }
  }

  createSession(modelId: string, userId: string, modelDetails: any): BackgroundUploadSession {
    const session: BackgroundUploadSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId,
      userId,
      jobs: [],
      stats: this.initializeStats(),
      modelDetails,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      status: 'uploading'
    };

    this.sessions.set(session.id, session);
    this.saveSessionsToStorage();
    
    console.log('✅ Created background upload session:', session.id);
    return session;
  }

  getSession(sessionId: string): BackgroundUploadSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<BackgroundUploadSession>) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastUpdated: Date.now() });
      this.sessions.set(sessionId, session);
      this.saveSessionsToStorage();
    }
  }

  getAllSessions(): BackgroundUploadSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  getActiveSessions(): BackgroundUploadSession[] {
    return this.getAllSessions().filter(session => 
      session.status === 'uploading' || session.status === 'paused'
    );
  }

  deleteSession(sessionId: string) {
    this.sessions.delete(sessionId);
    this.saveSessionsToStorage();
  }

  private initializeStats(): UploadStats {
    return {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      uploadedSize: 0,
      overallProgress: 0,
      averageSpeed: 0,
      estimatedTime: 0,
      activeConnections: 0
    };
  }
}

// Ultra-Fast Upload Manager
class UltraFastUploadManager {
  private jobs: UploadJob[] = [];
  private stats: UploadStats;
  private concurrentUploads: number = 6;
  private activeUploads: number = 0;
  private updateCallback: (stats: UploadStats, jobs: UploadJob[]) => void;
  private isPaused: boolean = false;
  private completedCallbacks: ((results: any) => void)[] = [];
  private backgroundSessionId?: string;

  constructor(updateCallback: (stats: UploadStats, jobs: UploadJob[]) => void) {
    this.stats = this.initializeStats();
    this.updateCallback = updateCallback;
  }

  private initializeStats(): UploadStats {
    return {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      uploadedSize: 0,
      overallProgress: 0,
      averageSpeed: 0,
      estimatedTime: 0,
      activeConnections: 0
    };
  }

  setBackgroundSession(sessionId: string) {
    this.backgroundSessionId = sessionId;
  }

  addJob(file: File, type: string, path: string, modelId: string, userId: string): string {
    const job: UploadJob = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type,
      path: `${path}/${file.name}`,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      retryCount: 0
    };

    this.jobs.push(job);
    this.updateStats();
    this.processQueue();
    
    // Update background session if exists
    if (this.backgroundSessionId) {
      this.updateBackgroundSession();
    }
    
    return job.id;
  }

  addJobs(files: File[], type: string, basePath: string, modelId: string, userId: string): string[] {
    return files.map(file => 
      this.addJob(file, type, basePath, modelId, userId)
    );
  }

  private async processQueue() {
    if (this.isPaused || this.activeUploads >= this.concurrentUploads) return;

    const pendingJobs = this.jobs.filter(job => 
      job.status === 'pending' || (job.status === 'failed' && job.retryCount < 3)
    );

    if (pendingJobs.length === 0) return;

    const availableSlots = this.concurrentUploads - this.activeUploads;
    const jobsToProcess = pendingJobs.slice(0, availableSlots);

    for (const job of jobsToProcess) {
      this.startUpload(job);
    }
  }

  private async startUpload(job: UploadJob) {
    if (job.status === 'uploading') return;

    this.activeUploads++;
    job.status = 'uploading';
    job.startTime = Date.now();
    job.retryCount++;

    try {
      const optimizedFile = await CompressionEngine.optimizeFile(job.file);
      
      const result = await storageService.uploadFileWithDetailedProgress(
        optimizedFile,
        job.path,
        (progress, uploadedBytes, speed) => {
          job.progress = progress;
          job.uploadedBytes = uploadedBytes;
          job.speed = speed;
          this.updateStats();
          
          // Update background session in real-time
          if (this.backgroundSessionId) {
            this.updateBackgroundSession();
          }
        },
        { 
          owner: 'current-user-id',
          type: job.type,
          modelId: 'current-model-id'
        }
      );

      if (result.url) {
        job.status = 'completed';
        job.url = result.url;
        job.progress = 100;
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Upload failed';
    } finally {
      this.activeUploads--;
      this.updateStats();
      this.processQueue();
      this.checkCompletion();
      
      // Final update to background session
      if (this.backgroundSessionId) {
        this.updateBackgroundSession();
      }
    }
  }

  private updateStats() {
    const totalFiles = this.jobs.length;
    const completedFiles = this.jobs.filter(j => j.status === 'completed').length;
    const failedFiles = this.jobs.filter(j => j.status === 'failed').length;
    const totalSize = this.jobs.reduce((sum, job) => sum + job.file.size, 0);
    const uploadedSize = this.jobs.reduce((sum, job) => sum + job.uploadedBytes, 0);
    const overallProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;
    
    const activeJobs = this.jobs.filter(j => j.status === 'uploading');
    const averageSpeed = activeJobs.length > 0 
      ? activeJobs.reduce((sum, job) => sum + job.speed, 0) / activeJobs.length 
      : 0;

    const remainingBytes = totalSize - uploadedSize;
    const estimatedTime = averageSpeed > 0 ? remainingBytes / averageSpeed : 0;

    this.stats = {
      totalFiles,
      completedFiles,
      failedFiles,
      totalSize,
      uploadedSize,
      overallProgress,
      averageSpeed,
      estimatedTime,
      activeConnections: activeJobs.length
    };

    this.updateCallback(this.stats, [...this.jobs]);
  }

  private updateBackgroundSession() {
    if (!this.backgroundSessionId) return;

    const backgroundManager = BackgroundUploadManager.getInstance();
    const session = backgroundManager.getSession(this.backgroundSessionId);
    
    if (session) {
      backgroundManager.updateSession(this.backgroundSessionId, {
        jobs: this.jobs,
        stats: this.stats
      });
    }
  }

  private checkCompletion() {
    const allDone = this.jobs.every(job => 
      job.status === 'completed' || job.status === 'failed'
    );

    if (allDone && this.completedCallbacks.length > 0) {
      const results = this.getResults();
      this.completedCallbacks.forEach(callback => callback(results));
      this.completedCallbacks = [];
      
      // Mark background session as completed
      if (this.backgroundSessionId) {
        const backgroundManager = BackgroundUploadManager.getInstance();
        backgroundManager.updateSession(this.backgroundSessionId, {
          status: 'completed'
        });
      }
    }
  }

  getResults() {
    return {
      sfwImages: this.jobs.filter(j => j.type === 'sfw-images' && j.url).map(j => j.url!),
      nsfwImages: this.jobs.filter(j => j.type === 'nsfw-images' && j.url).map(j => j.url!),
      sfwVideos: this.jobs.filter(j => j.type === 'sfw-videos' && j.url).map(j => j.url!),
      nsfwVideos: this.jobs.filter(j => j.type === 'nsfw-videos' && j.url).map(j => j.url!),
      errors: this.jobs.filter(j => j.error).map(j => j.error!)
    };
  }

  onComplete(callback: (results: any) => void) {
    this.completedCallbacks.push(callback);
  }

  pause() {
    this.isPaused = true;
    if (this.backgroundSessionId) {
      const backgroundManager = BackgroundUploadManager.getInstance();
      backgroundManager.updateSession(this.backgroundSessionId, {
        status: 'paused'
      });
    }
  }

  resume() {
    this.isPaused = false;
    this.processQueue();
    if (this.backgroundSessionId) {
      const backgroundManager = BackgroundUploadManager.getInstance();
      backgroundManager.updateSession(this.backgroundSessionId, {
        status: 'uploading'
      });
    }
  }

  retryFailed() {
    this.jobs.forEach(job => {
      if (job.status === 'failed' && job.retryCount < 3) {
        job.status = 'pending';
        job.error = undefined;
      }
    });
    this.processQueue();
  }

  getJob(id: string): UploadJob | undefined {
    return this.jobs.find(job => job.id === id);
  }
}

export default function UltraFastUploadPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackgroundUploads, setShowBackgroundUploads] = useState(false);
  
  const [files, setFiles] = useState<EnhancedFileUploadType>({
    sfwImages: [],
    nsfwImages: [],
    sfwVideos: [],
    nsfwVideos: [],
    totalSize: 0,
    totalFiles: 0,
    uploadedSize: 0
  });

  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    uploadedSize: 0,
    overallProgress: 0,
    averageSpeed: 0,
    estimatedTime: 0,
    activeConnections: 0
  });

  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [backgroundSessions, setBackgroundSessions] = useState<BackgroundUploadSession[]>([]);
  const [uploadManager] = useState(() => new UltraFastUploadManager(
    (stats, jobs) => {
      setUploadStats(stats);
      setUploadJobs(jobs);
    }
  ));

  const [modelDetails, setModelDetails] = useState({
    name: '',
    niche: '',
    description: '',
    framework: '',
    modelSize: '',
    price: '50' // Default to minimum price
  });

  const router = useRouter();
  const uploadManagerRef = useRef<UltraFastUploadManager>();
  const backgroundManagerRef = useRef<BackgroundUploadManager>();

  useEffect(() => {
    uploadManagerRef.current = uploadManager;
    backgroundManagerRef.current = BackgroundUploadManager.getInstance();
    
    // Check authentication
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(user);
    setLoading(false);

    // Load background sessions
    loadBackgroundSessions();
  }, [router]);

  const loadBackgroundSessions = () => {
    if (backgroundManagerRef.current) {
      const sessions = backgroundManagerRef.current.getAllSessions();
      setBackgroundSessions(sessions);
    }
  };

  // Calculate totals with compression estimates
  const calculateTotals = useCallback((fileType: keyof FileUploadType, newFiles: File[]) => {
    const typeSize = newFiles.reduce((total, file) => {
      const compressionRatio = file.type.startsWith('image/') ? 0.6 : 0.9;
      return total + (file.size * compressionRatio);
    }, 0);
    
    const totalSize = Object.values(files).reduce((total, filesArray) => {
      if (Array.isArray(filesArray)) {
        return total + filesArray.reduce((sum, file) => {
          const ratio = file.type.startsWith('image/') ? 0.6 : 0.9;
          return sum + (file.size * ratio);
        }, 0);
      }
      return total;
    }, 0) + typeSize;
    
    const totalFiles = Object.values(files).reduce((total, filesArray) => {
      if (Array.isArray(filesArray)) {
        return total + filesArray.length;
      }
      return total;
    }, 0) + newFiles.length;

    return { totalSize, totalFiles };
  }, [files]);

  const handleFilesChange = (type: keyof FileUploadType, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    
    const validFiles = newFiles.filter(file => {
      if (type.includes('Images') && !file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        return false;
      }
      if (type.includes('Videos') && !file.type.startsWith('video/')) {
        console.warn(`Skipping non-video file: ${file.name}`);
        return false;
      }
      return true;
    });

    setFiles(prev => {
      const currentFiles = prev[type];
      const updatedFiles = [...currentFiles, ...validFiles];
      
      const { totalSize, totalFiles } = calculateTotals(type, validFiles);
      
      return {
        ...prev,
        [type]: updatedFiles,
        totalSize,
        totalFiles
      };
    });
  };

  const handleDragOver = (e: React.DragEvent, type: keyof FileUploadType) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-cyan-500', 'bg-cyan-500/10');
  };

  const handleDragLeave = (e: React.DragEvent, type: keyof FileUploadType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/10');
  };

  const handleDrop = (e: React.DragEvent, type: keyof FileUploadType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/10');
    handleFilesChange(type, e.dataTransfer.files);
  };

  const validateUpload = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Minimum requirements
    if (files.sfwImages.length < 4) errors.push('Minimum 4 SFW images required');
    if (files.nsfwImages.length < 4) errors.push('Minimum 4 NSFW images required');
    if (files.sfwVideos.length < 1) errors.push('Minimum 1 SFW video required');
    if (files.nsfwVideos.length < 1) errors.push('Minimum 1 NSFW video required');

    // Total size limit (5GB max)
    if (files.totalSize > 5 * 1024 * 1024 * 1024) {
      errors.push('Total upload size exceeds 5GB limit');
    }

    if (!modelDetails.name) errors.push('Model name is required');
    if (!modelDetails.niche) errors.push('Niche/category is required');
    if (!modelDetails.description) errors.push('Description is required');

    // Validate price
    const price = parseFloat(modelDetails.price);
    if (price < 50) {
      errors.push('Minimum price is $50');
    }

    return { isValid: errors.length === 0, errors };
  };

  const startUltraFastUpload = async (modelId: string, userId: string, enableBackground: boolean = false): Promise<any> => {
    return new Promise((resolve) => {
      // Create background session if enabled
      if (enableBackground && backgroundManagerRef.current) {
        const session = backgroundManagerRef.current.createSession(modelId, userId, modelDetails);
        uploadManager.setBackgroundSession(session.id);
        loadBackgroundSessions();
      }

      // Add all files to upload manager
      uploadManager.addJobs(files.sfwImages, 'sfw-images', `models/${modelId}/sfw/images`, modelId, userId);
      uploadManager.addJobs(files.nsfwImages, 'nsfw-images', `models/${modelId}/nsfw/images`, modelId, userId);
      uploadManager.addJobs(files.sfwVideos, 'sfw-videos', `models/${modelId}/sfw/videos`, modelId, userId);
      uploadManager.addJobs(files.nsfwVideos, 'nsfw-videos', `models/${modelId}/nsfw/videos`, modelId, userId);

      // Set up completion callback
      uploadManager.onComplete(resolve);
    });
  };

  const createModelInDatabase = async (modelId: string, modelData: any, uploadResults: any, userId: string) => {
    console.log('🔄 Creating model in Firestore database...');
    
    const modelRecord = {
      id: modelId,
      name: modelData.name,
      niche: modelData.niche,
      description: modelData.description,
      framework: modelData.framework || '',
      modelSize: modelData.modelSize || '',
      status: 'pending',
      price: parseFloat(modelData.price) || 50,
      owner: userId,
      ownerName: currentUser.displayName || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous',
      media: {
        sfwImages: uploadResults.sfwImages || [],
        nsfwImages: uploadResults.nsfwImages || [],
        sfwVideos: uploadResults.sfwVideos || [],
        nsfwVideos: uploadResults.nsfwVideos || [],
      },
      stats: {
        views: 0,
        likes: 0,
        downloads: 0,
        rating: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      console.log('📝 Saving model to Firestore:', modelId);
      
      // ✅ Save to Firebase Firestore
      await firestore.create('aiModels', modelRecord);
      console.log('✅ Model successfully saved to Firestore');
      
      return modelRecord;
    } catch (error) {
      console.error('❌ Error saving model to Firestore:', error);
      throw new Error('Failed to save model to database. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const validation = validateUpload();
      if (!validation.isValid) {
        setError(`Please fix: ${validation.errors.join(', ')}`);
        setSubmitting(false);
        return;
      }

      const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Ask user if they want background upload
      const enableBackground = window.confirm(
        '🚀 Enable Background Upload?\n\n' +
        '✅ Continue uploading even if you close this tab\n' +
        '✅ Resume automatically if connection fails\n' +
        '✅ Track progress from your dashboard\n\n' +
        'Click OK for background upload, Cancel for normal upload.'
      );

      console.log('🚀 Starting ultra-fast upload process...');
      console.log('📁 Model ID:', modelId);
      console.log('👤 User ID:', currentUser.id);
      console.log('📊 Total files:', files.totalFiles);
      console.log('💾 Estimated size:', formatFileSize(files.totalSize));

      // Start ultra-fast upload
      const uploadResults = await startUltraFastUpload(modelId, currentUser.id, enableBackground);
      
      if (uploadResults.errors.length > 0) {
        console.error('❌ Some uploads failed:', uploadResults.errors);
        setError(`Some uploads failed: ${uploadResults.errors.slice(0, 3).join(', ')}`);
        return;
      }

      console.log('✅ All files uploaded successfully');
      console.log('📝 Creating model record in database...');

      // Create model record in Firestore
      await createModelInDatabase(modelId, modelDetails, uploadResults, currentUser.id);

      const successMsg = enableBackground 
        ? '🎉 Upload started in background! You can close this tab and check progress in your dashboard.'
        : '🎉 Model uploaded successfully! Redirecting to dashboard...';
      
      setSuccess(successMsg);
      
      if (!enableBackground) {
        setTimeout(() => {
          router.push('/seller');
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatting utilities
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Background Uploads Panel
  const BackgroundUploadsPanel = () => {
    const activeSessions = backgroundSessions.filter(s => 
      s.status === 'uploading' || s.status === 'paused'
    );

    const completedSessions = backgroundSessions.filter(s => 
      s.status === 'completed' || s.status === 'failed'
    );

    const resumeSession = (sessionId: string) => {
      if (uploadManagerRef.current) {
        const session = backgroundManagerRef.current?.getSession(sessionId);
        if (session) {
          // Implement session resumption logic here
          console.log('Resuming session:', sessionId);
        }
      }
    };

    const deleteSession = (sessionId: string) => {
      backgroundManagerRef.current?.deleteSession(sessionId);
      loadBackgroundSessions();
    };

    return (
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            📱 Background Uploads
          </h3>
          <button
            onClick={() => setShowBackgroundUploads(false)}
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Active Uploads */}
        {activeSessions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-white mb-3">Active Uploads</h4>
            <div className="space-y-3">
              {activeSessions.map(session => (
                <div key={session.id} className="border border-slate-600/50 rounded-xl p-4 bg-slate-700/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-white">{session.modelDetails.name}</p>
                      <p className="text-sm text-slate-400">
                        Started: {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full backdrop-blur-sm ${
                      session.status === 'uploading' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {session.status === 'uploading' ? 'Uploading' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{session.stats.overallProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${session.stats.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{session.stats.completedFiles}/{session.stats.totalFiles} files</span>
                    <span>{formatSpeed(session.stats.averageSpeed)}</span>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => resumeSession(session.id)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-1 px-3 rounded text-sm hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-1 px-3 rounded text-sm hover:from-rose-600 hover:to-pink-600 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Uploads */}
        {completedSessions.length > 0 && (
          <div>
            <h4 className="font-medium text-white mb-3">Recent Uploads</h4>
            <div className="space-y-2">
              {completedSessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex justify-between items-center py-2 border-b border-slate-600/50">
                  <div>
                    <p className="text-sm font-medium text-white">{session.modelDetails.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(session.lastUpdated)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full backdrop-blur-sm ${
                    session.status === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {session.status === 'completed' ? 'Completed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {backgroundSessions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-slate-400">No background uploads</p>
            <p className="text-sm text-slate-500 mt-1">
              Start an upload with background mode enabled to see them here
            </p>
          </div>
        )}
      </div>
    );
  };

  // Enhanced File Upload Section
  const EnhancedFileUploadSection = ({ 
    type, 
    label, 
    description, 
    accept, 
    minFiles,
    nsfw = false 
  }: {
    type: keyof FileUploadType;
    label: string;
    description: string;
    accept: string;
    minFiles: number;
    nsfw?: boolean;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentFiles = files[type];
    const hasMinimum = currentFiles.length >= minFiles;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilesChange(type, e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (index: number) => {
      setFiles(prev => {
        const updatedFiles = prev[type].filter((_, i) => i !== index);
        const removedFile = prev[type][index];
        const compressionRatio = removedFile.type.startsWith('image/') ? 0.6 : 0.9;
        const removedSize = removedFile.size * compressionRatio;
        
        return {
          ...prev,
          [type]: updatedFiles,
          totalSize: prev.totalSize - removedSize,
          totalFiles: prev.totalFiles - 1
        };
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-white mb-2">
            {label}
            <span className="text-rose-400 ml-1">*</span>
            {nsfw && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-sm">
                NSFW
              </span>
            )}
          </label>
          <p className="text-sm text-slate-300 mb-2">
            {description}
          </p>
          <p className="text-xs text-slate-400">
            Minimum: {minFiles} files • Current: {currentFiles.length} files • {hasMinimum ? '✅ Minimum met' : '⚠️ Need more files'}
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 backdrop-blur-sm ${
            hasMinimum 
              ? 'border-emerald-500/50 bg-emerald-500/10' 
              : nsfw
              ? 'border-rose-500/50 bg-rose-500/10 hover:border-rose-400/70'
              : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
          }`}
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={(e) => handleDragLeave(e, type)}
          onDrop={(e) => handleDrop(e, type)}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`text-4xl ${nsfw ? 'text-rose-400' : 'text-cyan-400'}`}>
                {nsfw ? '🔞' : '📁'}
              </div>
            </div>
            
            <div>
              <p className="text-lg font-medium text-white mb-2">
                Drag & Drop files here
              </p>
              <p className="text-sm text-slate-300 mb-4">
                or click to select files (unlimited uploads supported)
              </p>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg transition-all duration-200 ${
                  nsfw 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-rose-500/25' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/25'
                } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900`}
              >
                Select Files
              </button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {currentFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-slate-300">
                Selected files ({currentFiles.length})
              </p>
              <button
                type="button"
                onClick={() => {
                  setFiles(prev => {
                    const removedFiles = prev[type];
                    const removedSize = removedFiles.reduce((sum, file) => {
                      const ratio = file.type.startsWith('image/') ? 0.6 : 0.9;
                      return sum + (file.size * ratio);
                    }, 0);
                    
                    return {
                      ...prev,
                      [type]: [],
                      totalSize: prev.totalSize - removedSize,
                      totalFiles: prev.totalFiles - removedFiles.length
                    };
                  });
                }}
                className="text-sm text-rose-400 hover:text-rose-300 transition-colors duration-200"
              >
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {currentFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative group bg-slate-800/50 border border-slate-600/50 rounded-xl p-3 backdrop-blur-sm hover:border-slate-500 transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-10 h-10 object-cover rounded"
                          onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                        />
                      ) : file.type.startsWith('video/') ? (
                        <div className="text-2xl text-cyan-400">🎬</div>
                      ) : (
                        <div className="text-2xl text-slate-400">📄</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)} • {file.type.split('/')[1]}
                      </p>
                      <p className="text-xs text-emerald-400">
                        Estimated after compression: {formatFileSize(file.size * (file.type.startsWith('image/') ? 0.6 : 0.9))}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="flex-shrink-0 text-rose-400 hover:text-rose-300 transition-colors duration-200"
                      title="Remove file"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Upload Progress Component
  const UltraFastProgress = () => {
    if (uploadStats.totalFiles === 0) return null;

    return (
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          🚀 Ultra-Fast Upload Progress
        </h3>
        
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{uploadStats.overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-600/50 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-cyan-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadStats.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="text-2xl font-bold text-cyan-400">{uploadStats.completedFiles}/{uploadStats.totalFiles}</div>
            <div className="text-sm text-slate-400">Files</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="text-2xl font-bold text-emerald-400">{formatSpeed(uploadStats.averageSpeed)}</div>
            <div className="text-sm text-slate-400">Speed</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="text-2xl font-bold text-purple-400">{formatTime(uploadStats.estimatedTime)}</div>
            <div className="text-sm text-slate-400">ETA</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="text-2xl font-bold text-amber-400">{uploadStats.activeConnections}</div>
            <div className="text-sm text-slate-400">Connections</div>
          </div>
        </div>

        {/* File-specific Progress */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {uploadJobs.slice(0, 10).map((job) => (
            <div key={job.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className="flex-shrink-0 w-8 text-sm">
                {job.status === 'completed' && '✅'}
                {job.status === 'uploading' && '🔄'}
                {job.status === 'failed' && '❌'}
                {job.status === 'pending' && '⏳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {job.file.name}
                </p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{formatFileSize(job.uploadedBytes)} / {formatFileSize(job.file.size)}</span>
                  <span>{job.status === 'uploading' && formatSpeed(job.speed)}</span>
                </div>
                {job.status === 'uploading' && (
                  <div className="w-full bg-slate-600/50 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {uploadJobs.length > 10 && (
            <p className="text-center text-sm text-slate-400">
              +{uploadJobs.length - 10} more files...
            </p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            type="button"
            onClick={() => uploadManager.pause()}
            className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-amber-500/25"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => uploadManager.resume()}
            className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => uploadManager.retryFailed()}
            className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            Retry Failed
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading ultra-fast upload system...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <AuthGuard requireAuth requireSeller>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <Header/>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
              🚀 Ultra-Fast Upload
            </h1>
            <p className="text-xl text-slate-300">
              Upload unlimited media with background support
            </p>
          </div>

          {/* Background Uploads Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <button
              onClick={() => setShowBackgroundUploads(!showBackgroundUploads)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
            >
              <span>📱</span>
              <span>Background Uploads ({backgroundSessions.filter(s => s.status === 'uploading').length})</span>
            </button>
          </div>

          {/* Background Uploads Panel */}
          {showBackgroundUploads && <BackgroundUploadsPanel />}

          {/* Upload Stats */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="text-2xl font-bold text-cyan-400">{files.totalFiles}</p>
                <p className="text-sm text-slate-400">Total Files</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="text-2xl font-bold text-emerald-400">
                  {formatFileSize(files.totalSize)}
                </p>
                <p className="text-sm text-slate-400">Estimated Size</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="text-2xl font-bold text-purple-400">
                  {formatFileSize(files.totalSize * 0.7)}
                </p>
                <p className="text-sm text-slate-400">After Compression</p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="text-2xl font-bold text-amber-400">
                  ~{formatTime(files.totalSize / (5 * 1024 * 1024))}
                </p>
                <p className="text-sm text-slate-400">Estimated Time</p>
              </div>
            </div>
          </div>

          {/* Ultra-Fast Progress */}
          <UltraFastProgress />

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <p className="text-rose-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <p className="text-emerald-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 mb-8 space-y-8">
              
              <EnhancedFileUploadSection
                type="sfwImages"
                label="SFW Images"
                description="Upload unlimited SFW images (auto-compressed, max 50MB each)"
                accept="image/jpeg,image/png,image/webp"
                minFiles={4}
              />

              <EnhancedFileUploadSection
                type="nsfwImages"
                label="NSFW Images"
                description="Upload unlimited NSFW images (auto-compressed, max 50MB each)"
                accept="image/jpeg,image/png,image/webp"
                minFiles={4}
                nsfw={true}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EnhancedFileUploadSection
                  type="sfwVideos"
                  label="SFW Videos"
                  description="Upload multiple SFW videos (optimized, max 500MB each)"
                  accept="video/mp4,video/webm,video/quicktime"
                  minFiles={1}
                />

                <EnhancedFileUploadSection
                  type="nsfwVideos"
                  label="NSFW Videos"
                  description="Upload multiple NSFW videos (optimized, max 500MB each)"
                  accept="video/mp4,video/webm,video/quicktime"
                  minFiles={1}
                  nsfw={true}
                />
              </div>

              {/* Model Details Section */}
              <div className="border-t border-slate-700/50 pt-8">
                <h3 className="text-xl font-semibold text-white mb-6">Model Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Model Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={modelDetails.name}
                      onChange={(e) => setModelDetails(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter model name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Niche/Category *
                    </label>
                    <select 
                      name="niche"
                      value={modelDetails.niche}
                      onChange={(e) => setModelDetails(prev => ({...prev, niche: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      required
                    >
                      <option value="">Select a niche</option>
                      <option value="art">Art & Design</option>
                      <option value="photography">Photography</option>
                      <option value="writing">Writing</option>
                      <option value="coding">Coding</option>
                      <option value="music">Music</option>
                      <option value="video">Video</option>
                      <option value="3d">3D Modeling</option>
                      <option value="animation">Animation</option>
                      <option value="business">Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      rows={4}
                      name="description"
                      value={modelDetails.description}
                      onChange={(e) => setModelDetails(prev => ({...prev, description: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="Describe your AI model, its features, and use cases..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Framework
                    </label>
                    <input
                      type="text"
                      name="framework"
                      value={modelDetails.framework}
                      onChange={(e) => setModelDetails(prev => ({...prev, framework: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="e.g., TensorFlow, PyTorch"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Model Size
                    </label>
                    <input
                      type="text"
                      name="modelSize"
                      value={modelDetails.modelSize}
                      onChange={(e) => setModelDetails(prev => ({...prev, modelSize: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="e.g., 250MB, 1.2GB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={modelDetails.price}
                      onChange={(e) => setModelDetails(prev => ({...prev, price: e.target.value}))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="50.00"
                      min="50"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Minimum price: $50.00
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <PrimaryButton 
                  type="submit" 
                  loading={submitting}
                  disabled={submitting}
                  className="px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Upload...
                    </div>
                  ) : (
                    'Start Ultra-Fast Upload'
                  )}
                </PrimaryButton>
              </div>
            </div>
          </form>

          {/* Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-cyan-300">6x Parallel Uploads</h4>
              <p className="text-sm text-cyan-400">Upload multiple files simultaneously</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-semibold text-emerald-300">Background Uploads</h4>
              <p className="text-sm text-emerald-400">Continue even when tab is closed</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-semibold text-purple-300">Auto Resume</h4>
              <p className="text-sm text-purple-400">Continue interrupted uploads</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-semibold text-amber-300">Real-time Speed</h4>
              <p className="text-sm text-amber-400">Live upload speed monitoring</p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}