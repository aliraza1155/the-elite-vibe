'use client';

import { SubscriptionManager } from './subscription-utils';
import { userService } from '@/lib/firebase';

export interface PaymentConfig {
  minimumModelPrice: number;
  subscriptionPlans: {
    seller: {
      starter: { price: number; commission: number; maxModels: number };
      pro: { price: number; commission: number; maxModels: number };
      enterprise: { price: number; commission: number; maxModels: number };
    };
  };
}

export interface PurchaseTransaction {
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
}

export interface SellerEarnings {
  totalRevenue: number;
  availableBalance: number;
  pendingPayout: number;
  totalPayouts: number;
  commissionRate: number;
  transactions: PurchaseTransaction[];
}

export class PaymentManager {
  private static config: PaymentConfig = {
    minimumModelPrice: 50,
    subscriptionPlans: {
      seller: {
        starter: { price: 29.99, commission: 0.20, maxModels: 3 },
        pro: { price: 79.99, commission: 0.15, maxModels: 15 },
        enterprise: { price: 199.99, commission: 0.10, maxModels: -1 }
      }
    }
  };

  // Validate model price (unchanged)
  static validateModelPrice(price: number): { isValid: boolean; error?: string } {
    if (price < this.config.minimumModelPrice) {
      return {
        isValid: false,
        error: `Minimum model price is $${this.config.minimumModelPrice}`
      };
    }

    if (price > 10000) {
      return {
        isValid: false,
        error: 'Maximum model price is $10,000'
      };
    }

    return { isValid: true };
  }

  // Calculate seller earnings - FIXED: Make it async
  static async calculateSellerEarnings(price: number, sellerId: string): Promise<number> {
    const commissionRate = await this.getSellerCommissionRate(sellerId);
    return price * (1 - commissionRate);
  }

  // Get seller commission rate using Firebase
  static async getSellerCommissionRate(sellerId: string): Promise<number> {
    try {
      const seller = await userService.getUserById(sellerId);
      
      if (!seller?.subscription) {
        return 0.20; // Default commission for non-subscribers
      }

      const planId = seller.subscription.planId;
      const features = SubscriptionManager.getSubscriptionFeatures(planId);
      
      return (100 - features.revenueShare) / 100; // Convert revenue share to commission rate
    } catch (error) {
      console.error('Error getting seller commission rate:', error);
      return 0.20; // Default fallback
    }
  }

  // Check if user can list models using Firebase
  static async canUserListModel(user: any): Promise<{ 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  }> {
    return await SubscriptionManager.canUserListModels(user);
  }

  // Check if user can approve model using Firebase
  static async canUserApproveModel(user: any, modelId?: string): Promise<{ canApprove: boolean; reason?: string }> {
    const listCheck = await this.canUserListModel(user);
    
    if (!listCheck.canList) {
      return { canApprove: false, reason: listCheck.reason };
    }

    if (modelId) {
      // Check if model belongs to user (you'll need to implement this)
      const { firestore } = require('@/lib/firebase');
      const model = await firestore.get('aiModels', modelId);
      
      if (model && model.owner !== user.id) {
        return { canApprove: false, reason: 'You can only approve your own models' };
      }
    }

    return { canApprove: true };
  }

