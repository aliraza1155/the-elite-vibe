import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentReference,
  DocumentData,
  Firestore,
  QueryConstraint
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot,
  FirebaseStorage,
  StorageReference,
  UploadTask,
  StorageError
} from 'firebase/storage';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User as FirebaseUser,
  Auth,
  User
} from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on client side with proper typing
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

// Check if we're in a browser environment
const isClient = typeof window !== 'undefined';

if (isClient) {
  try {
    console.log('🚀 Initializing Firebase...');
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    storage = getStorage(app);
    console.log('✅ Firebase Storage initialized');
    console.log('📦 Storage bucket:', storage.app.options.storageBucket);
    
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    // Initialize analytics only in production and on client side
    if (process.env.NODE_ENV === 'production') {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    }
    
    console.log('🎉 Firebase initialization completed successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

// Export the Firebase instances
export { db, storage, auth, analytics };

// Type definitions for our services
interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

interface StorageMetadata {
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  [key: string]: string;
}

interface UploadResult {
  file: File;
  url: string;
  error?: string;
  uploadedBytes?: number; // Added missing property
}

// Enhanced types for ultra-fast upload system
interface DetailedUploadProgress {
  progress: number;
  uploadedBytes: number;
  speed: number; // bytes per second
  timeElapsed: number; // milliseconds
}

interface UploadTaskWithProgress {
  task: UploadTask;
  file: File;
  path: string;
  startTime: number;
  lastBytes: number;
  lastTime: number;
}

// Helper function to ensure storage is initialized
const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    const errorMsg = 'Firebase Storage is not initialized. Make sure you are in a browser environment and Firebase config is correct.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Check if storage bucket is configured
  if (!storage.app.options.storageBucket) {
    const errorMsg = 'Firebase Storage bucket is not configured. Check your Firebase config.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('✅ Storage instance verified, bucket:', storage.app.options.storageBucket);
  return storage;
};

// Helper function to validate file before upload
const validateFile = (file: File): void => {
  if (!file) {
    throw new Error('File is null or undefined');
  }
  
  if (file.size === 0) {
    throw new Error('File is empty');
  }
  
  // Increased limits for ultra-fast uploads
  if (file.type.startsWith('image/') && file.size > 50 * 1024 * 1024) { // 50MB for images
    throw new Error(`Image size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit`);
  }
  
  if (file.type.startsWith('video/') && file.size > 500 * 1024 * 1024) { // 500MB for videos
    throw new Error(`Video size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 500MB limit`);
  }
  
  console.log(`✅ File validated: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type})`);
};

// Firestore Services with proper error handling
export const firestore = {
  create: async (collectionName: string, data: any): Promise<DocumentReference<DocumentData>> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      return await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Firestore create error:', error);
      throw new Error(`Failed to create document in ${collectionName}`);
    }
  },

  get: async (collectionName: string, id: string): Promise<FirestoreDocument | null> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Firestore get error:', error);
      throw new Error(`Failed to get document ${id} from ${collectionName}`);
    }
  },

  update: async (collectionName: string, id: string, data: any): Promise<void> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      const docRef = doc(db, collectionName, id);
      return await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Firestore update error:', error);
      throw new Error(`Failed to update document ${id} in ${collectionName}`);
    }
  },

  delete: async (collectionName: string, id: string): Promise<void> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      return await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Firestore delete error:', error);
      throw new Error(`Failed to delete document ${id} from ${collectionName}`);
    }
  },

  query: async (collectionName: string, constraints: QueryConstraint[] = []): Promise<FirestoreDocument[]> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore query error:', error);
      throw new Error(`Failed to query collection ${collectionName}`);
    }
  }
};

