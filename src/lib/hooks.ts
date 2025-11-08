import { useState, useEffect } from 'react';
import { User, UploadProgress, FirebaseUser, FileUploadType, ModelUploadResults } from '@/types';
import { authService, storageService } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper function to check if we're on client side
const isClient = typeof window !== 'undefined';

// Get db instance with proper typing
const getDb = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  // Import db only on client side to avoid SSR issues
  const { db } = require('./firebase');
  return db;
};

// Authentication Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (!isClient) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (!mounted) return;

      try {
        const db = getDb();
        if (!db) {
          setLoading(false);
          return;
        }

        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (mounted) {
              setUser(userData);
            }
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid, // Added missing id field
              username: firebaseUser.email!.split('@')[0], // Added missing username field
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              email: firebaseUser.email!,
              role: 'buyer',
              subscription: { 
                id: 'sub_default', // Added required id field
                planId: 'plan_buyer', // Added required planId field
                type: 'buyer',
                amount: 0, // Added required amount field
                status: 'active',
                purchasedAt: new Date().toISOString(), // Using expiresAt instead of currentPeriodEnd
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                paymentMethod: 'card', // Added required paymentMethod field
                features: { // Added required features field
                  maxModels: 0,
                  listingDuration: 0,
                  revenueShare: 0
                }
              },
              profile: { 
                displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0], 
                ageVerified: false, 
                bio: '' 
              },
              stats: { 
                totalListings: 0, 
                totalSales: 0, 
                rating: 0 
              },
              earnings: { // Added missing earnings field
                total: 0,
                available: 0,
                pending: 0,
                paidOut: 0
              },
              availableListings: 0, // Added missing availableListings field
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            if (mounted) {
              setUser(newUser);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        if (mounted) {
          setError('Failed to load user data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      return await authService.login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      return await authService.register(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  const updateUserProfile = async (updates: Partial<User['profile']>) => {
    if (!user) return;
    
    try {
      setError(null);
      const db = getDb();
      if (!db) return;

      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        profile: { ...user.profile, ...updates },
        updatedAt: new Date()
      }, { merge: true });
      
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...updates } } : null);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  return { 
    user, 
    loading, 
    error,
    login, 
    register, 
    logout, 
    updateUserProfile 
  };
};

