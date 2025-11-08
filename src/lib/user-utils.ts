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
    
    // Check uniqueness
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const isUnique = !existingUsers.some((user: any) => 
      user.username?.toLowerCase() === username.toLowerCase()
    );
    
    if (!isUnique) {
      errors.push('Username is already taken');
    }
    
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
    
    // Check uniqueness
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const isUnique = !existingUsers.some((user: any) => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (!isUnique) {
      errors.push('Email is already registered');
    }
    
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

  static generateUniqueUsername(base: string): string {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let username = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    let finalUsername = username;
    
    while (existingUsers.some((user: any) => user.username === finalUsername)) {
      finalUsername = `${username}${counter}`;
      counter++;
    }
    
    return finalUsername;
  }

  static updateUserProfile(userId: string, updates: any): boolean {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = existingUsers.findIndex((user: any) => user.id === userId);
      
      if (userIndex === -1) return false;
      
      // Prevent username/email duplication
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
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  static getUserById(userId: string): any {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users.find((user: any) => user.id === userId) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static getAllUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }
}