// User Types
export interface UserProfile {
  displayName: string;
  avatar?: string;
  ageVerified: boolean;
  bio?: string;
  profilePicture?: string; // Added for profile editor compatibility
}

export interface UserSubscription {
  type: 'basic' | 'seller';
  status: 'active' | 'inactive' | 'pending';
  stripeSubscriptionId?: string;
  currentPeriodEnd: Date;
  priceId: string;
}

export interface UserStats {
  totalListings: number;
  totalSales: number;
  rating: number;
  totalPurchases?: number; // Added for buyer stats
}

export interface Subscription {
  id: string;
  planId: string;
  type: 'buyer' | 'seller';
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  purchasedAt: string;
  expiresAt: string;
  paymentMethod: 'card' | 'crypto';
  features: {
    maxModels: number;
    listingDuration: number;
    revenueShare: number;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'failed';
  paymentMethod: string;
  createdAt: string;
}

// New Interfaces
export interface Earnings {
  total: number;
  available: number;
  pending: number;
  paidOut: number;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt: string | null;
}

export interface PaymentValidation {
  canUpload: boolean;
  message?: string;
  action?: 'subscription' | 'one_time';
}

// Updated User interface with email verification
export interface User {
  uid: string;
  id: string;
  username: string;
  displayName: string;
  email: string;
  emailVerified?: boolean; // Added email verification field
  role: 'buyer' | 'seller' | 'admin' | 'both';
  subscription?: Subscription;
  profile: UserProfile;
  stats: UserStats;
  earnings?: Earnings;
  availableListings?: number;
  stripeCustomerId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  password?: string; // Added for signup process (should be removed after creation)
}

// Model Types
export interface VideoDurationBreakdown {
  over60: number;
  '45-59': number;
  '30-44': number;
  '15-29': number;
  under15: number;
}

export interface ModelMedia {
  sfw: {
    images: number;
    videos: {
      total: number;
      durationBreakdown: VideoDurationBreakdown;
    };
  };
  nsfw: {
    images: number;
    videos: {
      total: number;
      durationBreakdown: VideoDurationBreakdown;
    };
  };
}

export interface TechnicalSpecs {
  framework: string;
  modelSize: string;
  inputFormat: string;
  outputFormat: string;
  accuracy?: number;
}

export interface ModelFiles {
  sfw: {
    images: string[];
    videos: string[];
  };
  nsfw: {
    images: string[];
    videos: string[];
  };
}

export interface ModelAnalytics {
  views: number;
  downloads: number;
  favorites: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  niche: string;
  sellerId: string;
  media: ModelMedia;
  pricing: {
    type: 'subscription';
    amount: number;
    currency: 'USD';
  };
  technicalSpecs: TechnicalSpecs;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  moderation: {
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
  };
  files: ModelFiles;
  analytics: ModelAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  type: 'subscription' | 'model_listing';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  modelId?: string;
  subscriptionType?: 'basic' | 'seller';
  createdAt: Date;
}

// Upload Types
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  fileName?: string;
  fileSize?: number;
  downloadURL?: string;
  error?: string;
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileUploadType {
  sfwImages: File[];
  nsfwImages: File[];
  sfwVideos: File[];
  nsfwVideos: File[];
}

// Firebase Types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified?: boolean; // Added for Firebase Auth compatibility
}

// Auth Types for Email Verification
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  emailVerificationSent?: boolean;
}

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Component Props Types
export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface FileUploadProps {
  label: string;
  description: string;
  files: File[];
  onFilesChange: (files: FileList) => void;
  onRemoveFile?: (index: number) => void;
  accept: string;
  maxFiles?: number;
  required?: boolean;
  nsfw?: boolean;
}

export interface ModelCardProps {
  model: AIModel;
  onView: (model: AIModel) => void;
  onPurchase?: (model: AIModel) => void;
}

export interface FilterSectionProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export interface FileValidatorProps {
  files: FileUploadType;
  onValidationResult: (result: UploadValidationResult) => void;
}

// Email Verification Components Props
export interface EmailVerificationProps {
  user: User;
  onResendVerification: (email: string) => Promise<EmailVerificationResult>;
  onRefresh?: () => void;
}

// Storage Types
export interface UploadResult {
  file: File;
  url: string;
  error?: string;
  uploadedBytes?: number; // Added for progress tracking
}

export interface ModelUploadResults {
  sfwImages: string[];
  nsfwImages: string[];
  sfwVideos: string[];
  nsfwVideos: string[];
  errors: string[];
}

// Payment Types
export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

// Password Reset Types
export interface PasswordResetState {
  loading: boolean;
  error: string | null;
  success: boolean;
  email?: string;
}