'use client';

import { useState, useEffect, useRef } from 'react';
import { userService } from '@/lib/firebase';

interface ProfileEditorProps {
  user: any;
  onUpdate: (updates: any) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: ''
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.profile?.displayName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || user.profile?.bio || ''
      });
      
      if (user.profilePicture || user.profile?.profilePicture) {
        setProfilePreview(user.profilePicture || user.profile?.profilePicture);
      }
    }
  }, [user]);

  const validateField = (field: string, value: string) => {
    let isValid = true;
    let error = '';
    
    switch (field) {
      case 'username':
        if (value !== user.username) {
          if (value.length < 3) {
            isValid = false;
            error = 'Username must be at least 3 characters long';
          } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            isValid = false;
            error = 'Username can only contain letters, numbers, and underscores';
          } else if (value.length > 20) {
            isValid = false;
            error = 'Username cannot exceed 20 characters';
          }
        }
        break;
      case 'email':
        if (value !== user.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            isValid = false;
            error = 'Please enter a valid email address';
          }
        }
        break;
      case 'displayName':
        if (!value || value.length < 2) {
          isValid = false;
          error = 'Display name must be at least 2 characters';
        }
        break;
    }
    
    if (!isValid) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    return isValid;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for certain fields
    if (field === 'username' || field === 'email') {
      validateField(field, value);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrors({ general: 'Please select an image file' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ general: 'Profile picture must be less than 5MB' });
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setErrors({});

    // Validate all fields
    const isUsernameValid = validateField('username', formData.username);
    const isEmailValid = validateField('email', formData.email);
    const isDisplayNameValid = validateField('displayName', formData.displayName);

    if (!isUsernameValid || !isEmailValid || !isDisplayNameValid) {
      setLoading(false);
      return;
    }

    try {
      const updates = {
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        profile: {
          displayName: formData.displayName,
          bio: formData.bio,
          ageVerified: user.profile?.ageVerified || false,
          profilePicture: user.profile?.profilePicture || ''
        }
      };

      // Update profile with picture if selected
      const success = await userService.updateProfileWithPicture(
        user.id, 
        updates, 
        profilePicture || undefined
      );
      
      if (success) {
        setSuccess('Profile updated successfully!');
        onUpdate(updates);
        
        // Update current user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === user.id) {
          localStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            ...updates
          }));
        }
      } else {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        Edit Profile
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
              {profilePreview ? (
                <img 
                  src={profilePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.displayName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-cyan-500 text-white p-1 rounded-full hover:bg-cyan-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {profilePreview && (
              <button
                type="button"
                onClick={removeProfilePicture}
                className="absolute -bottom-1 -left-1 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          <div>
            <p className="text-white font-medium">Profile Picture</p>
            <p className="text-slate-400 text-sm">Click the camera icon to upload a new picture</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-cyan-100 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              required
            />
            {errors.displayName && (
              <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-cyan-100 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              required
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            required
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-cyan-100 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            placeholder="Tell us about yourself..."
          />
        </div>
        
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-400">{errors.general}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-green-400">{success}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              'Update Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};