  // Process model purchase with Stripe Checkout (unchanged)
  static async processModelPurchase(
    modelId: string, 
    buyerId: string, 
    price: number
  ): Promise<{ 
    success: boolean; 
    sessionUrl?: string; 
    sessionId?: string;
    error?: string; 
  }> {
    try {
      const { firestore } = require('@/lib/firebase');
      const model = await firestore.get('aiModels', modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      if (model.status !== 'approved') {
        return { success: false, error: 'Model is not available for purchase' };
      }

      // Check if user already purchased
      if (await this.hasUserPurchasedModel(buyerId, modelId)) {
        return { success: false, error: 'You already purchased this model' };
      }

      // Call backend to create Stripe Checkout session
      const response = await fetch('/api/checkout/model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price,
          modelName: model.name,
          modelId: model.id,
          buyerId: buyerId,
          sellerId: model.owner,
          customerId: await this.getUserStripeCustomerId(buyerId)
        }),
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create payment session' };
      }

      return { 
        success: true, 
        sessionUrl: result.sessionUrl,
        sessionId: result.sessionId
      };

    } catch (error) {
      console.error('Purchase processing error:', error);
      return { success: false, error: 'Purchase failed' };
    }
  }

  // Complete purchase after successful Stripe payment with Firebase
  static async completePurchaseAfterStripePayment(
    sessionId: string,
    modelId: string,
    buyerId: string,
    price: number
  ): Promise<{ success: boolean; transaction?: PurchaseTransaction; error?: string }> {
    try {
      const { firestore } = require('@/lib/firebase');
      const model = await firestore.get('aiModels', modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const commissionRate = await this.getSellerCommissionRate(model.owner);
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      // Create transaction record
      const transaction: PurchaseTransaction = {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: await this.getUserName(buyerId),
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100, // FIXED: Now commissionRate is a number, not a Promise
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        stripeSessionId: sessionId
      };

      // Save transaction to Firebase
      await this.saveTransactionToFirebase(transaction);

      // Update model download count in Firebase
      await this.updateModelStatsInFirebase(modelId);

      // Update buyer's purchase history in Firebase
      await this.updateBuyerStatsInFirebase(buyerId, price);

      // Update seller's earnings in Firebase
      await this.updateSellerEarningsInFirebase(model.owner, sellerRevenue);

      return { success: true, transaction };

    } catch (error) {
      console.error('Error completing purchase:', error);
      return { success: false, error: 'Failed to complete purchase' };
    }
  }

  // Verify Stripe payment (unchanged)
  static async verifyStripePayment(sessionId: string): Promise<{ 
    success: boolean; 
    isPaid: boolean; 
    modelId?: string; 
    buyerId?: string;
    amount?: number;
    error?: string 
  }> {
    try {
      // Call backend to verify Stripe session
      const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
      const result = await response.json();

      if (!result.success) {
        return { success: false, isPaid: false, error: result.error };
      }

      const { session } = result;
      
      if (session.payment_status === 'paid' && session.metadata?.type === 'model_purchase') {
        return {
          success: true,
          isPaid: true,
          modelId: session.metadata.modelId,
          buyerId: session.metadata.buyerId,
          amount: parseFloat(session.metadata.amount)
        };
      }

      return { success: true, isPaid: false };

    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      return { success: false, isPaid: false, error: 'Failed to verify payment' };
    }
  }

  // Check if user has purchased model using Firebase
  static async hasUserPurchasedModel(userId: string, modelId: string): Promise<boolean> {
    try {
      const { firestore } = require('@/lib/firebase');
      const transactions = await firestore.query('purchaseTransactions', [
        { field: 'buyerId', operator: '==', value: userId },
        { field: 'modelId', operator: '==', value: modelId },
        { field: 'status', operator: '==', value: 'completed' }
      ]);
      
      return transactions.length > 0;
    } catch (error) {
      console.error('Error checking user purchase:', error);
      return false;
    }
  }

  // Get user purchases from Firebase
  static async getUserPurchases(userId: string): Promise<PurchaseTransaction[]> {
    try {
      const { firestore } = require('@/lib/firebase');
      const transactions = await firestore.query('purchaseTransactions', [
        { field: 'buyerId', operator: '==', value: userId },
        { field: 'status', operator: '==', value: 'completed' }
      ]);
      
      return transactions.sort((a: any, b: any) => 
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting user purchases:', error);
      return [];
    }
  }

  // Get seller earnings from Firebase
  static async getSellerEarnings(sellerId: string): Promise<SellerEarnings> {
    try {
      const { firestore } = require('@/lib/firebase');
      const transactions = await firestore.query('purchaseTransactions', [
        { field: 'sellerId', operator: '==', value: sellerId },
        { field: 'status', operator: '==', value: 'completed' }
      ]);

      const totalRevenue = transactions.reduce((sum: number, tx: any) => sum + tx.sellerRevenue, 0);
      
      const payouts = await firestore.query('payouts', [
        { field: 'sellerId', operator: '==', value: sellerId },
        { field: 'status', operator: '==', value: 'completed' }
      ]);
      
      const totalPayouts = payouts.reduce((sum: number, payout: any) => sum + payout.amount, 0);
      const availableBalance = totalRevenue - totalPayouts;
      const currentCommissionRate = await this.getSellerCommissionRate(sellerId);

      return {
        totalRevenue,
        availableBalance,
        pendingPayout: 0,
        totalPayouts,
        commissionRate: currentCommissionRate * 100, // FIXED: Now currentCommissionRate is a number
        transactions
      };
    } catch (error) {
      console.error('Error getting seller earnings:', error);
      return {
        totalRevenue: 0,
        availableBalance: 0,
        pendingPayout: 0,
        totalPayouts: 0,
        commissionRate: 20,
        transactions: []
      };
    }
  }

  // Request payout using Firebase
  static async requestPayout(sellerId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const earnings = await this.getSellerEarnings(sellerId);
      
      if (amount < 50) {
        return { success: false, error: 'Minimum payout amount is $50' };
      }

      if (amount > earnings.availableBalance) {
        return { success: false, error: 'Insufficient available balance' };
      }

      const payout = {
        id: `payout_${Date.now()}`,
        sellerId,
        amount,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };

      const { firestore } = require('@/lib/firebase');
      await firestore.create('payouts', payout);

      await this.updatePayoutRequestInFirebase(sellerId, amount);

      return { success: true };
    } catch (error) {
      console.error('Error requesting payout:', error);
      return { success: false, error: 'Failed to request payout' };
    }
  }

  // Firebase helper methods
  private static async saveTransactionToFirebase(transaction: PurchaseTransaction): Promise<void> {
    const { firestore } = require('@/lib/firebase');
    await firestore.create('purchaseTransactions', transaction);
  }

  private static async getUserName(userId: string): Promise<string> {
    const user = await userService.getUserById(userId);
    return user?.displayName || user?.username || 'Unknown User';
  }

  private static async getUserStripeCustomerId(userId: string): Promise<string | undefined> {
    const user = await userService.getUserById(userId);
    return user?.stripeCustomerId;
  }

  private static async updateModelStatsInFirebase(modelId: string): Promise<void> {
    const { firestore } = require('@/lib/firebase');
    const model = await firestore.get('aiModels', modelId);
    
    if (model) {
      await firestore.update('aiModels', modelId, {
        stats: {
          ...model.stats,
          downloads: (model.stats?.downloads || 0) + 1
        },
        updatedAt: new Date().toISOString()
      });
    }
  }

  private static async updateBuyerStatsInFirebase(buyerId: string, amount: number): Promise<void> {
    const buyer = await userService.getUserById(buyerId);
    
    if (buyer) {
      await userService.updateUserProfile(buyerId, {
        stats: {
          ...buyer.stats,
          totalPurchases: (buyer.stats?.totalPurchases || 0) + 1,
          totalSpent: (buyer.stats?.totalSpent || 0) + amount
        },
        updatedAt: new Date().toISOString()
      });

      // Update current user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === buyerId) {
        const updatedUser = await userService.getUserById(buyerId);
        if (updatedUser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    }
  }

  private static async updateSellerEarningsInFirebase(sellerId: string, amount: number): Promise<void> {
    const seller = await userService.getUserById(sellerId);
    
    if (seller) {
      const currentEarnings = seller.earnings || { total: 0, available: 0, pending: 0, paidOut: 0 };
      
      await userService.updateUserProfile(sellerId, {
        earnings: {
          total: currentEarnings.total + amount,
          available: currentEarnings.available + amount,
          pending: currentEarnings.pending || 0,
          paidOut: currentEarnings.paidOut || 0
        },
        stats: {
          ...seller.stats,
          totalSales: (seller.stats?.totalSales || 0) + 1,
          totalRevenue: (seller.stats?.totalRevenue || 0) + amount
        },
        updatedAt: new Date().toISOString()
      });

      // Update current user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === sellerId) {
        const updatedUser = await userService.getUserById(sellerId);
        if (updatedUser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    }
  }

  private static async updatePayoutRequestInFirebase(sellerId: string, amount: number): Promise<void> {
    const seller = await userService.getUserById(sellerId);
    
    if (seller) {
      await userService.updateUserProfile(sellerId, {
        earnings: {
          ...seller.earnings,
          available: (seller.earnings?.available || 0) - amount,
          pending: (seller.earnings?.pending || 0) + amount
        },
        updatedAt: new Date().toISOString()
      });

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id === sellerId) {
        const updatedUser = await userService.getUserById(sellerId);
        if (updatedUser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    }
  }

  // Get config (unchanged)
  static getConfig(): PaymentConfig {
    return this.config;
  }

  // Backward compatibility methods
  static recordSale(modelId: string, sellerId: string, price: number): void {
    // For backward compatibility
    this.processDirectPurchase(modelId, 'anonymous_buyer', price);
  }

  static async processListingFee(user: any, modelPrice: number): Promise<{ success: boolean; error?: string }> {
    const canApprove = await this.canUserApproveModel(user);
    if (!canApprove.canApprove) {
      return { success: false, error: canApprove.reason };
    }
    return { success: true };
  }

  // Legacy method for direct purchase (without payment) using Firebase
  static async processDirectPurchase(
    modelId: string, 
    buyerId: string, 
    price: number
  ): Promise<{ success: boolean; transaction?: PurchaseTransaction; error?: string }> {
    try {
      const { firestore } = require('@/lib/firebase');
      const model = await firestore.get('aiModels', modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      if (model.status !== 'approved') {
        return { success: false, error: 'Model is not available for purchase' };
      }

      if (await this.hasUserPurchasedModel(buyerId, modelId)) {
        return { success: false, error: 'You already purchased this model' };
      }

      const commissionRate = await this.getSellerCommissionRate(model.owner);
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      const transaction: PurchaseTransaction = {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: await this.getUserName(buyerId),
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100, // FIXED: Now commissionRate is a number
        status: 'completed',
        purchasedAt: new Date().toISOString()
      };

      await this.saveTransactionToFirebase(transaction);
      await this.updateModelStatsInFirebase(modelId);
      await this.updateBuyerStatsInFirebase(buyerId, price);
      await this.updateSellerEarningsInFirebase(model.owner, sellerRevenue);

      return { success: true, transaction };

    } catch (error) {
      console.error('Direct purchase processing error:', error);
      return { success: false, error: 'Purchase failed' };
    }
  }
}