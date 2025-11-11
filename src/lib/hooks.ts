import { useState, useEffect } from 'react';
import { User, UploadProgress, FirebaseUser, FileUploadType, ModelUploadResults, EmailVerificationResult, PasswordResetState } from '@/types';
import { authService, storageService, userService } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

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

// Get auth instance with proper typing
const getAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  // Import auth only on client side to avoid SSR issues
  const { auth } = require('./firebase');
  return auth;
};

// Enhanced Authentication Hook with Email Verification
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

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
            
            // Update email verification status from Firebase Auth
            const updatedUser = {
              ...userData,
              emailVerified: firebaseUser.emailVerified || userData.emailVerified
            };

            if (mounted) {
              setUser(updatedUser);
            }

            // Update Firestore with current email verification status
            if (userData.emailVerified !== firebaseUser.emailVerified) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                emailVerified: firebaseUser.emailVerified,
                updatedAt: new Date().toISOString()
              });
            }
          } else {
            // Create new user document if it doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              username: firebaseUser.email!.split('@')[0],
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              email: firebaseUser.email!,
              emailVerified: firebaseUser.emailVerified || false,
              role: 'buyer',
              subscription: { 
                id: 'sub_default',
                planId: 'plan_buyer',
                type: 'buyer',
                amount: 0,
                status: 'active',
                purchasedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                paymentMethod: 'card',
                features: {
                  maxModels: 0,
                  listingDuration: 0,
                  revenueShare: 0
                }
              },
              profile: { 
                displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0], 
                ageVerified: false, 
                bio: '',
                profilePicture: ''
              },
              stats: { 
                totalListings: 0, 
                totalSales: 0, 
                rating: 0,
                totalPurchases: 0
              },
              earnings: {
                total: 0,
                available: 0,
                pending: 0,
                paidOut: 0
              },
              availableListings: 0,
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
      const userCredential = await authService.register(email, password);
      
      // Send email verification after registration
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        setEmailVerificationSent(true);
      }
      
      return userCredential;
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
      setEmailVerificationSent(false);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      setError(null);
      const db = getDb();
      if (!db) return;

      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date()
      });
      
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  const resendEmailVerification = async (): Promise<EmailVerificationResult> => {
    try {
      setError(null);
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        return { success: false, message: 'No user logged in' };
      }

      await sendEmailVerification(currentUser);
      setEmailVerificationSent(true);
      
      return { 
        success: true, 
        message: 'Verification email sent successfully. Please check your inbox.' 
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send verification email';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Reload user to get latest email verification status
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await currentUser.reload();
        return currentUser.emailVerified;
      }
      return user.emailVerified || false;
    } catch (err) {
      console.error('Error checking email verification:', err);
      return user.emailVerified || false;
    }
  };

  return { 
    user, 
    loading, 
    error,
    emailVerificationSent,
    login, 
    register, 
    logout, 
    updateUserProfile,
    resendEmailVerification,
    checkEmailVerification
  };
};

// Password Reset Hook
export const usePasswordReset = () => {
  const [state, setState] = useState<PasswordResetState>({
    loading: false,
    error: null,
    success: false,
    email: undefined
  });

  const resetPassword = async (email: string) => {
    setState({ loading: true, error: null, success: false, email });
    
    try {
      // Use authService instead of direct auth import
      await authService.sendPasswordResetEmail(email);
      setState({ loading: false, error: null, success: true, email });
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email.';
      }
      
      setState({ loading: false, error: errorMessage, success: false, email });
    }
  };

  const resetState = () => {
    setState({ loading: false, error: null, success: false, email: undefined });
  };

  return {
    ...state,
    resetPassword,
    resetState
  };
};

// Email Verification Hook
export const useEmailVerification = () => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkEmailVerification = async (user: User): Promise<boolean> => {
    if (!user.emailVerified) {
      setError('Please verify your email address to access this feature.');
      return false;
    }
    return true;
  };

  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    setVerifying(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Use userService to resend verification email
      const result = await userService.resendEmailVerification(email);
      setSuccess(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const clearState = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    verifying,
    error,
    success,
    checkEmailVerification,
    resendVerificationEmail,
    clearState
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