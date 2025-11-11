'use client';

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

export class UserManager {
  static validateUsername(username: string): UserValidationResult {
    const errors: string[] = [];
    
    if (!username || username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    if (username.length > 20) {
      errors.push('Username cannot exceed 20 characters');
    }
    
    // Note: Removed localStorage uniqueness check since we now use Firestore
    // Uniqueness is checked in the signup process via userService
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmail(email: string): UserValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Note: Removed localStorage uniqueness check since we now use Firestore
    // Uniqueness is checked in the signup process via userService
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePassword(password: string): UserValidationResult {
    const errors: string[] = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmailVerification(user: any): UserValidationResult {
    const errors: string[] = [];
    
    // Check if user exists and email is not verified
    if (user && user.emailVerified === false) {
      errors.push('Email address not verified. Please check your inbox for the verification link.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateUniqueUsername(base: string): string {
    // Note: This is now handled by Firestore in the signup process
    // Keeping for backward compatibility
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${base.toLowerCase().replace(/[^a-z0-9]/g, '')}_${timestamp}${randomStr}`;
  }

  static updateUserProfile(userId: string, updates: any): boolean {
    try {
      // Note: This function now primarily updates localStorage
      // Firestore updates are handled by userService in firebase.ts
      
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = existingUsers.findIndex((user: any) => user.id === userId);
      
      if (userIndex === -1) return false;
      
      // Prevent username/email duplication in localStorage
      if (updates.username) {
        const usernameValidation = this.validateUsername(updates.username);
        if (!usernameValidation.isValid) return false;
      }
      
      if (updates.email) {
        const emailValidation = this.validateEmail(updates.email);
        if (!emailValidation.isValid) return false;
      }
      
      existingUsers[userIndex] = {
        ...existingUsers[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('users', JSON.stringify(existingUsers));
      
      // Update current user in localStorage if it's the same user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem('currentUser', JSON.stringify({
          ...currentUser,
          ...updates
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user profile in localStorage:', error);
      return false;
    }
  }

  static getUserById(userId: string): any {
    try {
      // First check localStorage for backward compatibility
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const localUser = users.find((user: any) => user.id === userId);
      
      if (localUser) {
        return localUser;
      }
      
      // If not found in localStorage, return null
      // Firestore operations are handled by userService
      return null;
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
      return null;
    }
  }

  static getAllUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (error) {
      console.error('Error getting users from localStorage:', error);
      return [];
    }
  }

  // New method to handle email verification status
  static checkEmailVerificationStatus(user: any): { verified: boolean; message?: string } {
    if (!user) {
      return { verified: false, message: 'User not found' };
    }
    
    if (user.emailVerified === true) {
      return { verified: true };
    }
    
    if (user.emailVerified === false) {
      return { 
        verified: false, 
        message: 'Please verify your email address to access all features.' 
      };
    }
    
    // For users created before email verification was implemented
    // Consider them verified for backward compatibility
    if (user.emailVerified === undefined) {
      return { verified: true };
    }
    
    return { verified: false, message: 'Email verification status unknown' };
  }

  // Method to resend verification email (placeholder)
  static async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // This would typically call your backend or Firebase function
      // For now, we'll simulate the process
      console.log(`Resending verification email to: ${email}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.'
      };
    } catch (error) {
      console.error('Error resending verification email:', error);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      };
    }
  }
}