import { UploadValidationResult } from '@/types';

// Validation Utilities
export const validateModelUpload = (files: {
  sfwImages: File[];
  nsfwImages: File[];
  sfwVideos: File[];
  nsfwVideos: File[];
}): UploadValidationResult => {
  const errors: string[] = [];

  // Validate image counts - EXACTLY 4 each as required by Sir
  if (files.sfwImages.length !== 4) errors.push('Exactly 4 SFW images are required');
  if (files.nsfwImages.length !== 4) errors.push('Exactly 4 NSFW images are required');
  
  // Validate video counts - EXACTLY 1 each as required by Sir
  if (files.sfwVideos.length !== 1) errors.push('Exactly 1 SFW video is required');
  if (files.nsfwVideos.length !== 1) errors.push('Exactly 1 NSFW video is required');

  // File type validation
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  // Validate all files
  [...files.sfwImages, ...files.nsfwImages].forEach((file, index) => {
    if (!imageTypes.includes(file.type)) errors.push(`Invalid image type: ${file.name}`);
    if (file.size > 10 * 1024 * 1024) errors.push(`Image too large: ${file.name} (max 10MB)`);
  });

  [...files.sfwVideos, ...files.nsfwVideos].forEach((file, index) => {
    if (!videoTypes.includes(file.type)) errors.push(`Invalid video type: ${file.name}`);
    if (file.size > 100 * 1024 * 1024) errors.push(`Video too large: ${file.name} (max 100MB)`);
  });

  return { isValid: errors.length === 0, errors };
};

export const calculateVideoDurationBreakdown = (durations: number[]) => {
  const breakdown = { over60: 0, '45-59': 0, '30-44': 0, '15-29': 0, under15: 0 };
  durations.forEach(duration => {
    if (duration >= 60) breakdown.over60++;
    else if (duration >= 45) breakdown['45-59']++;
    else if (duration >= 30) breakdown['30-44']++;
    else if (duration >= 15) breakdown['15-29']++;
    else breakdown.under15++;
  });
  return breakdown;
};

export const validateEmail = (email: string): boolean => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/(?=.*\d)/.test(password)) errors.push('Password must contain number');
  return errors;
};

// Formatting Utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date: Date): string => 
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatVideoDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Constants
export const SUBSCRIPTION_PRICES = { BASIC: 5.99, SELLER: 29.99 };
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_FILE_SIZES = { IMAGE: 10 * 1024 * 1024, VIDEO: 100 * 1024 * 1024 };

export const NICHE_CATEGORIES = [
  'Art & Design', 'Photography', 'Writing', 'Coding', 'Music', 'Video', 
  '3D Modeling', 'Animation', 'Game Development', 'Business', 'Marketing', 'Other'
];