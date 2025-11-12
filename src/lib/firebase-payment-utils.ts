'use client';

import { paymentService, subscriptionService, userPaymentService } from './firebase';

export interface FirebasePurchaseTransaction {
  id: string;
  modelId: string;
  modelName: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  sellerRevenue: number;
  platformCommission: number;
  commissionRate: number;
  status: 'completed' | 'failed' | 'refunded';
  purchasedAt: string;
  stripeSessionId?: string;
  firestoreId?: string;
}

export interface FirebaseSubscription {
  id: string;
  userId: string;
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
  firestoreId?: string;
}

export class FirebasePaymentManager {
  // Complete purchase after successful Stripe payment
  static async completePurchaseAfterStripePayment(
    sessionId: string,
    modelId: string,
    buyerId: string,
    price: number,
    modelName: string,
    sellerId: string,
    sellerName: string,
    commissionRate: number
  ): Promise<{ success: boolean; transaction?: FirebasePurchaseTransaction; error?: string }> {
    try {
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      // Create transaction record in Firebase
      const transaction: Omit<FirebasePurchaseTransaction, 'id' | 'firestoreId'> = {
        modelId,
        modelName,
        buyerId,
        buyerName: await this.getUserName(buyerId),
        sellerId,
        sellerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        stripeSessionId: sessionId
      };

      const transactionId = await paymentService.createTransaction(transaction);
      
      const fullTransaction: FirebasePurchaseTransaction = {
        ...transaction,
        id: transactionId,
        firestoreId: transactionId
      };

      // Update buyer stats
      await this.updateBuyerStats(buyerId, price);

      // Update seller earnings
      await this.updateSellerEarnings(sellerId, sellerRevenue);

      return { success: true, transaction: fullTransaction };

    } catch (error) {
      console.error('Error completing purchase in Firebase:', error);
      return { success: false, error: 'Failed to complete purchase' };
    }
  }

  // Verify if user has purchased a model
  static async hasUserPurchasedModel(userId: string, modelId: string): Promise<boolean> {
    try {
      const transactions = await paymentService.getUserTransactions(userId);
      return transactions.some(tx => 
        tx.modelId === modelId && 
        tx.status === 'completed'
      );
    } catch (error) {
      console.error('Error checking user purchases:', error);
      return false;
    }
  }

  // Get user purchases
  static async getUserPurchases(userId: string): Promise<FirebasePurchaseTransaction[]> {
    try {
      const transactions = await paymentService.getUserTransactions(userId);
      return transactions
        .filter(tx => tx.status === 'completed')
        .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    } catch (error) {
      console.error('Error getting user purchases:', error);
      return [];
    }
  }

  // Get seller earnings
  static async getSellerEarnings(sellerId: string): Promise<any> {
    try {
      const transactions = await paymentService.getSellerTransactions(sellerId);
      const sellerTransactions = transactions.filter(tx => tx.status === 'completed');

      const totalRevenue = sellerTransactions.reduce((sum, tx) => sum + tx.sellerRevenue, );
      // Note: Payouts would need their own Firebase collection
      const totalPayouts = 0; // This would come from a payouts collection
      const availableBalance = totalRevenue - totalPayouts;
      const currentCommissionRate = await this.getSellerCommissionRate(sellerId);

      return {
        totalRevenue,
        availableBalance,
        pendingPayout: 0,
        totalPayouts,
        commissionRate: currentCommissionRate * 100,
        transactions: sellerTransactions
      };
    } catch (error) {
      console.error('Error getting seller earnings:', error);
      return {
        totalRevenue: 0,
        availableBalance: 0,
        pendingPayout: 0,
        totalPayouts: 0,
        commissionRate: 0,
        transactions: []
      };
    }
  }

  // Create or update user subscription
  static async updateUserSubscription(
    userId: string,
    subscriptionData: any
  ): Promise<{ success: boolean; subscription?: FirebaseSubscription; error?: string }> {
    try {
      // Check if user already has an active subscription
      const existingSubscription = await subscriptionService.getUserSubscription(userId);
      
      let subscriptionId: string;
      if (existingSubscription) {
        // Update existing subscription
        await subscriptionService.updateSubscription(existingSubscription.id, subscriptionData);
        subscriptionId = existingSubscription.id;
      } else {
        // Create new subscription
        subscriptionId = await subscriptionService.createSubscription({
          userId,
          ...subscriptionData
        });
      }

      const subscription: FirebaseSubscription = {
        ...subscriptionData,
        id: subscriptionId,
        userId,
        firestoreId: subscriptionId
      };

      // Update user document with subscription info
      await userPaymentService.updateUserStats(userId, {
        subscription: subscriptionData
      });

      return { success: true, subscription };

    } catch (error) {
      console.error('Error updating user subscription:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  // Get user subscription
  static async getUserSubscription(userId: string): Promise<FirebaseSubscription | null> {
    try {
      return await subscriptionService.getUserSubscription(userId);
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Helper methods
  private static async getUserName(userId: string): Promise<string> {
    try {
      const user = await userPaymentService.getUserPaymentData(userId);
      return user?.displayName || user?.username || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  private static async getSellerCommissionRate(sellerId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(sellerId);
      if (subscription?.features?.revenueShare) {
        return (100 - subscription.features.revenueShare) / 100;
      }
      return 0.20; // Default commission
    } catch (error) {
      return 0.20;
    }
  }

  private static async updateBuyerStats(buyerId: string, amount: number): Promise<void> {
    try {
      const user = await userPaymentService.getUserPaymentData(buyerId);
      const currentStats = user?.stats || {};
      
      await userPaymentService.updateUserStats(buyerId, {
        ...currentStats,
        totalPurchases: (currentStats.totalPurchases || 0) + 1,
        totalSpent: (currentStats.totalSpent || 0) + amount
      });
    } catch (error) {
      console.error('Error updating buyer stats:', error);
    }
  }

  private static async updateSellerEarnings(sellerId: string, amount: number): Promise<void> {
    try {
      const user = await userPaymentService.getUserPaymentData(sellerId);
      const currentEarnings = user?.earnings || { total: 0, available: 0, pending: 0, paidOut: 0 };
      const currentStats = user?.stats || {};
      
      await userPaymentService.updateUserEarnings(sellerId, {
        total: currentEarnings.total + amount,
        available: currentEarnings.available + amount,
        pending: currentEarnings.pending || 0,
        paidOut: currentEarnings.paidOut || 0
      });

      await userPaymentService.updateUserStats(sellerId, {
        ...currentStats,
        totalSales: (currentStats.totalSales || 0) + 1,
        totalRevenue: (currentStats.totalRevenue || 0) + amount
      });
    } catch (error) {
      console.error('Error updating seller earnings:', error);
    }
  }
}