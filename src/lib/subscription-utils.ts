'use client';

import { userService } from '@/lib/firebase';

export interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: string;
  type: 'seller' | 'buyer';
  amount: number;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  purchasedAt: string;
  expiresAt: string;
  paymentMethod: string;
  features: any;
  billingCycle: string;
  nextBillingDate: string;
}

export class SubscriptionManager {
  // Get current user's active subscription from Firebase
  static async getCurrentUserSubscription(): Promise<Subscription | null> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser?.id) return null;

      const user = await userService.getUserById(currentUser.id);
      return user?.subscription || null;
    } catch (error) {
      console.error('Error getting user subscription from Firebase:', error);
      return null;
    }
  }

  // Check if user has active subscription using Firebase
  static async hasActiveSubscription(user?: any): Promise<boolean> {
    try {
      let targetUser = user;
      if (!targetUser) {
        targetUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      }

      if (!targetUser?.id) return false;

      // Get fresh user data from Firebase
      const freshUser = await userService.getUserById(targetUser.id);
      const subscription = freshUser?.subscription;
      
      if (!subscription) return false;

      // Check if subscription is active and not expired
      const isActive = subscription.status === 'active';
      const isNotExpired = new Date(subscription.expiresAt) > new Date();
      
      return isActive && isNotExpired;
    } catch (error) {
      console.error('Error checking subscription in Firebase:', error);
      return false;
    }
  }

  // Get subscription features (unchanged)
  static getSubscriptionFeatures(planId: string) {
    const features: any = {
      seller_starter: {
        maxModels: 3,
        listingDuration: 30,
        revenueShare: 80,
        maxDownloads: 0,
        support: 'email',
        name: 'Starter Creator'
      },
      seller_pro: {
        maxModels: 15,
        listingDuration: 90,
        revenueShare: 85,
        maxDownloads: 0,
        support: 'dedicated',
        name: 'Pro Creator'
      },
      seller_enterprise: {
        maxModels: -1, // unlimited
        listingDuration: 180,
        revenueShare: 90,
        maxDownloads: 0,
        support: '24/7',
        name: 'Enterprise'
      },
      buyer_basic: {
        maxModels: 0,
        listingDuration: 0,
        revenueShare: 0,
        maxDownloads: 1,
        support: 'basic',
        name: 'Basic Explorer'
      },
      buyer_premium: {
        maxModels: 0,
        listingDuration: 0,
        revenueShare: 0,
        maxDownloads: 5,
        support: 'priority',
        name: 'Premium Explorer'
      }
    };
    return features[planId] || features.seller_starter;
  }

  // Get subscription tier name (unchanged)
  static getSubscriptionTierName(planId: string): string {
    const features = this.getSubscriptionFeatures(planId);
    return features.name || 'Free';
  }

  // Get max models for plan (unchanged)
  static getMaxModelsForPlan(planId: string): number {
    const features = this.getSubscriptionFeatures(planId);
    return features.maxModels || 0;
  }

  // Update user subscription in Firebase
  static async updateUserSubscription(userId: string, subscriptionData: Partial<Subscription>): Promise<boolean> {
    try {
      // Get current user data
      const user = await userService.getUserById(userId);
      if (!user) return false;

      // Merge subscription data
      const updatedSubscription = {
        ...user.subscription,
        ...subscriptionData,
        updatedAt: new Date().toISOString()
      };

      // Update user in Firebase
      const success = await userService.updateUserProfile(userId, {
        subscription: updatedSubscription,
        updatedAt: new Date().toISOString()
      });

      if (success) {
        // Update current user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === userId) {
          currentUser.subscription = updatedSubscription;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      }

      return success;
    } catch (error) {
      console.error('Error updating user subscription in Firebase:', error);
      return false;
    }
  }

  // Create new subscription in Firebase
  static async createSubscription(userId: string, subscriptionData: Subscription): Promise<boolean> {
    try {
      const success = await userService.updateUserProfile(userId, {
        subscription: subscriptionData,
        updatedAt: new Date().toISOString()
      });

      if (success) {
        // Update current user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === userId) {
          currentUser.subscription = subscriptionData;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      }

      return success;
    } catch (error) {
      console.error('Error creating subscription in Firebase:', error);
      return false;
    }
  }

  // Cancel subscription in Firebase
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const user = await userService.getUserById(userId);
      if (!user?.subscription) return false;

      const updatedSubscription = {
        ...user.subscription,
        status: 'canceled',
        updatedAt: new Date().toISOString()
      };

      const success = await userService.updateUserProfile(userId, {
        subscription: updatedSubscription,
        updatedAt: new Date().toISOString()
      });

      if (success) {
        // Update current user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === userId) {
          currentUser.subscription = updatedSubscription;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
      }

      return success;
    } catch (error) {
      console.error('Error canceling subscription in Firebase:', error);
      return false;
    }
  }

  // Get all active subscriptions from Firebase (for admin purposes)
  static async getAllActiveSubscriptions(): Promise<Array<{userId: string, subscription: Subscription}>> {
    try {
      const users = await userService.getAllUsers();
      const activeSubscriptions = users
        .filter((user: any) => user.subscription && user.subscription.status === 'active')
        .map((user: any) => ({
          userId: user.id,
          subscription: user.subscription
        }));
      
      return activeSubscriptions;
    } catch (error) {
      console.error('Error getting active subscriptions from Firebase:', error);
      return [];
    }
  }

  // Check if user can list models based on subscription using Firebase
  static async canUserListModels(user?: any): Promise<{ 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  }> {
    try {
      let targetUser = user;
      if (!targetUser) {
        targetUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      }
      
      if (!targetUser) {
        return { canList: false, reason: 'User not found' };
      }

      // Get fresh user data from Firebase
      const freshUser = await userService.getUserById(targetUser.id);
      if (!freshUser) {
        return { canList: false, reason: 'User not found in database' };
      }

      if (freshUser.role !== 'seller' && freshUser.role !== 'both') {
        return { canList: false, reason: 'Seller account required to list models' };
      }

      const hasActiveSub = await this.hasActiveSubscription(freshUser);
      
      if (!hasActiveSub) {
        return { 
          canList: false, 
          reason: 'Active subscription required to list models. Please upgrade your plan.',
          subscriptionTier: 'Free'
        };
      }

      const subscription = freshUser.subscription;
      const maxModels = this.getMaxModelsForPlan(subscription.planId);
      const currentModels = await this.getUserApprovedModelsCount(freshUser.id);

      if (maxModels !== -1 && currentModels >= maxModels) {
        return { 
          canList: false, 
          reason: `You've reached your limit of ${maxModels} models. Upgrade your plan to list more models.`,
          maxModels,
          currentModels,
          subscriptionTier: this.getSubscriptionTierName(subscription.planId)
        };
      }

      return { 
        canList: true, 
        maxModels, 
        currentModels,
        subscriptionTier: this.getSubscriptionTierName(subscription.planId)
      };

    } catch (error) {
      console.error('Error checking if user can list models:', error);
      return { canList: false, reason: 'Error checking subscription status' };
    }
  }

  // Helper method to get user's approved models count from Firebase
  private static async getUserApprovedModelsCount(userId: string): Promise<number> {
    try {
      // This would need to be implemented in your Firebase service
      // For now, we'll use a placeholder - you'll need to implement this based on your data structure
      const { firestore } = require('@/lib/firebase');
      const models = await firestore.query('aiModels', [
        { field: 'owner', operator: '==', value: userId },
        { field: 'status', operator: '==', value: 'approved' }
      ]);
      
      return models.length;
    } catch (error) {
      console.error('Error getting user models count from Firebase:', error);
      return 0;
    }
  }

  // Migrate existing localStorage subscriptions to Firebase
  static async migrateSubscriptionsToFirebase(): Promise<boolean> {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      let migrationSuccess = true;

      for (const user of users) {
        if (user.subscription) {
          const success = await this.createSubscription(user.id, user.subscription);
          if (!success) {
            console.error(`Failed to migrate subscription for user: ${user.id}`);
            migrationSuccess = false;
          }
        }
      }

      if (migrationSuccess) {
        console.log('✅ All subscriptions migrated to Firebase successfully');
        // Optionally clear localStorage subscriptions after migration
        // localStorage.removeItem('users');
      }

      return migrationSuccess;
    } catch (error) {
      console.error('Error migrating subscriptions to Firebase:', error);
      return false;
    }
  }
}