// lib/subscription-utils.ts - UPDATED VERSION
'use client';

import { FirebaseDatabase, FirebaseSubscription } from './firebase-database';

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
  static async getCurrentUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const firebaseSubscription = await FirebaseDatabase.getUserSubscription(userId);
      if (!firebaseSubscription) return null;

      // Convert Firebase subscription to local Subscription format
      return {
        id: firebaseSubscription.id,
        stripeSubscriptionId: firebaseSubscription.stripeSubscriptionId,
        stripeCustomerId: firebaseSubscription.stripeCustomerId,
        planId: firebaseSubscription.planId,
        type: firebaseSubscription.type,
        amount: firebaseSubscription.amount,
        status: firebaseSubscription.status,
        purchasedAt: firebaseSubscription.purchasedAt,
        expiresAt: firebaseSubscription.expiresAt,
        paymentMethod: firebaseSubscription.paymentMethod,
        features: firebaseSubscription.features,
        billingCycle: firebaseSubscription.billingCycle,
        nextBillingDate: firebaseSubscription.nextBillingDate
      };
    } catch (error) {
      console.error('Error getting user subscription from Firebase:', error);
      // Fallback to localStorage
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        return currentUser?.subscription || null;
      } catch (localError) {
        console.error('Error getting subscription from localStorage:', localError);
        return null;
      }
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(user?: any): Promise<boolean> {
    try {
      const targetUser = user || JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!targetUser) return false;

      // Try Firebase first
      const subscription = await this.getCurrentUserSubscription(targetUser.id);
      if (subscription) {
        const isActive = subscription.status === 'active';
        const isNotExpired = new Date(subscription.expiresAt) > new Date();
        return isActive && isNotExpired;
      }

      // Fallback to localStorage check
      const localSubscription = targetUser.subscription;
      if (!localSubscription) return false;

      const isActive = localSubscription.status === 'active';
      const isNotExpired = new Date(localSubscription.expiresAt) > new Date();
      
      return isActive && isNotExpired;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Get subscription features
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

  // Get subscription tier name
  static getSubscriptionTierName(planId: string): string {
    const features = this.getSubscriptionFeatures(planId);
    return features.name || 'Free';
  }

  // Get max models for plan
  static getMaxModelsForPlan(planId: string): number {
    const features = this.getSubscriptionFeatures(planId);
    return features.maxModels || 0;
  }

  // Update user subscription in Firebase
  static async updateUserSubscription(userId: string, subscriptionData: Partial<Subscription>): Promise<boolean> {
    try {
      // Update in Firebase
      const firebaseUpdates: Partial<FirebaseSubscription> = {
        ...subscriptionData,
        updatedAt: new Date().toISOString()
      };

      // If we have the subscription ID, update it directly
      if (subscriptionData.id) {
        await FirebaseDatabase.updateSubscription(subscriptionData.id, firebaseUpdates);
      } else {
        // Otherwise, get the current subscription and update it
        const currentSubscription = await FirebaseDatabase.getUserSubscription(userId);
        if (currentSubscription) {
          await FirebaseDatabase.updateSubscription(currentSubscription.id, firebaseUpdates);
        }
      }

      // Also update localStorage for backward compatibility
      this.updateLocalStorageSubscription(userId, subscriptionData);

      return true;
    } catch (error) {
      console.error('Error updating user subscription in Firebase:', error);
      // Fallback to localStorage only
      return this.updateLocalStorageSubscription(userId, subscriptionData);
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      // Cancel in Firebase
      const subscription = await FirebaseDatabase.getUserSubscription(userId);
      if (subscription) {
        await FirebaseDatabase.cancelSubscription(subscription.id);
      }

      // Update localStorage for backward compatibility
      return this.updateLocalStorageSubscription(userId, { status: 'canceled' });
    } catch (error) {
      console.error('Error canceling subscription in Firebase:', error);
      // Fallback to localStorage only
      return this.updateLocalStorageSubscription(userId, { status: 'canceled' });
    }
  }

  // Create new subscription
  static async createUserSubscription(userId: string, subscriptionData: Omit<Subscription, 'id'>): Promise<string> {
    try {
      const firebaseSubscription: Omit<FirebaseSubscription, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: userId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        planId: subscriptionData.planId,
        type: subscriptionData.type,
        amount: subscriptionData.amount,
        status: subscriptionData.status,
        purchasedAt: subscriptionData.purchasedAt,
        expiresAt: subscriptionData.expiresAt,
        paymentMethod: subscriptionData.paymentMethod,
        features: subscriptionData.features,
        billingCycle: subscriptionData.billingCycle,
        nextBillingDate: subscriptionData.nextBillingDate
      };

      const subscriptionId = await FirebaseDatabase.createSubscription(firebaseSubscription);

      // Also update localStorage for backward compatibility
      this.updateLocalStorageSubscription(userId, { ...subscriptionData, id: subscriptionId });

      return subscriptionId;
    } catch (error) {
      console.error('Error creating subscription in Firebase:', error);
      // Fallback to localStorage only
      const subscriptionId = `sub_${Date.now()}`;
      this.updateLocalStorageSubscription(userId, { ...subscriptionData, id: subscriptionId });
      return subscriptionId;
    }
  }

  // Get all active subscriptions (for admin purposes)
  static async getAllActiveSubscriptions(): Promise<Array<{userId: string, subscription: Subscription}>> {
    // This would require a different Firestore query structure
    // For now, fallback to localStorage
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const activeSubscriptions = users
        .filter((user: any) => user.subscription && user.subscription.status === 'active')
        .map((user: any) => ({
          userId: user.id,
          subscription: user.subscription
        }));
      
      return activeSubscriptions;
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      return [];
    }
  }

  // Check if user can list models based on subscription
  static async canUserListModels(user?: any): Promise<{ 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  }> {
    try {
      const targetUser = user || JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      if (!targetUser) {
        return { canList: false, reason: 'User not found' };
      }

      if (targetUser.role !== 'seller' && targetUser.role !== 'both') {
        return { canList: false, reason: 'Seller account required to list models' };
      }

      const hasActiveSub = await this.hasActiveSubscription(targetUser);
      
      if (!hasActiveSub) {
        return { 
          canList: false, 
          reason: 'Active subscription required to list models. Please upgrade your plan.',
          subscriptionTier: 'Free'
        };
      }

      const subscription = await this.getCurrentUserSubscription(targetUser.id);
      const maxModels = subscription ? this.getMaxModelsForPlan(subscription.planId) : 0;
      const currentModels = this.getUserApprovedModelsCount(targetUser.id);

      if (maxModels !== -1 && currentModels >= maxModels) {
        return { 
          canList: false, 
          reason: `You've reached your limit of ${maxModels} models. Upgrade your plan to list more models.`,
          maxModels,
          currentModels,
          subscriptionTier: subscription ? this.getSubscriptionTierName(subscription.planId) : 'Free'
        };
      }

      return { 
        canList: true, 
        maxModels, 
        currentModels,
        subscriptionTier: subscription ? this.getSubscriptionTierName(subscription.planId) : 'Free'
      };

    } catch (error) {
      console.error('Error checking if user can list models:', error);
      return { canList: false, reason: 'Error checking subscription status' };
    }
  }

  // Helper method to update localStorage subscription (for backward compatibility)
  private static updateLocalStorageSubscription(userId: string, subscriptionData: Partial<Subscription>): boolean {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].subscription = {
          ...users[userIndex].subscription,
          ...subscriptionData,
          updatedAt: new Date().toISOString()
        };
        users[userIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('users', JSON.stringify(users));

        // Update current user if it's the same user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === userId) {
          currentUser.subscription = users[userIndex].subscription;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user subscription in localStorage:', error);
      return false;
    }
  }

  // Helper method to get user's approved models count
  private static getUserApprovedModelsCount(userId: string): number {
    try {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      return models.filter((model: any) => 
        model.owner === userId && model.status === 'approved'
      ).length;
    } catch (error) {
      console.error('Error getting user models count:', error);
      return 0;
    }
  }
}