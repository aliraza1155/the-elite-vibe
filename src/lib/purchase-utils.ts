'use client';

export interface Purchase {
  id: string;
  modelId: string;
  modelName: string;
  buyerId: string;
  buyerName: string;
  price: number;
  purchasedAt: string;
  downloadUrl?: string;
}

export class PurchaseManager {
  static getUserPurchases(userId: string): Purchase[] {
    try {
      const transactions = JSON.parse(localStorage.getItem('purchaseTransactions') || '[]');
      const userTransactions = transactions.filter((tx: any) => 
        tx.buyerId === userId && tx.status === 'completed'
      );
      
      return userTransactions.map((tx: any) => ({
        id: tx.id,
        modelId: tx.modelId,
        modelName: tx.modelName,
        buyerId: tx.buyerId,
        buyerName: tx.buyerName,
        price: tx.price,
        purchasedAt: tx.purchasedAt
      }));
    } catch (error) {
      console.error('Error getting user purchases:', error);
      return [];
    }
  }

  static addUserPurchase(userId: string, purchase: Omit<Purchase, 'id'>): Purchase {
    try {
      const { PaymentManager } = require('./payment-utils');
      
      const result = PaymentManager.processModelPurchase(
        purchase.modelId, 
        userId, 
        purchase.price
      );
      
      if (result.success && result.transaction) {
        return {
          id: result.transaction.id,
          modelId: purchase.modelId,
          modelName: purchase.modelName,
          buyerId: userId,
          buyerName: purchase.buyerName,
          price: purchase.price,
          purchasedAt: result.transaction.purchasedAt
        };
      } else {
        throw new Error(result.error || 'Failed to record purchase');
      }
    } catch (error) {
      console.error('Error adding user purchase:', error);
      throw new Error('Failed to record purchase');
    }
  }

  static getUserPurchaseStats(userId: string): {
    totalPurchases: number;
    totalSpent: number;
    uniqueModels: number;
  } {
    const purchases = this.getUserPurchases(userId);
    
    return {
      totalPurchases: purchases.length,
      totalSpent: purchases.reduce((sum, purchase) => sum + purchase.price, 0),
      uniqueModels: new Set(purchases.map(p => p.modelId)).size
    };
  }

  static hasUserPurchasedModel(userId: string, modelId: string): boolean {
    const { PaymentManager } = require('./payment-utils');
    return PaymentManager.hasUserPurchasedModel(userId, modelId);
  }

  static deleteUserPurchase(userId: string, purchaseId: string): boolean {
    try {
      const transactions = JSON.parse(localStorage.getItem('purchaseTransactions') || '[]');
      const updatedTransactions = transactions.filter((tx: any) => tx.id !== purchaseId);
      
      localStorage.setItem('purchaseTransactions', JSON.stringify(updatedTransactions));
      return true;
    } catch (error) {
      console.error('Error deleting user purchase:', error);
      return false;
    }
  }

  static clearUserPurchases(userId: string): boolean {
    try {
      const transactions = JSON.parse(localStorage.getItem('purchaseTransactions') || '[]');
      const updatedTransactions = transactions.filter((tx: any) => tx.buyerId !== userId);
      
      localStorage.setItem('purchaseTransactions', JSON.stringify(updatedTransactions));
      return true;
    } catch (error) {
      console.error('Error clearing user purchases:', error);
      return false;
    }
  }
}