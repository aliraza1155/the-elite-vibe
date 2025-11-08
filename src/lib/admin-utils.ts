'use client';

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalModels: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
  activeDisputes: number;
}

export class AdminManager {
  static getPlatformStats(): AdminStats {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
      const disputes = JSON.parse(localStorage.getItem('disputes') || '[]');

      const totalUsers = users.length;
      const totalSellers = users.filter((u: any) => u.role === 'seller' || u.role === 'both').length;
      const totalBuyers = users.filter((u: any) => u.role === 'buyer').length;
      const totalModels = models.length;
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.platformFee, 0);
      const pendingPayouts = payouts.filter((p: any) => p.status === 'pending').length;
      const pendingPayoutAmount = payouts
        .filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
      const activeDisputes = disputes.filter((d: any) => d.status === 'open' || d.status === 'in_review').length;

      return {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalModels,
        totalSales,
        totalRevenue,
        pendingPayouts,
        pendingPayoutAmount,
        activeDisputes
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return {
        totalUsers: 0,
        totalSellers: 0,
        totalBuyers: 0,
        totalModels: 0,
        totalSales: 0,
        totalRevenue: 0,
        pendingPayouts: 0,
        pendingPayoutAmount: 0,
        activeDisputes: 0
      };
    }
  }

  static getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static getAllModels() {
    try {
      return JSON.parse(localStorage.getItem('aiModels') || '[]');
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
    }
  }

  static getAllSales() {
    try {
      return JSON.parse(localStorage.getItem('sales') || '[]');
    } catch (error) {
      console.error('Error getting sales:', error);
      return [];
    }
  }

  static getAllPayouts() {
    try {
      return JSON.parse(localStorage.getItem('payouts') || '[]');
    } catch (error) {
      console.error('Error getting payouts:', error);
      return [];
    }
  }

  static updateUserStatus(userId: string, status: 'active' | 'suspended'): boolean {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) return false;
      
      users[userIndex].status = status;
      users[userIndex].updatedAt = new Date().toISOString();
      
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  static updateModelStatus(modelId: string, status: 'pending' | 'approved' | 'rejected', reason?: string): boolean {
    try {
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const modelIndex = models.findIndex((m: any) => m.id === modelId);
      
      if (modelIndex === -1) return false;
      
      models[modelIndex].status = status;
      models[modelIndex].updatedAt = new Date().toISOString();
      
      if (reason) {
        models[modelIndex].rejectionReason = reason;
      }
      
      localStorage.setItem('aiModels', JSON.stringify(models));
      return true;
    } catch (error) {
      console.error('Error updating model status:', error);
      return false;
    }
  }

  static processPayout(payoutId: string): boolean {
    try {
      const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
      const payoutIndex = payouts.findIndex((p: any) => p.id === payoutId);
      
      if (payoutIndex === -1) return false;
      
      payouts[payoutIndex].status = 'completed';
      payouts[payoutIndex].processedAt = new Date().toISOString();
      
      localStorage.setItem('payouts', JSON.stringify(payouts));
      return true;
    } catch (error) {
      console.error('Error processing payout:', error);
      return false;
    }
  }

  static rejectPayout(payoutId: string, reason: string): boolean {
    try {
      const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
      const payoutIndex = payouts.findIndex((p: any) => p.id === payoutId);
      
      if (payoutIndex === -1) return false;
      
      payouts[payoutIndex].status = 'failed';
      payouts[payoutIndex].processedAt = new Date().toISOString();
      payouts[payoutIndex].rejectionReason = reason;
      
      localStorage.setItem('payouts', JSON.stringify(payouts));
      return true;
    } catch (error) {
      console.error('Error rejecting payout:', error);
      return false;
    }
  }

  static getRevenueAnalytics(timeframe: 'day' | 'week' | 'month' | 'year') {
    try {
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const filteredSales = sales.filter((sale: any) => 
        new Date(sale.soldAt) >= startDate
      );

      const totalRevenue = filteredSales.reduce((sum: number, sale: any) => sum + sale.platformFee, 0);
      const totalSales = filteredSales.length;
      const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

      return {
        totalRevenue,
        totalSales,
        averageSale,
        timeframe
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return {
        totalRevenue: 0,
        totalSales: 0,
        averageSale: 0,
        timeframe
      };
    }
  }
}