// Enhanced Storage Hook with Firebase integration
export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadFile = async (
    file: File, 
    path: string, 
    metadata: any = {}
  ): Promise<string> => {
    setUploading(true);
    setProgress(0);

    const uploadItem: UploadProgress = { 
      file, 
      progress: 0, 
      status: 'uploading',
      fileName: file.name,
      fileSize: file.size
    };
    
    setUploads(prev => [...prev, uploadItem]);
    const uploadIndex = uploads.length;

    try {
      const downloadURL = await storageService.uploadFile(
        file, 
        path, 
        (uploadProgress) => {
          setProgress(uploadProgress);
          setUploads(prev => prev.map((item, index) => 
            index === uploadIndex ? { ...item, progress: uploadProgress } : item
          ));
        }, 
        metadata
      );

      setUploads(prev => prev.map((item, index) =>
        index === uploadIndex ? { 
          ...item, 
          status: 'completed', 
          downloadURL,
          progress: 100
        } : item
      ));
      
      return downloadURL;
    } catch (error) {
      setUploads(prev => prev.map((item, index) =>
        index === uploadIndex ? { 
          ...item, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0
        } : item
      ));
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadModelMedia = async (
    files: FileUploadType,
    modelId: string,
    userId: string
  ): Promise<ModelUploadResults> => {
    setUploading(true);
    setProgress(0);
    
    const results: ModelUploadResults = {
      sfwImages: [] as string[],
      nsfwImages: [] as string[],
      sfwVideos: [] as string[],
      nsfwVideos: [] as string[],
      errors: [] as string[]
    };

    try {
      // Upload SFW Images
      if (files.sfwImages.length > 0) {
        const sfwResults = await storageService.uploadMultipleFiles(
          files.sfwImages,
          `models/${modelId}/sfw/images`,
          (uploadProgress) => setProgress(uploadProgress),
          { owner: userId, type: 'sfw-image', modelId }
        );
        
        sfwResults.forEach(result => {
          if (result.url) {
            results.sfwImages.push(result.url);
          } else if (result.error) {
            results.errors.push(`SFW Image ${result.file.name}: ${result.error}`);
          }
        });
      }

      // Upload NSFW Images
      if (files.nsfwImages.length > 0) {
        const nsfwResults = await storageService.uploadMultipleFiles(
          files.nsfwImages,
          `models/${modelId}/nsfw/images`,
          (uploadProgress) => setProgress(uploadProgress),
          { owner: userId, type: 'nsfw-image', modelId }
        );
        
        nsfwResults.forEach(result => {
          if (result.url) {
            results.nsfwImages.push(result.url);
          } else if (result.error) {
            results.errors.push(`NSFW Image ${result.file.name}: ${result.error}`);
          }
        });
      }

      // Upload SFW Videos
      if (files.sfwVideos.length > 0) {
        const sfwVideoResults = await storageService.uploadMultipleFiles(
          files.sfwVideos,
          `models/${modelId}/sfw/videos`,
          (uploadProgress) => setProgress(uploadProgress),
          { owner: userId, type: 'sfw-video', modelId }
        );
        
        sfwVideoResults.forEach(result => {
          if (result.url) {
            results.sfwVideos.push(result.url);
          } else if (result.error) {
            results.errors.push(`SFW Video ${result.file.name}: ${result.error}`);
          }
        });
      }

      // Upload NSFW Videos
      if (files.nsfwVideos.length > 0) {
        const nsfwVideoResults = await storageService.uploadMultipleFiles(
          files.nsfwVideos,
          `models/${modelId}/nsfw/videos`,
          (uploadProgress) => setProgress(uploadProgress),
          { owner: userId, type: 'nsfw-video', modelId }
        );
        
        nsfwVideoResults.forEach(result => {
          if (result.url) {
            results.nsfwVideos.push(result.url);
          } else if (result.error) {
            results.errors.push(`NSFW Video ${result.file.name}: ${result.error}`);
          }
        });
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      results.errors.push(errorMessage);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clearUploads = () => setUploads([]);

  return { 
    uploadFile, 
    uploadModelMedia, 
    uploading, 
    progress, 
    uploads, 
    clearUploads 
  };
};

// Payment Hook
export const usePayment = () => {
  const [processing, setProcessing] = useState(false);

  const createSubscription = async (user: User, subscriptionType: 'basic' | 'seller') => {
    setProcessing(true);
    try {
      // Simulate API call - will be replaced with actual Stripe integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: true, 
        subscriptionId: `sub_${Date.now()}`, 
        clientSecret: `cs_test_${Date.now()}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    } finally {
      setProcessing(false);
    }
  };

  const createModelListingPayment = async (user: User, modelId: string) => {
    setProcessing(true);
    try {
      // Simulate API call - will be replaced with actual Stripe integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: true, 
        paymentIntentId: `pi_${Date.now()}`, 
        clientSecret: `cs_test_${Date.now()}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    } finally {
      setProcessing(false);
    }
  };

  return { processing, createSubscription, createModelListingPayment };
};

// Upload Management Hook
export const useUploadManager = () => {
  const [files, setFiles] = useState<FileUploadType>({
    sfwImages: [] as File[], 
    nsfwImages: [] as File[], 
    sfwVideos: [] as File[], 
    nsfwVideos: [] as File[]
  });

  const { uploadModelMedia, uploading, progress, uploads } = useStorage();

  const validateUpload = () => {
    const errors: string[] = [];
    
    // Validate counts
    if (files.sfwImages.length !== 4) errors.push('Exactly 4 SFW images are required');
    if (files.nsfwImages.length !== 4) errors.push('Exactly 4 NSFW images are required');
    if (files.sfwVideos.length !== 1) errors.push('Exactly 1 SFW video is required');
    if (files.nsfwVideos.length !== 1) errors.push('Exactly 1 NSFW video is required');

    // Validate file types and sizes
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    [...files.sfwImages, ...files.nsfwImages].forEach((file: File) => {
      if (!imageTypes.includes(file.type)) errors.push(`Invalid image type: ${file.name}`);
      if (file.size > 10 * 1024 * 1024) errors.push(`Image too large: ${file.name} (max 10MB)`);
    });

    [...files.sfwVideos, ...files.nsfwVideos].forEach((file: File) => {
      if (!videoTypes.includes(file.type)) errors.push(`Invalid video type: ${file.name}`);
      if (file.size > 100 * 1024 * 1024) errors.push(`Video too large: ${file.name} (max 100MB)`);
    });

    return { isValid: errors.length === 0, errors };
  };

  const uploadAllFiles = async (modelId: string, userId: string): Promise<ModelUploadResults> => {
    return await uploadModelMedia(files, modelId, userId);
  };

  const clearFiles = () => {
    setFiles({
      sfwImages: [], 
      nsfwImages: [], 
      sfwVideos: [], 
      nsfwVideos: []
    });
  };

  return { 
    files, 
    setFiles, 
    validateUpload, 
    uploadAllFiles, 
    clearFiles, 
    uploading, 
    progress,
    uploads
  };
};