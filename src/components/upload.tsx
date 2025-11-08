'use client';

import React, { useRef, useState } from 'react';
import { useUploadContext } from '@/contexts';
import { FileUpload } from './ui';

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label = "Uploading..." }) => {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
      <div 
        className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      ></div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// Media Upload Component
// Media Upload Component
export const MediaUpload: React.FC = () => {
  const { files, setFiles, uploading, progress, uploads } = useUploadContext();

  const handleFilesChange = (type: keyof typeof files) => (fileList: FileList) => {
    console.log(`🔄 handleFilesChange called for ${type}:`, fileList);
    
    const newFiles = Array.from(fileList);
    console.log(`📁 Converting FileList to array for ${type}:`, 
      newFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    );
    
    // Replace existing files with new ones (for single file types) or add to existing (for multiple)
    if (type === 'sfwVideos' || type === 'nsfwVideos') {
      // For videos, replace existing files (max 1)
      setFiles(prev => {
        const updated = { ...prev, [type]: newFiles };
        console.log(`🎬 Updated ${type} state:`, updated[type].map(f => f.name));
        return updated;
      });
    } else {
      // For images, add to existing files (up to max 4)
      setFiles(prev => {
        const currentFiles = prev[type];
        const combinedFiles = [...currentFiles, ...newFiles].slice(0, 4); // Max 4 files
        const updated = { ...prev, [type]: combinedFiles };
        console.log(`🖼️ Updated ${type} state:`, updated[type].map(f => f.name));
        return updated;
      });
    }
  };

  const handleRemoveFile = (type: keyof typeof files, index: number) => {
    console.log(`🗑️ Removing file from ${type} at index ${index}`);
    setFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Upload Your AI Model Media
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Please upload the required media files for your AI model. Ensure all files meet the specified requirements.
          Files will be uploaded to secure Firebase Storage.
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Uploading Files to Firebase Storage...
          </h3>
          <ProgressBar progress={progress} label="Overall progress" />
          
          {/* Individual file progress */}
          <div className="mt-4 space-y-2">
            {uploads.map((upload, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className={`truncate flex-1 ${
                  upload.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  upload.status === 'error' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  {upload.fileName}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        upload.status === 'completed' ? 'bg-green-500' :
                        upload.status === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                  <span className={`w-8 text-right ${
                    upload.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                    upload.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {Math.round(upload.progress)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          🐛 File State Debug
        </h3>
        <div className="text-xs text-yellow-700 dark:text-yellow-300 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>SFW Images: {files.sfwImages.length}/4</div>
          <div>NSFW Images: {files.nsfwImages.length}/4</div>
          <div>SFW Videos: {files.sfwVideos.length}/1</div>
          <div>NSFW Videos: {files.nsfwVideos.length}/1</div>
        </div>
      </div>

      {/* SFW Images Section */}
      <div>
        <FileUpload
          label="SFW Images"
          description="Upload exactly 4 Safe For Work images (JPEG, PNG, WebP, max 10MB each)"
          files={files.sfwImages}
          onFilesChange={handleFilesChange('sfwImages')}
          onRemoveFile={(index: number) => handleRemoveFile('sfwImages', index)}
          accept="image/jpeg,image/png,image/webp"
          maxFiles={4}
          required={true}
        />
      </div>

      {/* NSFW Images Section */}
      <div>
        <FileUpload
          label="NSFW Images"
          description="Upload exactly 4 Not Safe For Work images (JPEG, PNG, WebP, max 10MB each)"
          files={files.nsfwImages}
          onFilesChange={handleFilesChange('nsfwImages')}
          onRemoveFile={(index: number) => handleRemoveFile('nsfwImages', index)}
          accept="image/jpeg,image/png,image/webp"
          maxFiles={4}
          required={true}
          nsfw={true}
        />
      </div>

      {/* Video Upload Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUpload
          label="SFW Video"
          description="Upload exactly 1 Safe For Work video (15 seconds, MP4, WebM, MOV, max 100MB)"
          files={files.sfwVideos}
          onFilesChange={handleFilesChange('sfwVideos')}
          onRemoveFile={(index: number) => handleRemoveFile('sfwVideos', index)}
          accept="video/mp4,video/webm,video/quicktime"
          maxFiles={1}
          required={true}
        />
        <FileUpload
          label="NSFW Video"
          description="Upload exactly 1 Not Safe For Work video (15 seconds, MP4, WebM, MOV, max 100MB)"
          files={files.nsfwVideos}
          onFilesChange={handleFilesChange('nsfwVideos')}
          onRemoveFile={(index: number) => handleRemoveFile('nsfwVideos', index)}
          accept="video/mp4,video/webm,video/quicktime"
          maxFiles={1}
          required={true}
          nsfw={true}
        />
      </div>

      {/* Upload Summary */}
      {(files.sfwImages.length > 0 || files.nsfwImages.length > 0 || files.sfwVideos.length > 0 || files.nsfwVideos.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Upload Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                files.sfwImages.length === 4 ? 'text-green-600 dark:text-green-400' : 
                files.sfwImages.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-blue-600 dark:text-blue-400'
              }`}>
                {files.sfwImages.length}/4
              </div>
              <div className="text-blue-700 dark:text-blue-300">SFW Images</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                files.nsfwImages.length === 4 ? 'text-green-600 dark:text-green-400' : 
                files.nsfwImages.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              }`}>
                {files.nsfwImages.length}/4
              </div>
              <div className="text-red-700 dark:text-red-300">NSFW Images</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                files.sfwVideos.length === 1 ? 'text-green-600 dark:text-green-400' : 
                files.sfwVideos.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-blue-600 dark:text-blue-400'
              }`}>
                {files.sfwVideos.length}/1
              </div>
              <div className="text-blue-700 dark:text-blue-300">SFW Videos</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                files.nsfwVideos.length === 1 ? 'text-green-600 dark:text-green-400' : 
                files.nsfwVideos.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              }`}>
                {files.nsfwVideos.length}/1
              </div>
              <div className="text-red-700 dark:text-red-300">NSFW Videos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// File Validator Component
interface FileValidatorProps {
  files: { sfwImages: File[]; nsfwImages: File[]; sfwVideos: File[]; nsfwVideos: File[] };
  onValidationResult: (result: { isValid: boolean; errors: string[] }) => void;
}

export const FileValidator: React.FC<FileValidatorProps> = ({ files, onValidationResult }) => {
  React.useEffect(() => {
    const errors: string[] = [];
    
    // Validate counts
    if (files.sfwImages.length !== 4) errors.push('Exactly 4 SFW images are required');
    if (files.nsfwImages.length !== 4) errors.push('Exactly 4 NSFW images are required');
    if (files.sfwVideos.length !== 1) errors.push('Exactly 1 SFW video is required');
    if (files.nsfwVideos.length !== 1) errors.push('Exactly 1 NSFW video is required');

    // Validate file types and sizes
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    [...files.sfwImages, ...files.nsfwImages].forEach(file => {
      if (!imageTypes.includes(file.type)) errors.push(`Invalid image type: ${file.name}`);
      if (file.size > 10 * 1024 * 1024) errors.push(`Image too large: ${file.name} (max 10MB)`);
    });

    [...files.sfwVideos, ...files.nsfwVideos].forEach(file => {
      if (!videoTypes.includes(file.type)) errors.push(`Invalid video type: ${file.name}`);
      if (file.size > 100 * 1024 * 1024) errors.push(`Video too large: ${file.name} (max 100MB)`);
    });

    onValidationResult({ isValid: errors.length === 0, errors });
  }, [files, onValidationResult]);

  return null; // This component doesn't render anything
};