import React, { useRef } from 'react';

// Primary Button Component
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children, onClick, type = 'button', disabled = false, loading = false, className = ''
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      bg-gradient-to-r from-purple-600 to-blue-600 
      hover:from-purple-700 hover:to-blue-700
      text-white font-semibold py-3 px-6 rounded-xl
      transition-all duration-200 transform hover:scale-105
      shadow-lg hover:shadow-xl
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      ${className}
    `}
  >
    {loading ? (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        Loading...
      </div>
    ) : (
      children
    )}
  </button>
);

// File Upload Component with onRemoveFile support
// File Upload Component with onRemoveFile support
interface FileUploadProps {
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

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  files,
  onFilesChange,
  onRemoveFile,
  accept,
  maxFiles,
  required = false,
  nsfw = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔄 File input changed:', e.target.files);
    
    if (e.target.files && e.target.files.length > 0) {
      console.log(`📁 Selected ${e.target.files.length} files:`, 
        Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type }))
      );
      onFilesChange(e.target.files);
    } else {
      console.log('❌ No files selected or files is null');
    }
  };

  const handleRemoveFile = (index: number) => {
    console.log('🗑️ Removing file at index:', index);
    onRemoveFile?.(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('📂 Files dropped:', e.dataTransfer.files);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log(`📁 Dropped ${e.dataTransfer.files.length} files:`, 
        Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size, type: f.type }))
      );
      onFilesChange(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleButtonClick = () => {
    console.log('🎯 Clicked choose files button');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (file.type.startsWith('video/')) {
      return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 01221 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {nsfw && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              NSFW
            </span>
          )}
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      </div>

      {/* File Input - Make it properly accessible */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles !== 1}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={files.length >= (maxFiles || 1)}
        required={required}
      />

      {/* Upload Area - Simplified and more reliable */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-white dark:bg-gray-800">
        {files.length < (maxFiles || 1) ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                nsfw ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={handleButtonClick}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  nsfw 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose Files
              </button>
              
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                or drag and drop files here
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {maxFiles && maxFiles > 1 ? `${files.length} of ${maxFiles} files selected` : 'Select one file'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-medium text-green-600 dark:text-green-400">
              All files selected!
            </p>
            <p className="text-sm text-green-500 dark:text-green-300 mt-1">
              {maxFiles} files ready for upload
            </p>
            <button
              type="button"
              onClick={() => onRemoveFile && files.forEach((_, index) => onRemoveFile(index))}
              className="mt-4 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear all files
            </button>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected files ({files.length}/{maxFiles}):
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}-${file.size}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-3 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label = "Uploading...", 
  className = "" 
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};