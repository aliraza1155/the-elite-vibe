'use client';

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
  // Get current user's active subscription
  static getCurrentUserSubscription(): Subscription | null {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return currentUser?.subscription || null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Check if user has active subscription
  static hasActiveSubscription(user?: any): boolean {
    try {
      const targetUser = user || JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!targetUser) return false;

      const subscription = targetUser.subscription;
      if (!subscription) return false;

      // Check if subscription is active and not expired
      const isActive = subscription.status === 'active';
      const isNotExpired = new Date(subscription.expiresAt) > new Date();
      
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

  // Update user subscription
  static updateUserSubscription(userId: string, subscriptionData: Partial<Subscription>) {
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
      console.error('Error updating user subscription:', error);
      return false;
    }
  }

  // Cancel subscription
  static cancelSubscription(userId: string): boolean {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex !== -1 && users[userIndex].subscription) {
        users[userIndex].subscription.status = 'canceled';
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
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  // Get all active subscriptions (for admin purposes)
  static getAllActiveSubscriptions(): Array<{userId: string, subscription: Subscription}> {
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
  static canUserListModels(user?: any): { 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  } {
    try {
      const targetUser = user || JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      if (!targetUser) {
        return { canList: false, reason: 'User not found' };
      }

      if (targetUser.role !== 'seller' && targetUser.role !== 'both') {
        return { canList: false, reason: 'Seller account required to list models' };
      }

      const hasActiveSub = this.hasActiveSubscription(targetUser);
      
      if (!hasActiveSub) {
        return { 
          canList: false, 
          reason: 'Active subscription required to list models. Please upgrade your plan.',
          subscriptionTier: 'Free'
        };
      }

      const subscription = targetUser.subscription;
      const maxModels = this.getMaxModelsForPlan(subscription.planId);
      const currentModels = this.getUserApprovedModelsCount(targetUser.id);

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