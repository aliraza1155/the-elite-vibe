// lib/firebase-database.ts
'use client';

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  writeBatch,
  DocumentData,
  Firestore
} from 'firebase/firestore';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  TRANSACTIONS: 'transactions',
  PAYOUTS: 'payouts',
  PAYMENT_SESSIONS: 'payment_sessions'
} as const;

// Subscription interface matching your existing structure
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
  createdAt: string;
  updatedAt: string;
}

// Transaction interface
export interface FirebaseTransaction {
  id: string;
  sessionId?: string;
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
  type: 'subscription' | 'model_purchase';
  stripePaymentIntentId?: string;
  createdAt: string;
}

// Payout interface
export interface FirebasePayout {
  id: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt: string | null;
  stripePayoutId?: string;
  createdAt: string;
}

// Helper function to ensure db is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore is not initialized. Make sure Firebase is properly configured.');
  }
  return db;
};

export class FirebaseDatabase {
  // Subscription methods
  static async createSubscription(subscription: Omit<FirebaseSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const dbInstance = getDb();
      const subscriptionData: Omit<FirebaseSubscription, 'id'> = {
        ...subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(dbInstance, COLLECTIONS.SUBSCRIPTIONS), subscriptionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  static async getUserSubscription(userId: string): Promise<FirebaseSubscription | null> {
    try {
      const dbInstance = getDb();
      const q = query(
        collection(dbInstance, COLLECTIONS.SUBSCRIPTIONS),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FirebaseSubscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw new Error('Failed to get user subscription');
    }
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<FirebaseSubscription>): Promise<void> {
    try {
      const dbInstance = getDb();
      const docRef = doc(dbInstance, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const dbInstance = getDb();
      const docRef = doc(dbInstance, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      await updateDoc(docRef, {
        status: 'canceled',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Transaction methods
  static async createTransaction(transaction: Omit<FirebaseTransaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const dbInstance = getDb();
      const transactionData: Omit<FirebaseTransaction, 'id'> = {
        ...transaction,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(dbInstance, COLLECTIONS.TRANSACTIONS), transactionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  static async getUserTransactions(userId: string, type?: 'buyer' | 'seller'): Promise<FirebaseTransaction[]> {
    try {
      const dbInstance = getDb();
      let q;
      
      if (type === 'buyer') {
        q = query(
          collection(dbInstance, COLLECTIONS.TRANSACTIONS),
          where('buyerId', '==', userId),
          orderBy('purchasedAt', 'desc')
        );
      } else if (type === 'seller') {
        q = query(
          collection(dbInstance, COLLECTIONS.TRANSACTIONS),
          where('sellerId', '==', userId),
          orderBy('purchasedAt', 'desc')
        );
      } else {
        q = query(
          collection(dbInstance, COLLECTIONS.TRANSACTIONS),
          where('buyerId', '==', userId),
          orderBy('purchasedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebaseTransaction));
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw new Error('Failed to get user transactions');
    }
  }

  static async getTransactionBySessionId(sessionId: string): Promise<FirebaseTransaction | null> {
    try {
      const dbInstance = getDb();
      const q = query(
        collection(dbInstance, COLLECTIONS.TRANSACTIONS),
        where('sessionId', '==', sessionId)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FirebaseTransaction;
    } catch (error) {
      console.error('Error getting transaction by session ID:', error);
      throw new Error('Failed to get transaction');
    }
  }

  // Payout methods
  static async createPayout(payout: Omit<FirebasePayout, 'id' | 'createdAt'>): Promise<string> {
    try {
      const dbInstance = getDb();
      const payoutData: Omit<FirebasePayout, 'id'> = {
        ...payout,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(dbInstance, COLLECTIONS.PAYOUTS), payoutData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw new Error('Failed to create payout');
    }
  }

  static async getUserPayouts(userId: string): Promise<FirebasePayout[]> {
    try {
      const dbInstance = getDb();
      const q = query(
        collection(dbInstance, COLLECTIONS.PAYOUTS),
        where('sellerId', '==', userId),
        orderBy('requestedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebasePayout));
    } catch (error) {
      console.error('Error getting user payouts:', error);
      throw new Error('Failed to get user payouts');
    }
  }

  // User earnings calculation
  static async getUserEarnings(userId: string): Promise<{
    totalRevenue: number;
    availableBalance: number;
    pendingPayout: number;
    totalPayouts: number;
    commissionRate: number;
  }> {
    try {
      // Get all completed transactions for this seller
      const transactions = await this.getUserTransactions(userId, 'seller');
      const completedTransactions = transactions.filter(tx => tx.status === 'completed');
      
      // Get all payouts
      const payouts = await this.getUserPayouts(userId);
      const completedPayouts = payouts.filter(p => p.status === 'completed');
      
      const totalRevenue = completedTransactions.reduce((sum, tx) => sum + tx.sellerRevenue, 0);
      const totalPayouts = completedPayouts.reduce((sum, payout) => sum + payout.amount, 0);
      const pendingPayout = payouts
        .filter(p => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, payout) => sum + payout.amount, 0);
      
      const availableBalance = totalRevenue - totalPayouts - pendingPayout;
      
      // Get current commission rate from subscription
      const subscription = await this.getUserSubscription(userId);
      const commissionRate = subscription ? (100 - (subscription.features.revenueShare || 0)) / 100 : 0.20;

      return {
        totalRevenue,
        availableBalance,
        pendingPayout,
        totalPayouts,
        commissionRate: commissionRate * 100
      };
    } catch (error) {
      console.error('Error calculating user earnings:', error);
      throw new Error('Failed to calculate earnings');
    }
  }

  // Check if user has purchased a model
  static async hasUserPurchasedModel(userId: string, modelId: string): Promise<boolean> {
    try {
      const dbInstance = getDb();
      const q = query(
        collection(dbInstance, COLLECTIONS.TRANSACTIONS),
        where('buyerId', '==', userId),
        where('modelId', '==', modelId),
        where('status', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if user purchased model:', error);
      throw new Error('Failed to check purchase status');
    }
  }

  // Update user data in Firestore
  static async updateUserData(userId: string, userData: any): Promise<void> {
    try {
      const dbInstance = getDb();
      const userRef = doc(dbInstance, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw new Error('Failed to update user data');
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<any> {
    try {
      const dbInstance = getDb();
      const userDoc = await getDoc(doc(dbInstance, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to get user');
    }
  }

  // Create user in Firestore
  static async createUser(userData: any): Promise<string> {
    try {
      const dbInstance = getDb();
      const userDoc = await addDoc(collection(dbInstance, COLLECTIONS.USERS), {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return userDoc.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Check if Firebase is available
  static isFirebaseAvailable(): boolean {
    try {
      getDb();
      return true;
    } catch (error) {
      return false;
    }
  }
}