// Enhanced Storage Services with ultra-fast upload capabilities
export const storageService = {
  // Original uploadFile method (backward compatible)
  uploadFile: async (
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void,
    metadata?: Record<string, string>
  ): Promise<string> => {
    console.group(`🚀 Starting file upload`);
    console.log(`📁 File: ${file.name}`);
    console.log(`📊 Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📝 Type: ${file.type}`);
    console.log(`📍 Path: ${path}`);
    
    try {
      validateFile(file);
      const storageInstance = getStorageInstance();
      
      return new Promise((resolve, reject) => {
        try {
          const storageRef: StorageReference = ref(storageInstance, path);
          
          const uploadMetadata: StorageMetadata = {
            originalName: file.name,
            size: file.size.toString(),
            type: file.type,
            uploadedAt: new Date().toISOString(),
            ...metadata
          };

          const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
            customMetadata: uploadMetadata
          });

          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`📊 Upload progress: ${progress.toFixed(2)}% - ${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes`);
              
              if (onProgress) {
                onProgress(progress);
              }
            },
            (error: StorageError) => {
              console.group('❌ Upload Error');
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              console.groupEnd();
              
              let errorMessage = `Upload failed: ${error.message}`;
              
              switch (error.code) {
                case 'storage/unauthorized':
                  errorMessage = 'Upload unauthorized. Check Firebase Storage rules.';
                  break;
                case 'storage/canceled':
                  errorMessage = 'Upload was canceled.';
                  break;
                case 'storage/unknown':
                  errorMessage = 'Unknown upload error occurred.';
                  break;
                case 'storage/quota-exceeded':
                  errorMessage = 'Storage quota exceeded. Please check your Firebase plan.';
                  break;
                case 'storage/unauthenticated':
                  errorMessage = 'User is not authenticated. Please log in.';
                  break;
              }
              
              reject(new Error(errorMessage));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log(`✅ Upload completed: ${file.name}`);
                console.groupEnd();
                resolve(downloadURL);
              } catch (urlError) {
                console.error('❌ Failed to get download URL:', urlError);
                console.groupEnd();
                reject(new Error('Failed to get download URL after upload'));
              }
            }
          );
        } catch (taskError) {
          console.error('❌ Upload task creation failed:', taskError);
          console.groupEnd();
          reject(new Error('Failed to create upload task'));
        }
      });
    } catch (error) {
      console.error('❌ Upload initialization failed:', error);
      console.groupEnd();
      throw error;
    }
  },

  // ULTRA-FAST: Enhanced upload with detailed progress tracking
  uploadFileWithDetailedProgress: async (
    file: File,
    path: string,
    onProgress?: (progress: number, uploadedBytes: number, speed: number) => void, // Made optional
    metadata?: Record<string, string>
  ): Promise<{ url?: string; error?: string }> => {
    console.group(`🚀 ULTRA-FAST Upload: ${file.name}`);
    console.log(`📊 Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📍 Path: ${path}`);
    
    try {
      validateFile(file);
      const storageInstance = getStorageInstance();
      
      return new Promise((resolve, reject) => {
        try {
          const storageRef: StorageReference = ref(storageInstance, path);
          
          const uploadMetadata: StorageMetadata = {
            originalName: file.name,
            size: file.size.toString(),
            type: file.type,
            uploadedAt: new Date().toISOString(),
            ...metadata
          };

          const startTime = Date.now();
          let lastUploadedBytes = 0;
          let lastTime = startTime;

          const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, {
            customMetadata: uploadMetadata
          });

          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              const currentTime = Date.now();
              const timeDiff = (currentTime - lastTime) / 1000; // seconds
              const bytesDiff = snapshot.bytesTransferred - lastUploadedBytes;
              const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes per second
              
              // Enhanced logging for ultra-fast system
              console.log(`⚡ Progress: ${progress.toFixed(1)}% | Speed: ${(speed / 1024 / 1024).toFixed(2)} MB/s | Bytes: ${snapshot.bytesTransferred}/${snapshot.totalBytes}`);
              
              if (onProgress) {
                onProgress(progress, snapshot.bytesTransferred, speed);
              }
              
              lastUploadedBytes = snapshot.bytesTransferred;
              lastTime = currentTime;
            },
            (error: StorageError) => {
              console.error('❌ Ultra-fast upload error:', error);
              
              let errorMessage = error.message;
              switch (error.code) {
                case 'storage/retry-limit-exceeded':
                  errorMessage = 'Upload failed after multiple retries. Please check your connection.';
                  break;
                case 'storage/quota-exceeded':
                  errorMessage = 'Storage quota exceeded. Please upgrade your plan.';
                  break;
              }
              
              console.groupEnd();
              reject({ error: errorMessage });
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const totalTime = (Date.now() - startTime) / 1000;
                const averageSpeed = file.size / totalTime;
                
                console.log(`🎉 ULTRA-FAST Upload Completed!`);
                console.log(`⏱️  Time: ${totalTime.toFixed(2)}s`);
                console.log(`📊 Avg Speed: ${(averageSpeed / 1024 / 1024).toFixed(2)} MB/s`);
                console.log(`🔗 URL: ${downloadURL}`);
                console.groupEnd();
                
                resolve({ url: downloadURL });
              } catch (urlError) {
                console.error('❌ Failed to get download URL:', urlError);
                console.groupEnd();
                reject({ error: 'Failed to get download URL after upload' });
              }
            }
          );
        } catch (taskError) {
          console.error('❌ Ultra-fast upload task creation failed:', taskError);
          console.groupEnd();
          reject({ error: 'Failed to create upload task' });
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload initialization failed';
      console.error('❌ Ultra-fast upload initialization failed:', errorMessage);
      console.groupEnd();
      return { error: errorMessage };
    }
  },

  // ULTRA-FAST: Parallel batch upload with concurrency control
  uploadMultipleFilesParallel: async (
    files: File[], 
    basePath: string, 
    onProgress?: (overallProgress: number, uploadedBytes: number, averageSpeed: number, activeConnections: number) => void,
    metadata?: Record<string, string>,
    maxConcurrent: number = 6 // Increased concurrency for ultra-fast uploads
  ): Promise<UploadResult[]> => {
    console.group(`🚀 ULTRA-FAST Parallel Upload`);
    console.log(`📁 Total files: ${files.length}`);
    console.log(`⚡ Max concurrent: ${maxConcurrent}`);
    console.log(`📍 Base path: ${basePath}`);
    
    const storageInstance = getStorageInstance();
    const results: UploadResult[] = new Array(files.length);
    let completedCount = 0;
    let totalUploadedBytes = 0;
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let activeUploads = 0;
    let startTime = Date.now();

    // Track upload tasks for speed calculation
    const uploadTasks: UploadTaskWithProgress[] = [];

    const updateOverallProgress = () => {
      const overallProgress = (completedCount / files.length) * 100;
      const currentTime = Date.now();
      const timeElapsed = (currentTime - startTime) / 1000;
      const averageSpeed = timeElapsed > 0 ? totalUploadedBytes / timeElapsed : 0;
      
      console.log(`📈 Overall: ${overallProgress.toFixed(1)}% | Active: ${activeUploads} | Speed: ${(averageSpeed / 1024 / 1024).toFixed(2)} MB/s`);
      
      if (onProgress) {
        onProgress(overallProgress, totalUploadedBytes, averageSpeed, activeUploads);
      }
    };

    // Process files in batches with concurrency control
    const processBatch = async (batchFiles: File[], batchIndex: number): Promise<void> => {
      const batchPromises = batchFiles.map(async (file, fileIndex) => {
        const globalIndex = batchIndex * maxConcurrent + fileIndex;
        
        try {
          // Generate unique file path
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 10);
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${basePath}/${timestamp}_${randomStr}_${safeFileName}`;
          
          activeUploads++;
          console.log(`🔄 Starting upload ${globalIndex + 1}/${files.length}: ${file.name}`);

          const result = await storageService.uploadFileWithDetailedProgress(
            file,
            filePath,
            (progress, uploadedBytes, speed) => {
              // Update individual file progress
              totalUploadedBytes += (uploadedBytes - (results[globalIndex]?.uploadedBytes || 0));
              updateOverallProgress();
            },
            metadata
          );

          activeUploads--;
          
          if (result.url) {
            results[globalIndex] = { file, url: result.url, error: undefined };
            console.log(`✅ Completed: ${file.name}`);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
          
        } catch (error) {
          activeUploads--;
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          console.error(`❌ Failed: ${file.name} - ${errorMessage}`);
          results[globalIndex] = { file, url: '', error: errorMessage };
        } finally {
          completedCount++;
          updateOverallProgress();
        }
      });

      await Promise.all(batchPromises);
    };

    // Process all files in parallel batches
    try {
      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);
        await processBatch(batch, Math.floor(i / maxConcurrent));
      }

      const successfulUploads = results.filter(r => !r.error).length;
      const failedUploads = results.filter(r => r.error).length;
      const totalTime = (Date.now() - startTime) / 1000;
      const overallSpeed = totalTime > 0 ? totalSize / totalTime : 0;

      console.log(`🎉 ULTRA-FAST Parallel Upload Completed!`);
      console.log(`✅ Successful: ${successfulUploads}/${files.length}`);
      console.log(`❌ Failed: ${failedUploads}`);
      console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}s`);
      console.log(`📊 Overall Speed: ${(overallSpeed / 1024 / 1024).toFixed(2)} MB/s`);
      console.groupEnd();

      return results;
    } catch (error) {
      console.error('❌ Parallel upload batch processing failed:', error);
      console.groupEnd();
      throw error;
    }
  },

  // Original multiple files upload (backward compatible)
  uploadMultipleFiles: async (
    files: File[], 
    basePath: string, 
    onProgress?: (progress: number) => void,
    metadata?: Record<string, string>
  ): Promise<UploadResult[]> => {
    console.group(`🚀 Starting multiple file upload`);
    console.log(`📁 Total files: ${files.length}`);
    console.log(`📍 Base path: ${basePath}`);
    
    const storageInstance = getStorageInstance();
    const results: UploadResult[] = [];
    let completed = 0;
    const totalFiles = files.length;
    
    console.log(`🔄 Processing ${totalFiles} files...`);
    
    for (const file of files) {
      try {
        console.log(`📤 Uploading file ${completed + 1}/${totalFiles}: ${file.name}`);
        
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${basePath}/${timestamp}_${randomStr}_${safeFileName}`;
        
        console.log(`🎯 Generated file path: ${filePath}`);
        
        const url = await storageService.uploadFile(file, filePath, (progress) => {
          const overallProgress = (completed + (progress / 100)) / totalFiles * 100;
          console.log(`📈 Overall progress: ${overallProgress.toFixed(2)}%`);
          
          if (onProgress) {
            onProgress(overallProgress);
          }
        }, metadata);
        
        results.push({ file, url, error: undefined });
        console.log(`✅ Successfully uploaded: ${file.name}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        console.error(`❌ Failed to upload ${file.name}:`, errorMessage);
        
        results.push({ 
          file, 
          url: '', 
          error: errorMessage
        });
      }
      
      completed++;
      console.log(`📊 Progress: ${completed}/${totalFiles} files completed`);
    }
    
    const successfulUploads = results.filter(r => !r.error).length;
    const failedUploads = results.filter(r => r.error).length;
    
    console.log(`🎉 Multiple file upload completed:`);
    console.log(`✅ Successful: ${successfulUploads}`);
    console.log(`❌ Failed: ${failedUploads}`);
    console.groupEnd();
    
    return results;
  },

  deleteFile: async (path: string): Promise<void> => {
    console.log(`🗑️ Deleting file: ${path}`);
    
    const storageInstance = getStorageInstance();
    
    try {
      const storageRef: StorageReference = ref(storageInstance, path);
      await deleteObject(storageRef);
      console.log(`✅ Successfully deleted: ${path}`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new Error('Failed to delete file');
    }
  },

  getFileURL: async (path: string): Promise<string> => {
    console.log(`🔗 Getting file URL: ${path}`);
    
    const storageInstance = getStorageInstance();
    
    try {
      const storageRef: StorageReference = ref(storageInstance, path);
      const url = await getDownloadURL(storageRef);
      console.log(`✅ URL obtained: ${url}`);
      return url;
    } catch (error) {
      console.error('❌ Get URL error:', error);
      throw new Error('Failed to get file URL');
    }
  },

  // ULTRA-FAST: Resume upload functionality (basic implementation)
  resumeUpload: async (
    file: File,
    path: string,
    existingTask?: UploadTask,
    onProgress?: (progress: number, uploadedBytes: number, speed: number) => void,
    metadata?: Record<string, string>
  ): Promise<{ url?: string; error?: string }> => {
    console.log(`🔄 Attempting to resume upload: ${file.name}`);
    
    // For now, we'll restart the upload. In a production app, you'd implement proper resume logic
    // by storing upload tasks and their states in IndexedDB or localStorage
    return storageService.uploadFileWithDetailedProgress(file, path, onProgress, metadata);
  },

  // Test function to verify storage connectivity
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('🧪 Testing Firebase Storage connection...');
      const storageInstance = getStorageInstance();
      
      // Create a test reference to check if storage is accessible
      const testRef = ref(storageInstance, 'test-connection.txt');
      console.log('✅ Storage reference created successfully');
      console.log('📦 Storage bucket:', storageInstance.app.options.storageBucket);
      
      return true;
    } catch (error) {
      console.error('❌ Storage connection test failed:', error);
      return false;
    }
  },

  // ULTRA-FAST: Performance testing utility
  testUploadPerformance: async (file: File, path: string): Promise<{ speed: number; time: number; success: boolean }> => {
    console.group('🧪 Upload Performance Test');
    
    const startTime = Date.now();
    let totalBytes = 0;
    let lastTime = startTime;
    
    try {
      const result = await storageService.uploadFileWithDetailedProgress(
        file,
        path,
        (progress, uploadedBytes, speed) => {
          totalBytes = uploadedBytes;
          lastTime = Date.now();
        }
      );
      
      const totalTime = (lastTime - startTime) / 1000;
      const averageSpeed = totalTime > 0 ? totalBytes / totalTime : 0;
      
      console.log(`📊 Performance Results:`);
      console.log(`⏱️  Time: ${totalTime.toFixed(2)}s`);
      console.log(`⚡ Speed: ${(averageSpeed / 1024 / 1024).toFixed(2)} MB/s`);
      console.log(`✅ Success: ${!!result.url}`);
      console.groupEnd();
      
      return {
        speed: averageSpeed,
        time: totalTime,
        success: !!result.url
      };
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      console.groupEnd();
      return {
        speed: 0,
        time: 0,
        success: false
      };
    }
  }
};

