'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, FileUploadType, ModelUploadResults, UploadProgress } from '@/types';
import { storageService } from '@/lib/firebase';

// ===== UPLOAD CONTEXT =====
interface UploadContextType {
  files: FileUploadType;
  setFiles: React.Dispatch<React.SetStateAction<FileUploadType>>;
  validateUpload: () => { isValid: boolean; errors: string[] };
  uploadAllFiles: (modelId: string, userId: string) => Promise<ModelUploadResults>;
  clearFiles: () => void;
  uploading: boolean;
  progress: number;
  uploads: UploadProgress[];
}

// Create context with a default value to avoid undefined issues
const defaultUploadContext: UploadContextType = {
  files: {
    sfwImages: [],
    nsfwImages: [],
    sfwVideos: [],
    nsfwVideos: []
  },
  setFiles: () => {},
  validateUpload: () => ({ isValid: false, errors: [] }),
  uploadAllFiles: async () => ({
    sfwImages: [],
    nsfwImages: [],
    sfwVideos: [],
    nsfwVideos: [],
    errors: []
  }),
  clearFiles: () => {},
  uploading: false,
  progress: 0,
  uploads: []
};

const UploadContext = createContext<UploadContextType>(defaultUploadContext);

export const UploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileUploadType>({
    sfwImages: [],
    nsfwImages: [],
    sfwVideos: [],
    nsfwVideos: []
  });

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  // Debug: Log when files change
  useEffect(() => {
    console.log('📁 FILES STATE UPDATED:', {
      sfwImages: files.sfwImages.map(f => ({ name: f.name, size: f.size, type: f.type })),
      nsfwImages: files.nsfwImages.map(f => ({ name: f.name, size: f.size, type: f.type })),
      sfwVideos: files.sfwVideos.map(f => ({ name: f.name, size: f.size, type: f.type })),
      nsfwVideos: files.nsfwVideos.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
  }, [files]);

  const validateUpload = (): { isValid: boolean; errors: string[] } => {
    console.log('🔍 VALIDATING UPLOAD...');
    
    const errors: string[] = [];
    
    // Validate counts
    if (files.sfwImages.length !== 4) {
      errors.push('Exactly 4 SFW images are required');
      console.log('❌ SFW Images count:', files.sfwImages.length, 'expected: 4');
    }
    if (files.nsfwImages.length !== 4) {
      errors.push('Exactly 4 NSFW images are required');
      console.log('❌ NSFW Images count:', files.nsfwImages.length, 'expected: 4');
    }
    if (files.sfwVideos.length !== 1) {
      errors.push('Exactly 1 SFW video is required');
      console.log('❌ SFW Videos count:', files.sfwVideos.length, 'expected: 1');
    }
    if (files.nsfwVideos.length !== 1) {
      errors.push('Exactly 1 NSFW video is required');
      console.log('❌ NSFW Videos count:', files.nsfwVideos.length, 'expected: 1');
    }

    // Validate file types and sizes
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    [...files.sfwImages, ...files.nsfwImages].forEach((file: File) => {
      if (!imageTypes.includes(file.type)) {
        errors.push(`Invalid image type: ${file.name}`);
        console.log('❌ Invalid image type:', file.name, file.type);
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`Image too large: ${file.name} (max 10MB)`);
        console.log('❌ Image too large:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    [...files.sfwVideos, ...files.nsfwVideos].forEach((file: File) => {
      if (!videoTypes.includes(file.type)) {
        errors.push(`Invalid video type: ${file.name}`);
        console.log('❌ Invalid video type:', file.name, file.type);
      }
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`Video too large: ${file.name} (max 100MB)`);
        console.log('❌ Video too large:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    const isValid = errors.length === 0;
    console.log('✅ VALIDATION RESULT:', { isValid, errors });
    
    return { isValid, errors };
  };

  const uploadAllFiles = async (modelId: string, userId: string): Promise<ModelUploadResults> => {
    console.log('🚀 STARTING REAL FIREBASE UPLOAD PROCESS...', { modelId, userId });
    console.log('📦 FILES TO UPLOAD:', {
      sfwImages: files.sfwImages.length,
      nsfwImages: files.nsfwImages.length,
      sfwVideos: files.sfwVideos.length,
      nsfwVideos: files.nsfwVideos.length
    });

    setUploading(true);
    setProgress(0);
    setUploads([]);
    
    const results: ModelUploadResults = {
      sfwImages: [],
      nsfwImages: [],
      sfwVideos: [],
      nsfwVideos: [],
      errors: []
    };

    try {
      // Upload SFW Images to Firebase Storage
      if (files.sfwImages.length > 0) {
        console.log('📤 Uploading SFW images to Firebase...');
        const sfwResults = await storageService.uploadMultipleFiles(
          files.sfwImages,
          `models/${modelId}/sfw/images`,
          (uploadProgress) => {
            console.log(`📊 SFW Images Upload Progress: ${uploadProgress}%`);
            setProgress(uploadProgress);
          },
          { owner: userId, type: 'sfw-image', modelId }
        );
        
        sfwResults.forEach(result => {
          if (result.url) {
            results.sfwImages.push(result.url);
            console.log(`✅ SFW Image uploaded: ${result.file.name} -> ${result.url}`);
            
            // Add to uploads state for UI
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 100,
              status: 'completed',
              fileName: result.file.name,
              fileSize: result.file.size,
              downloadURL: result.url
            }]);
          } else if (result.error) {
            results.errors.push(`SFW Image ${result.file.name}: ${result.error}`);
            console.log(`❌ SFW Image upload failed: ${result.file.name} - ${result.error}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 0,
              status: 'error',
              fileName: result.file.name,
              fileSize: result.file.size,
              error: result.error
            }]);
          }
        });
      }

      // Upload NSFW Images to Firebase Storage
      if (files.nsfwImages.length > 0) {
        console.log('📤 Uploading NSFW images to Firebase...');
        const nsfwResults = await storageService.uploadMultipleFiles(
          files.nsfwImages,
          `models/${modelId}/nsfw/images`,
          (uploadProgress) => {
            console.log(`📊 NSFW Images Upload Progress: ${uploadProgress}%`);
            setProgress(uploadProgress);
          },
          { owner: userId, type: 'nsfw-image', modelId }
        );
        
        nsfwResults.forEach(result => {
          if (result.url) {
            results.nsfwImages.push(result.url);
            console.log(`✅ NSFW Image uploaded: ${result.file.name} -> ${result.url}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 100,
              status: 'completed',
              fileName: result.file.name,
              fileSize: result.file.size,
              downloadURL: result.url
            }]);
          } else if (result.error) {
            results.errors.push(`NSFW Image ${result.file.name}: ${result.error}`);
            console.log(`❌ NSFW Image upload failed: ${result.file.name} - ${result.error}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 0,
              status: 'error',
              fileName: result.file.name,
              fileSize: result.file.size,
              error: result.error
            }]);
          }
        });
      }

      // Upload SFW Videos to Firebase Storage
      if (files.sfwVideos.length > 0) {
        console.log('📤 Uploading SFW videos to Firebase...');
        const sfwVideoResults = await storageService.uploadMultipleFiles(
          files.sfwVideos,
          `models/${modelId}/sfw/videos`,
          (uploadProgress) => {
            console.log(`📊 SFW Videos Upload Progress: ${uploadProgress}%`);
            setProgress(uploadProgress);
          },
          { owner: userId, type: 'sfw-video', modelId }
        );
        
        sfwVideoResults.forEach(result => {
          if (result.url) {
            results.sfwVideos.push(result.url);
            console.log(`✅ SFW Video uploaded: ${result.file.name} -> ${result.url}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 100,
              status: 'completed',
              fileName: result.file.name,
              fileSize: result.file.size,
              downloadURL: result.url
            }]);
          } else if (result.error) {
            results.errors.push(`SFW Video ${result.file.name}: ${result.error}`);
            console.log(`❌ SFW Video upload failed: ${result.file.name} - ${result.error}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 0,
              status: 'error',
              fileName: result.file.name,
              fileSize: result.file.size,
              error: result.error
            }]);
          }
        });
      }

      // Upload NSFW Videos to Firebase Storage
      if (files.nsfwVideos.length > 0) {
        console.log('📤 Uploading NSFW videos to Firebase...');
        const nsfwVideoResults = await storageService.uploadMultipleFiles(
          files.nsfwVideos,
          `models/${modelId}/nsfw/videos`,
          (uploadProgress) => {
            console.log(`📊 NSFW Videos Upload Progress: ${uploadProgress}%`);
            setProgress(uploadProgress);
          },
          { owner: userId, type: 'nsfw-video', modelId }
        );
        
        nsfwVideoResults.forEach(result => {
          if (result.url) {
            results.nsfwVideos.push(result.url);
            console.log(`✅ NSFW Video uploaded: ${result.file.name} -> ${result.url}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 100,
              status: 'completed',
              fileName: result.file.name,
              fileSize: result.file.size,
              downloadURL: result.url
            }]);
          } else if (result.error) {
            results.errors.push(`NSFW Video ${result.file.name}: ${result.error}`);
            console.log(`❌ NSFW Video upload failed: ${result.file.name} - ${result.error}`);
            
            setUploads(prev => [...prev, {
              file: result.file,
              progress: 0,
              status: 'error',
              fileName: result.file.name,
              fileSize: result.file.size,
              error: result.error
            }]);
          }
        });
      }

      console.log('✅ FIREBASE UPLOAD COMPLETED:', {
        sfwImages: results.sfwImages.length,
        nsfwImages: results.nsfwImages.length,
        sfwVideos: results.sfwVideos.length,
        nsfwVideos: results.nsfwVideos.length,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      console.error('❌ FIREBASE UPLOAD FAILED:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      results.errors.push(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(100);
      console.log('🏁 UPLOAD PROCESS FINISHED');
    }
  };

  const clearFiles = () => {
    console.log('🗑️ CLEARING ALL FILES');
    setFiles({
      sfwImages: [],
      nsfwImages: [],
      sfwVideos: [],
      nsfwVideos: []
    });
    setUploads([]);
  };

  const value: UploadContextType = {
    files,
    setFiles,
    validateUpload,
    uploadAllFiles,
    clearFiles,
    uploading,
    progress,
    uploads
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadContext = (): UploadContextType => {
  const context = useContext(UploadContext);
  console.log('🎯 useUploadContext called, context:', context ? 'VALID' : 'INVALID');
  return context;
};

// ===== AUTH CONTEXT =====
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User['profile']>) => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock auth implementation - replace with your actual auth logic
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - using the correct Subscription type structure
      const mockUser: User = {
        uid: '123',
        id: 'user_123',
        username: email.split('@')[0],
        displayName: email.split('@')[0],
        email: email,
        role: 'seller',
        subscription: {
          id: 'sub_123',
          planId: 'plan_seller',
          type: 'seller',
          amount: 29.99,
          status: 'active',
          purchasedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          paymentMethod: 'card',
          features: {
            maxModels: 10,
            listingDuration: 30,
            revenueShare: 80
          }
        },
        profile: {
          displayName: email.split('@')[0],
          ageVerified: true,
          bio: ''
        },
        stats: {
          totalListings: 0,
          totalSales: 0,
          rating: 0
        },
        earnings: {
          total: 0,
          available: 0,
          pending: 0,
          paidOut: 0
        },
        availableListings: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUser(mockUser);
      return mockUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    // Similar implementation to login
    return login(email, password);
  };

  const logout = async () => {
    setUser(null);
  };

  const updateUserProfile = async (updates: Partial<User['profile']>) => {
    if (user) {
      setUser({
        ...user,
        profile: { ...user.profile, ...updates }
      });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  return useContext(AuthContext);
};

// ===== PAYMENT CONTEXT =====
interface PaymentContextType {
  processing: boolean;
  createSubscription: (user: User, subscriptionType: 'basic' | 'seller') => Promise<any>;
  createModelListingPayment: (user: User, modelId: string) => Promise<any>;
}

const defaultPaymentContext: PaymentContextType = {
  processing: false,
  createSubscription: async () => ({}),
  createModelListingPayment: async () => ({})
};

const PaymentContext = createContext<PaymentContextType>(defaultPaymentContext);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [processing, setProcessing] = useState(false);

  const createSubscription = async (user: User, subscriptionType: 'basic' | 'seller') => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    } finally {
      setProcessing(false);
    }
  };

  const createModelListingPayment = async (user: User, modelId: string) => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    } finally {
      setProcessing(false);
    }
  };

  const value: PaymentContextType = {
    processing,
    createSubscription,
    createModelListingPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePaymentContext = (): PaymentContextType => {
  return useContext(PaymentContext);
};