// lib/payment-utils.ts - COMPLETELY FIXED VERSION
'use client';

import { SubscriptionManager } from './subscription-utils';
import { FirebaseDatabase, FirebaseTransaction } from './firebase-database';

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

  static async calculateSellerEarnings(price: number, sellerId: string): Promise<number> {
    const commissionRate = await this.getSellerCommissionRate(sellerId);
    return price * (1 - commissionRate);
  }

  static async getSellerCommissionRate(sellerId: string): Promise<number> {
    try {
      const subscription = await FirebaseDatabase.getUserSubscription(sellerId);
      
      if (!subscription) {
        return 0.20; // Default commission for non-subscribers
      }

      const features = SubscriptionManager.getSubscriptionFeatures(subscription.planId);
      return (100 - features.revenueShare) / 100; // Convert revenue share to commission rate
    } catch (error) {
      console.error('Error getting seller commission rate:', error);
      return 0.20; // Default fallback
    }
  }

  // FIXED: Properly handle the async SubscriptionManager.canUserListModels
  static canUserListModel(user: any): { 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  } {
    // For synchronous usage, we need to handle the promise immediately
    // This is a workaround for the async SubscriptionManager
    try {
      // Check if user has basic requirements synchronously
      if (!user) {
        return { canList: false, reason: 'User not found' };
      }

      if (user.role !== 'seller' && user.role !== 'both') {
        return { canList: false, reason: 'Seller account required to list models' };
      }

      // For subscription check, we'll use a simplified synchronous approach
      const hasActiveSub = user.subscription && 
                          user.subscription.status === 'active' && 
                          new Date(user.subscription.expiresAt) > new Date();
      
      if (!hasActiveSub) {
        return { 
          canList: false, 
          reason: 'Active subscription required to list models. Please upgrade your plan.',
          subscriptionTier: 'Free'
        };
      }

      const maxModels = SubscriptionManager.getMaxModelsForPlan(user.subscription.planId);
      const currentModels = this.getUserApprovedModelsCountSync(user.id);

      if (maxModels !== -1 && currentModels >= maxModels) {
        return { 
          canList: false, 
          reason: `You've reached your limit of ${maxModels} models. Upgrade your plan to list more models.`,
          maxModels,
          currentModels,
          subscriptionTier: SubscriptionManager.getSubscriptionTierName(user.subscription.planId)
        };
      }

      return { 
        canList: true, 
        maxModels, 
        currentModels,
        subscriptionTier: SubscriptionManager.getSubscriptionTierName(user.subscription.planId)
      };

    } catch (error) {
      console.error('Error checking if user can list models:', error);
      return { canList: false, reason: 'Error checking subscription status' };
    }
  }

  static async canUserListModelAsync(user: any): Promise<{ 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  }> {
    return await SubscriptionManager.canUserListModels(user);
  }

  static canUserApproveModel(user: any, modelId?: string): { canApprove: boolean; reason?: string } {
    const listCheck = this.canUserListModel(user);
    
    if (!listCheck.canList) {
      return { canApprove: false, reason: listCheck.reason };
    }

    if (modelId) {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const model = models.find((m: any) => m.id === modelId);
      
      if (model && model.owner !== user.id) {
        return { canApprove: false, reason: 'You can only approve your own models' };
      }
    }

    return { canApprove: true };
  }

  // Process model purchase with Stripe Checkout
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
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const model = models.find((m: any) => m.id === modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      if (model.status !== 'approved') {
        return { success: false, error: 'Model is not available for purchase' };
      }

      // Check if user already purchased using Firebase
      const hasPurchased = await FirebaseDatabase.hasUserPurchasedModel(buyerId, modelId);
      if (hasPurchased) {
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

  // Complete purchase after successful Stripe payment
  static async completePurchaseAfterStripePayment(
    sessionId: string,
    modelId: string,
    buyerId: string,
    price: number
  ): Promise<{ success: boolean; transaction?: PurchaseTransaction; error?: string }> {
    try {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const model = models.find((m: any) => m.id === modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const commissionRate = await this.getSellerCommissionRate(model.owner);
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      // Create transaction record in Firebase
      const transactionData: Omit<FirebaseTransaction, 'id' | 'createdAt'> = {
        sessionId,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: await this.getUserName(buyerId),
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        type: 'model_purchase'
      };

      const transactionId = await FirebaseDatabase.createTransaction(transactionData);

      // Create transaction object for response (matching existing interface)
      const transaction: PurchaseTransaction = {
        id: transactionId,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: transactionData.buyerName,
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: transactionData.purchasedAt,
        stripeSessionId: sessionId
      };

      // Update model download count in localStorage (keep existing functionality)
      this.updateModelStats(modelId);

      // Update buyer's purchase history in localStorage (keep existing functionality)
      this.updateBuyerStats(buyerId, price);

      // Update seller's earnings in localStorage (keep existing functionality)
      this.updateSellerEarnings(model.owner, sellerRevenue);

      return { success: true, transaction };

    } catch (error) {
      console.error('Error completing purchase:', error);
      return { success: false, error: 'Failed to complete purchase' };
    }
  }

  // Check if a purchase was completed for a Stripe session
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

  static async hasUserPurchasedModel(userId: string, modelId: string): Promise<boolean> {
    try {
      return await FirebaseDatabase.hasUserPurchasedModel(userId, modelId);
    } catch (error) {
      console.error('Error checking purchase status:', error);
      // Fallback to localStorage check
      const transactions = this.getTransactions();
      return transactions.some(tx => 
        tx.buyerId === userId && 
        tx.modelId === modelId && 
        tx.status === 'completed'
      );
    }
  }

  static async getUserPurchases(userId: string): Promise<PurchaseTransaction[]> {
    try {
      const firebaseTransactions = await FirebaseDatabase.getUserTransactions(userId, 'buyer');
      
      // Convert Firebase transactions to PurchaseTransaction format with proper typing
      const purchaseTransactions: PurchaseTransaction[] = firebaseTransactions.map(tx => ({
        id: tx.id,
        modelId: tx.modelId,
        modelName: tx.modelName,
        buyerId: tx.buyerId,
        buyerName: tx.buyerName,
        sellerId: tx.sellerId,
        sellerName: tx.sellerName,
        price: tx.price,
        sellerRevenue: tx.sellerRevenue,
        platformCommission: tx.platformCommission,
        commissionRate: tx.commissionRate,
        status: tx.status,
        purchasedAt: tx.purchasedAt,
        stripeSessionId: tx.sessionId
      }));

      return purchaseTransactions;
    } catch (error) {
      console.error('Error getting user purchases from Firebase:', error);
      // Fallback to localStorage
      const transactions = this.getTransactions();
      return transactions.filter(tx => 
        tx.buyerId === userId && 
        tx.status === 'completed'
      ).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    }
  }

  static async getSellerEarnings(sellerId: string): Promise<SellerEarnings> {
    try {
      const earnings = await FirebaseDatabase.getUserEarnings(sellerId);
      const transactions = await FirebaseDatabase.getUserTransactions(sellerId, 'seller');
      
      // Convert Firebase transactions to PurchaseTransaction format
      const purchaseTransactions: PurchaseTransaction[] = transactions.map(tx => ({
        id: tx.id,
        modelId: tx.modelId,
        modelName: tx.modelName,
        buyerId: tx.buyerId,
        buyerName: tx.buyerName,
        sellerId: tx.sellerId,
        sellerName: tx.sellerName,
        price: tx.price,
        sellerRevenue: tx.sellerRevenue,
        platformCommission: tx.platformCommission,
        commissionRate: tx.commissionRate,
        status: tx.status,
        purchasedAt: tx.purchasedAt,
        stripeSessionId: tx.sessionId
      }));

      return {
        ...earnings,
        transactions: purchaseTransactions
      };
    } catch (error) {
      console.error('Error getting seller earnings from Firebase:', error);
      // Fallback to localStorage calculation
      const transactions = this.getTransactions();
      const sellerTransactions = transactions.filter(tx => 
        tx.sellerId === sellerId && 
        tx.status === 'completed'
      );

      const totalRevenue = sellerTransactions.reduce((sum, tx) => sum + tx.sellerRevenue, 0);
      const payouts = this.getSellerPayouts(sellerId);
      const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
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
    }
  }

  static async requestPayout(sellerId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const earnings = await this.getSellerEarnings(sellerId);
      
      if (amount < 50) {
        return { success: false, error: 'Minimum payout amount is $50' };
      }

      if (amount > earnings.availableBalance) {
        return { success: false, error: 'Insufficient available balance' };
      }

      // Create payout in Firebase
      await FirebaseDatabase.createPayout({
        sellerId,
        amount,
        requestedAt: new Date().toISOString(),
        processedAt: null,
        status: 'pending'
      });

      // Update localStorage for backward compatibility
      this.updatePayoutRequest(sellerId, amount);

      return { success: true };
    } catch (error) {
      console.error('Error requesting payout:', error);
      return { success: false, error: 'Failed to request payout' };
    }
  }

  // Helper methods for localStorage fallback
  private static getTransactions(): PurchaseTransaction[] {
    return JSON.parse(localStorage.getItem('purchaseTransactions') || '[]');
  }

  private static saveTransaction(transaction: PurchaseTransaction) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('purchaseTransactions', JSON.stringify(transactions));
  }

  private static async getUserName(userId: string): Promise<string> {
    try {
      // Try to get from Firebase first
      const { userService } = await import('./firebase');
      const user = await userService.getUserById(userId);
      return user?.displayName || user?.username || 'Unknown User';
    } catch (error) {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === userId);
      return user?.displayName || user?.username || 'Unknown User';
    }
  }

  private static async getUserStripeCustomerId(userId: string): Promise<string | undefined> {
    try {
      const { userService } = await import('./firebase');
      const user = await userService.getUserById(userId);
      return user?.stripeCustomerId;
    } catch (error) {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === userId);
      return user?.stripeCustomerId;
    }
  }

  private static updateModelStats(modelId: string) {
    const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
    const updatedModels = models.map((model: any) => {
      if (model.id === modelId) {
        return {
          ...model,
          stats: {
            ...model.stats,
            downloads: (model.stats.downloads || 0) + 1
          }
        };
      }
      return model;
    });
    localStorage.setItem('aiModels', JSON.stringify(updatedModels));
  }

  private static updateBuyerStats(buyerId: string, amount: number) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((user: any) => {
      if (user.id === buyerId) {
        return {
          ...user,
          stats: {
            ...user.stats,
            totalPurchases: (user.stats?.totalPurchases || 0) + 1,
            totalSpent: (user.stats?.totalSpent || 0) + amount
          }
        };
      }
      return user;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.id === buyerId) {
      const updatedCurrentUser = updatedUsers.find((u: any) => u.id === buyerId);
      if (updatedCurrentUser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }
    }
  }

  private static updateSellerEarnings(sellerId: string, amount: number) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((user: any) => {
      if (user.id === sellerId) {
        const currentEarnings = user.earnings || { total: 0, available: 0, pending: 0, paidOut: 0 };
        return {
          ...user,
          earnings: {
            total: currentEarnings.total + amount,
            available: currentEarnings.available + amount,
            pending: currentEarnings.pending || 0,
            paidOut: currentEarnings.paidOut || 0
          },
          stats: {
            ...user.stats,
            totalSales: (user.stats?.totalSales || 0) + 1,
            totalRevenue: (user.stats?.totalRevenue || 0) + amount
          }
        };
      }
      return user;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.id === sellerId) {
      const updatedCurrentUser = updatedUsers.find((u: any) => u.id === sellerId);
      if (updatedCurrentUser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }
    }
  }

  private static getSellerPayouts(sellerId: string): any[] {
    const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
    return payouts.filter((p: any) => p.sellerId === sellerId && p.status === 'completed');
  }

  private static updatePayoutRequest(sellerId: string, amount: number) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === sellerId);
    
    if (userIndex !== -1) {
      users[userIndex].earnings.available -= amount;
      users[userIndex].earnings.pending += amount;
      users[userIndex].updatedAt = new Date().toISOString();
      
      localStorage.setItem('users', JSON.stringify(users));

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id === sellerId) {
        currentUser.earnings = users[userIndex].earnings;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    }
  }

  static getConfig(): PaymentConfig {
    return this.config;
  }

  // FIXED: Backward compatibility methods - made synchronous
  static recordSale(modelId: string, sellerId: string, price: number): void {
    // For backward compatibility - use the synchronous direct purchase method
    const result = this.processDirectPurchaseSync(modelId, 'anonymous_buyer', price);
    if (!result.success) {
      console.error('Failed to record sale:', result.error);
    }
  }

  static processListingFee(user: any, modelPrice: number): { success: boolean; error?: string } {
    const canApprove = this.canUserApproveModel(user);
    if (!canApprove.canApprove) {
      return { success: false, error: canApprove.reason };
    }
    return { success: true };
  }

  // Synchronous version for backward compatibility
  private static processDirectPurchaseSync(
    modelId: string, 
    buyerId: string, 
    price: number
  ): { success: boolean; transaction?: PurchaseTransaction; error?: string } {
    try {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const model = models.find((m: any) => m.id === modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      if (model.status !== 'approved') {
        return { success: false, error: 'Model is not available for purchase' };
      }

      // Check if user already purchased using localStorage
      const hasPurchased = this.getTransactions().some(tx => 
        tx.buyerId === buyerId && 
        tx.modelId === modelId && 
        tx.status === 'completed'
      );
      
      if (hasPurchased) {
        return { success: false, error: 'You already purchased this model' };
      }

      const commissionRate = 0.20; // Default commission for sync version
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      const transaction: PurchaseTransaction = {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: 'Unknown User', // Simplified for sync version
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString()
      };

      // Save to localStorage only for sync version
      this.saveTransaction(transaction);

      this.updateModelStats(modelId);
      this.updateBuyerStats(buyerId, price);
      this.updateSellerEarnings(model.owner, sellerRevenue);

      return { success: true, transaction };

    } catch (error) {
      console.error('Direct purchase processing error:', error);
      return { success: false, error: 'Purchase failed' };
    }
  }

  // Legacy method for direct purchase (without payment) - async version
  static async processDirectPurchase(
    modelId: string, 
    buyerId: string, 
    price: number
  ): Promise<{ success: boolean; transaction?: PurchaseTransaction; error?: string }> {
    try {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const model = models.find((m: any) => m.id === modelId);
      
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      if (model.status !== 'approved') {
        return { success: false, error: 'Model is not available for purchase' };
      }

      const hasPurchased = await this.hasUserPurchasedModel(buyerId, modelId);
      if (hasPurchased) {
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
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString()
      };

      // Save to both Firebase and localStorage for backward compatibility
      try {
        await FirebaseDatabase.createTransaction({
          sessionId: undefined,
          modelId,
          modelName: model.name,
          buyerId,
          buyerName: transaction.buyerName,
          sellerId: model.owner,
          sellerName: model.ownerName,
          price,
          sellerRevenue,
          platformCommission,
          commissionRate: commissionRate * 100,
          status: 'completed',
          purchasedAt: transaction.purchasedAt,
          type: 'model_purchase'
        });
      } catch (error) {
        console.error('Failed to save transaction to Firebase, using localStorage only:', error);
        this.saveTransaction(transaction);
      }

      this.updateModelStats(modelId);
      this.updateBuyerStats(buyerId, price);
      this.updateSellerEarnings(model.owner, sellerRevenue);

      return { success: true, transaction };

    } catch (error) {
      console.error('Direct purchase processing error:', error);
      return { success: false, error: 'Purchase failed' };
    }
  }

  // Helper method to get user's approved models count synchronously
  private static getUserApprovedModelsCountSync(userId: string): number {
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

  // Synchronous version for backward compatibility
  static getUserPurchasesSync(userId: string): PurchaseTransaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(tx => 
      tx.buyerId === userId && 
      tx.status === 'completed'
    ).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }

  static getSellerEarningsSync(sellerId: string): SellerEarnings {
    const transactions = this.getTransactions();
    const sellerTransactions = transactions.filter(tx => 
      tx.sellerId === sellerId && 
      tx.status === 'completed'
    );

    const totalRevenue = sellerTransactions.reduce((sum, tx) => sum + tx.sellerRevenue, 0);
    const payouts = this.getSellerPayouts(sellerId);
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const availableBalance = totalRevenue - totalPayouts;

    return {
      totalRevenue,
      availableBalance,
      pendingPayout: 0,
      totalPayouts,
      commissionRate: 20, // Default commission rate
      transactions: sellerTransactions
    };
  }
}