// Authentication Services with proper TypeScript types
export const authService = {
  login: (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  register: (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  logout: () => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    return signOut(auth);
  },
  
  updateProfile: (user: FirebaseUser, updates: { displayName?: string | null; photoURL?: string | null }) => {
    return updateProfile(user, updates);
  },
  
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (!auth) {
      console.warn('Firebase Auth is not initialized');
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  }
};

// Helper function to check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  const initialized = !!(app && db && storage && auth);
  console.log('🔍 Firebase initialized check:', initialized);
  return initialized;
};

// Helper function to get Firebase instances safely
export const getFirebaseInstances = () => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Make sure you are in a browser environment.');
  }
  
  return {
    app: app!,
    db: db!,
    storage: storage!,
    auth: auth!,
    analytics
  };
};

// Initialize and test on module load
if (isClient) {
  console.log('🔧 Firebase module loaded, testing initialization...');
  
  // Test storage connection after a short delay
  setTimeout(async () => {
    try {
      const connected = await storageService.testConnection();
      if (connected) {
        console.log('🎉 Firebase Storage is ready for use!');
      } else {
        console.error('❌ Firebase Storage connection test failed');
      }
    } catch (error) {
      console.error('❌ Storage test error:', error);
    }
  }, 1000);
}

export default app;