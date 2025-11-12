'use client';

import { SubscriptionManager } from './subscription-utils';

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
  firestoreId?: string;
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

  static calculateSellerEarnings(price: number, sellerId: string): number {
    const commissionRate = this.getSellerCommissionRate(sellerId);
    return price * (1 - commissionRate);
  }

  static getSellerCommissionRate(sellerId: string): number {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const seller = users.find((u: any) => u.id === sellerId);
    
    if (!seller?.subscription) {
      return 0.20; // Default commission for non-subscribers
    }

    const planId = seller.subscription.planId;
    const features = SubscriptionManager.getSubscriptionFeatures(planId);
    
    return (100 - features.revenueShare) / 100; // Convert revenue share to commission rate
  }

  static canUserListModel(user: any): { 
    canList: boolean; 
    reason?: string; 
    maxModels?: number; 
    currentModels?: number;
    subscriptionTier?: string;
  } {
    return SubscriptionManager.canUserListModels(user);
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

      // Check if user already purchased using Firebase first
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
          customerId: this.getUserStripeCustomerId(buyerId)
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

  // Complete purchase after successful Stripe payment - UPDATED FOR FIREBASE
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

      const commissionRate = this.getSellerCommissionRate(model.owner);
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      // Try to save to Firebase first
      try {
        const { FirebasePaymentManager } = await import('./firebase-payment-utils');
        const firebaseResult = await FirebasePaymentManager.completePurchaseAfterStripePayment(
          sessionId,
          modelId,
          buyerId,
          price,
          model.name,
          model.owner,
          model.ownerName,
          commissionRate
        );

        if (firebaseResult.success && firebaseResult.transaction) {
          // Also update localStorage for backward compatibility
          const transaction: PurchaseTransaction = {
            id: firebaseResult.transaction.id,
            modelId,
            modelName: model.name,
            buyerId,
            buyerName: this.getUserName(buyerId),
            sellerId: model.owner,
            sellerName: model.ownerName,
            price,
            sellerRevenue,
            platformCommission,
            commissionRate: commissionRate * 100,
            status: 'completed',
            purchasedAt: new Date().toISOString(),
            stripeSessionId: sessionId,
            firestoreId: firebaseResult.transaction.firestoreId
          };

          this.saveTransaction(transaction);
          this.updateModelStats(modelId);
          
          return { success: true, transaction };
        }
      } catch (firebaseError) {
        console.warn('Firebase transaction failed, falling back to localStorage:', firebaseError);
      }

      // Fallback to localStorage if Firebase fails
      const transaction: PurchaseTransaction = {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: this.getUserName(buyerId),
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        stripeSessionId: sessionId
      };

      // Save transaction to localStorage
      this.saveTransaction(transaction);

      // Update model download count
      this.updateModelStats(modelId);

      // Update buyer's purchase history
      this.updateBuyerStats(buyerId, price);

      // Update seller's earnings
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

  // UPDATED: Check if user has purchased model using Firebase first
  static async hasUserPurchasedModel(userId: string, modelId: string): Promise<boolean> {
    try {
      // Try Firebase first
      const { FirebasePaymentManager } = await import('./firebase-payment-utils');
      const hasPurchased = await FirebasePaymentManager.hasUserPurchasedModel(userId, modelId);
      
      if (hasPurchased) {
        return true;
      }
    } catch (firebaseError) {
      console.warn('Firebase purchase check failed, falling back to localStorage:', firebaseError);
    }
    
    // Fallback to localStorage
    const transactions = this.getTransactions();
    return transactions.some(tx => 
      tx.buyerId === userId && 
      tx.modelId === modelId && 
      tx.status === 'completed'
    );
  }

  // UPDATED: Get user purchases using Firebase first
  static async getUserPurchases(userId: string): Promise<PurchaseTransaction[]> {
    try {
      // Try Firebase first
      const { FirebasePaymentManager } = await import('./firebase-payment-utils');
      const firebasePurchases = await FirebasePaymentManager.getUserPurchases(userId);
      
      if (firebasePurchases.length > 0) {
        return firebasePurchases as PurchaseTransaction[];
      }
    } catch (firebaseError) {
      console.warn('Firebase purchases fetch failed, falling back to localStorage:', firebaseError);
    }
    
    // Fallback to localStorage
    const transactions = this.getTransactions();
    return transactions.filter(tx => 
      tx.buyerId === userId && 
      tx.status === 'completed'
    ).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }

  // UPDATED: Get seller earnings using Firebase first
  static async getSellerEarnings(sellerId: string): Promise<SellerEarnings> {
    try {
      // Try Firebase first
      const { FirebasePaymentManager } = await import('./firebase-payment-utils');
      const firebaseEarnings = await FirebasePaymentManager.getSellerEarnings(sellerId);
      
      if (firebaseEarnings.transactions.length > 0) {
        return firebaseEarnings;
      }
    } catch (firebaseError) {
      console.warn('Firebase earnings fetch failed, falling back to localStorage:', firebaseError);
    }
    
    // Fallback to localStorage
    const transactions = this.getTransactions();
    const sellerTransactions = transactions.filter(tx => 
      tx.sellerId === sellerId && 
      tx.status === 'completed'
    );

    const totalRevenue = sellerTransactions.reduce((sum, tx) => sum + tx.sellerRevenue, 0);
    const payouts = this.getSellerPayouts(sellerId);
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const availableBalance = totalRevenue - totalPayouts;
    const currentCommissionRate = this.getSellerCommissionRate(sellerId);

    return {
      totalRevenue,
      availableBalance,
      pendingPayout: 0,
      totalPayouts,
      commissionRate: currentCommissionRate * 100,
      transactions: sellerTransactions
    };
  }

  // UPDATED: Request payout with Firebase support
  static async requestPayout(sellerId: string, amount: number): Promise<{ success: boolean; error?: string }> {
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

    // Save to localStorage for now (payouts collection can be added to Firebase later)
    const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
    payouts.push(payout);
    localStorage.setItem('payouts', JSON.stringify(payouts));

    this.updatePayoutRequest(sellerId, amount);

    return { success: true };
  }

  // UPDATED: Update user subscription with Firebase
  static async updateUserSubscription(
    userId: string,
    subscriptionData: any
  ): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      // Try Firebase first
      const { FirebasePaymentManager } = await import('./firebase-payment-utils');
      const firebaseResult = await FirebasePaymentManager.updateUserSubscription(userId, subscriptionData);
      
      if (firebaseResult.success) {
        // Also update localStorage for immediate UI updates
        this.updateLocalStorageSubscription(userId, subscriptionData);
        return firebaseResult;
      }
    } catch (firebaseError) {
      console.warn('Firebase subscription update failed, falling back to localStorage:', firebaseError);
    }

    // Fallback to localStorage
    return this.updateLocalStorageSubscription(userId, subscriptionData);
  }

  // UPDATED: Get user subscription with Firebase first
  static async getUserSubscription(userId: string): Promise<any> {
    try {
      // Try Firebase first
      const { FirebasePaymentManager } = await import('./firebase-payment-utils');
      const firebaseSubscription = await FirebasePaymentManager.getUserSubscription(userId);
      
      if (firebaseSubscription) {
        return firebaseSubscription;
      }
    } catch (firebaseError) {
      console.warn('Firebase subscription fetch failed, falling back to localStorage:', firebaseError);
    }

    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    return user?.subscription || null;
  }

  // Helper method to update subscription in localStorage
  private static updateLocalStorageSubscription(userId: string, subscriptionData: any): { success: boolean; subscription?: any; error?: string } {
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

        return { success: true, subscription: users[userIndex].subscription };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error updating subscription in localStorage:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  // Existing localStorage methods (for backward compatibility)
  private static getTransactions(): PurchaseTransaction[] {
    return JSON.parse(localStorage.getItem('purchaseTransactions') || '[]');
  }

  private static saveTransaction(transaction: PurchaseTransaction) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('purchaseTransactions', JSON.stringify(transactions));
  }

  private static getUserName(userId: string): string {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    return user?.displayName || user?.username || 'Unknown User';
  }

  private static getUserStripeCustomerId(userId: string): string | undefined {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    return user?.stripeCustomerId;
  }

  private static getUserApprovedModelsCount(userId: string): number {
    const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
    return models.filter((model: any) => 
      model.owner === userId && model.status === 'approved'
    ).length;
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

  // Backward compatibility methods - FIXED: Made recordSale async
  static async recordSale(modelId: string, sellerId: string, price: number): Promise<void> {
    // For backward compatibility - use the old direct purchase method
    const result = await this.processDirectPurchase(modelId, 'anonymous_buyer', price);
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

  // Legacy method for direct purchase (without payment)
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

      if (await this.hasUserPurchasedModel(buyerId, modelId)) {
        return { success: false, error: 'You already purchased this model' };
      }

      const commissionRate = this.getSellerCommissionRate(model.owner);
      const platformCommission = price * commissionRate;
      const sellerRevenue = price - platformCommission;

      const transaction: PurchaseTransaction = {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        modelName: model.name,
        buyerId,
        buyerName: this.getUserName(buyerId),
        sellerId: model.owner,
        sellerName: model.ownerName,
        price,
        sellerRevenue,
        platformCommission,
        commissionRate: commissionRate * 100,
        status: 'completed',
        purchasedAt: new Date().toISOString()
      };

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
}