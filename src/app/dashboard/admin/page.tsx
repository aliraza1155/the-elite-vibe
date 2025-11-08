'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import { UserManager } from '@/lib/user-utils';
import { PaymentManager } from '@/lib/payment-utils';

// Utility functions moved to top level
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

interface PlatformStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalModels: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'payout' | 'upload' | 'registration';
  description: string;
  user: string;
  amount?: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalModels: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    pendingPayoutAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'sales' | 'users' | 'models' | 'disputes'>('overview');
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    setCurrentUser(user);
    loadPlatformData();
  }, [router]);

  const loadPlatformData = () => {
    try {
      // Load all data
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      const payouts = JSON.parse(localStorage.getItem('payouts') || '[]');
      const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');

      // Calculate platform stats
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

      setPlatformStats({
        totalUsers,
        totalSellers,
        totalBuyers,
        totalModels,
        totalSales,
        totalRevenue,
        pendingPayouts,
        pendingPayoutAmount
      });

      // Generate recent activity
      const activity: RecentActivity[] = [];

      // Recent sales
      sales.slice(-5).forEach((sale: any) => {
        activity.push({
          id: `sale_${sale.id}`,
          type: 'sale',
          description: `Model sold: ${sale.modelId}`,
          user: sale.sellerId,
          amount: sale.price,
          timestamp: sale.soldAt
        });
      });

      // Recent payouts
      payouts.slice(-5).forEach((payout: any) => {
        activity.push({
          id: `payout_${payout.id}`,
          type: 'payout',
          description: `Payout requested: $${payout.amount}`,
          user: payout.sellerId,
          amount: payout.amount,
          timestamp: payout.requestedAt
        });
      });

      // Recent registrations
      users.slice(-5).forEach((user: any) => {
        activity.push({
          id: `user_${user.id}`,
          type: 'registration',
          description: `New user registered: ${user.username}`,
          user: user.id,
          timestamp: user.createdAt
        });
      });

      // Sort by timestamp and take latest 10
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage platform activities, payouts, and user accounts
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
              <p className="font-semibold text-gray-900 dark:text-white">{currentUser?.username}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {platformStats.totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {platformStats.totalSellers} sellers • {platformStats.totalBuyers} buyers
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {platformStats.totalModels}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Models</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {platformStats.totalSales}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatCurrency(platformStats.totalRevenue)} revenue
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {platformStats.pendingPayouts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Payouts</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatCurrency(platformStats.pendingPayoutAmount)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'payouts', label: 'Payouts', icon: '💰' },
              { id: 'sales', label: 'Sales', icon: '🛒' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'models', label: 'Models', icon: '🤖' },
              { id: 'disputes', label: 'Disputes', icon: '⚖️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab stats={platformStats} recentActivity={recentActivity} />}
            {activeTab === 'payouts' && <PayoutsTab />}
            {activeTab === 'sales' && <SalesTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'models' && <ModelsTab />}
            {activeTab === 'disputes' && <DisputesTab />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Overview Tab Component
const OverviewTab = ({ stats, recentActivity }: { stats: PlatformStats, recentActivity: RecentActivity[] }) => {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="text-2xl mb-2">💰</div>
          <div className="font-semibold text-blue-900 dark:text-blue-100">Process Payouts</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">{stats.pendingPayouts} pending</div>
        </button>
        
        <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold text-green-900 dark:text-green-100">Manage Users</div>
          <div className="text-sm text-green-700 dark:text-green-300">{stats.totalUsers} total users</div>
        </button>
        
        <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-semibold text-purple-900 dark:text-purple-100">View Analytics</div>
          <div className="text-sm text-purple-700 dark:text-purple-300">{stats.totalSales} total sales</div>
        </button>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                  activity.type === 'payout' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'registration' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'sale' ? '🛒' :
                   activity.type === 'payout' ? '💰' :
                   activity.type === 'registration' ? '👤' : '📝'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    User: {activity.user} • {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
              {activity.amount && (
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(activity.amount)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Payouts Tab Component
const PayoutsTab = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = () => {
    try {
      const allPayouts = JSON.parse(localStorage.getItem('payouts') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Enrich payouts with user information
      const enrichedPayouts = allPayouts.map((payout: any) => {
        const user = users.find((u: any) => u.id === payout.sellerId);
        return {
          ...payout,
          sellerName: user?.displayName || user?.username || 'Unknown',
          sellerEmail: user?.email || 'Unknown'
        };
      });
      
      setPayouts(enrichedPayouts);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayout = (payoutId: string) => {
    if (confirm('Mark this payout as processed?')) {
      const updatedPayouts = payouts.map(payout => 
        payout.id === payoutId 
          ? { ...payout, status: 'completed', processedAt: new Date().toISOString() }
          : payout
      );
      
      localStorage.setItem('payouts', JSON.stringify(updatedPayouts));
      
      // Update seller's earnings
      const payout = payouts.find(p => p.id === payoutId);
      if (payout) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === payout.sellerId);
        
        if (userIndex !== -1) {
          users[userIndex].earnings.pending -= payout.amount;
          users[userIndex].earnings.paidOut += payout.amount;
          users[userIndex].updatedAt = new Date().toISOString();
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      
      loadPayouts();
      alert('Payout marked as processed!');
    }
  };

  const rejectPayout = (payoutId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      const updatedPayouts = payouts.map(payout => 
        payout.id === payoutId 
          ? { ...payout, status: 'failed', processedAt: new Date().toISOString(), rejectionReason: reason }
          : payout
      );
      
      localStorage.setItem('payouts', JSON.stringify(updatedPayouts));
      
      // Return amount to seller's available earnings
      const payout = payouts.find(p => p.id === payoutId);
      if (payout) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === payout.sellerId);
        
        if (userIndex !== -1) {
          users[userIndex].earnings.pending -= payout.amount;
          users[userIndex].earnings.available += payout.amount;
          users[userIndex].updatedAt = new Date().toISOString();
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      
      loadPayouts();
      alert('Payout rejected!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading payouts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payout Management</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {payouts.filter(p => p.status === 'pending').length} pending payouts
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Seller</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requested</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{payout.sellerName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{payout.sellerEmail}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(payout.amount)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(payout.requestedAt)}
                </td>
                <td className="px-4 py-3">
                  {payout.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => processPayout(payout.id)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPayout(payout.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {payout.status === 'completed' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Processed: {formatDate(payout.processedAt)}
                    </div>
                  )}
                  {payout.status === 'failed' && (
                    <div className="text-sm text-red-500 dark:text-red-400">
                      Rejected: {payout.rejectionReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payouts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No payout requests found.
        </div>
      )}
    </div>
  );
};

// Sales Tab Component
const SalesTab = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    try {
      const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const models = JSON.parse(localStorage.getItem('aiModels') || '[]');
      
      // Enrich sales with user and model information
      const enrichedSales = allSales.map((sale: any) => {
        const seller = users.find((u: any) => u.id === sale.sellerId);
        const model = models.find((m: any) => m.id === sale.modelId);
        
        return {
          ...sale,
          sellerName: seller?.displayName || seller?.username || 'Unknown',
          modelName: model?.name || 'Unknown Model'
        };
      });
      
      setSales(enrichedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading sales data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales History</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {sales.length} sales
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(sales.reduce((sum: number, sale: any) => sum + sale.price, 0))}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Sales Volume</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(sales.reduce((sum: number, sale: any) => sum + sale.platformFee, 0))}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Platform Revenue</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(sales.reduce((sum: number, sale: any) => sum + sale.earnings, 0))}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Seller Earnings</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Seller</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sale Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Platform Fee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Seller Earnings</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{sale.modelName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-white">{sale.sellerName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(sale.price)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-red-600 dark:text-red-400">
                    {formatCurrency(sale.platformFee)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-green-600 dark:text-green-400">
                    {formatCurrency(sale.earnings)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(sale.soldAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No sales data found.
        </div>
      )}
    </div>
  );
};

// Users Tab Component
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = (userId: string) => {
    if (confirm('Suspend this user account?')) {
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, status: 'suspended', updatedAt: new Date().toISOString() }
          : user
      );
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      alert('User account suspended!');
    }
  };

  const activateUser = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, status: 'active', updatedAt: new Date().toISOString() }
        : user
    );
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    alert('User account activated!');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'seller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'both': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} total users
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">@{user.username}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'suspended' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {user.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {user.status !== 'suspended' ? (
                    <button
                      onClick={() => suspendUser(user.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => activateUser(user.id)}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Models Tab Component
const ModelsTab = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    try {
      const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Enrich models with seller information
      const enrichedModels = allModels.map((model: any) => {
        const seller = users.find((u: any) => u.id === model.owner);
        return {
          ...model,
          sellerName: seller?.displayName || seller?.username || 'Unknown'
        };
      });
      
      setModels(enrichedModels);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveModel = (modelId: string) => {
    const updatedModels = models.map(model => 
      model.id === modelId 
        ? { ...model, status: 'approved', updatedAt: new Date().toISOString() }
        : model
    );
    
    localStorage.setItem('aiModels', JSON.stringify(updatedModels));
    setModels(updatedModels);
    alert('Model approved!');
  };

  const rejectModel = (modelId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      const updatedModels = models.map(model => 
        model.id === modelId 
          ? { ...model, status: 'rejected', rejectionReason: reason, updatedAt: new Date().toISOString() }
          : model
      );
      
      localStorage.setItem('aiModels', JSON.stringify(updatedModels));
      setModels(updatedModels);
      alert('Model rejected!');
    }
  };

  const deleteModel = (modelId: string) => {
    if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      const updatedModels = models.filter(model => model.id !== modelId);
      localStorage.setItem('aiModels', JSON.stringify(updatedModels));
      setModels(updatedModels);
      alert('Model deleted!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading models...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Management</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {models.length} total models • {models.filter(m => m.status === 'pending').length} pending review
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {models.length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Models</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {models.filter(m => m.status === 'approved').length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Approved</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {models.filter(m => m.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {models.filter(m => m.status === 'rejected').length}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Rejected</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Seller</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{model.niche}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Views: {model.stats?.views || 0} • Downloads: {model.stats?.downloads || 0}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-white">{model.sellerName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(model.price)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(model.status)}`}>
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(model.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    {model.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveModel(model.id)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectModel(model.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteModel(model.id)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  {model.rejectionReason && (
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Reason: {model.rejectionReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {models.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No models found.
        </div>
      )}
    </div>
  );
};

// Disputes Tab Component
const DisputesTab = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = () => {
    try {
      // In a real app, this would come from your database
      // For now, we'll create some mock dispute data
      const mockDisputes = [
        {
          id: 'dispute_1',
          type: 'refund',
          userId: 'user_123',
          userName: 'John Buyer',
          modelId: 'model_456',
          modelName: 'AI Art Generator Pro',
          description: 'Model does not work as described in the listing',
          status: 'open',
          amount: 75,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          evidence: ['screenshot1.jpg', 'screenshot2.jpg']
        },
        {
          id: 'dispute_2',
          type: 'quality',
          userId: 'user_456',
          userName: 'Sarah Designer',
          modelId: 'model_789',
          modelName: '3D Character Creator',
          description: 'Poor quality output, not matching the examples',
          status: 'in_review',
          amount: 120,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          evidence: ['output1.jpg', 'comparison.jpg']
        }
      ];
      
      setDisputes(mockDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDisputeStatus = (disputeId: string, newStatus: string, resolution?: string) => {
    const updatedDisputes = disputes.map(dispute => 
      dispute.id === disputeId 
        ? { 
            ...dispute, 
            status: newStatus, 
            resolvedAt: new Date().toISOString(),
            resolution: resolution || dispute.resolution
          }
        : dispute
    );
    
    setDisputes(updatedDisputes);
    
    // In a real app, save to database
    localStorage.setItem('disputes', JSON.stringify(updatedDisputes));
    
    alert(`Dispute ${newStatus === 'resolved' ? 'resolved' : 'updated'}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading disputes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dispute Resolution</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {disputes.filter(d => d.status === 'open').length} open disputes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {disputes.filter(d => d.status === 'open').length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Open</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {disputes.filter(d => d.status === 'in_review').length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">In Review</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {disputes.filter(d => d.status === 'resolved').length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Resolved</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {disputes.filter(d => d.status === 'rejected').length}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Rejected</div>
        </div>
      </div>

      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {dispute.modelName}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Filed by {dispute.userName} • {formatCurrency(dispute.amount)}
                </p>
                <span className={`inline-flex mt-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                  {dispute.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(dispute.createdAt)}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {dispute.type.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">{dispute.description}</p>
            </div>

            {dispute.evidence && dispute.evidence.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Evidence:</p>
                <div className="flex space-x-2">
                  {dispute.evidence.map((file: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      📎 {file}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dispute.resolution && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Resolution:</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{dispute.resolution}</p>
              </div>
            )}

            <div className="flex space-x-3">
              {dispute.status === 'open' && (
                <>
                  <button
                    onClick={() => updateDisputeStatus(dispute.id, 'in_review')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Start Review
                  </button>
                  <button
                    onClick={() => {
                      const resolution = prompt('Enter resolution notes:');
                      if (resolution) {
                        updateDisputeStatus(dispute.id, 'resolved', resolution);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateDisputeStatus(dispute.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Reject
                  </button>
                </>
              )}
              
              {dispute.status === 'in_review' && (
                <>
                  <button
                    onClick={() => {
                      const resolution = prompt('Enter resolution notes:');
                      if (resolution) {
                        updateDisputeStatus(dispute.id, 'resolved', resolution);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateDisputeStatus(dispute.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Reject
                  </button>
                </>
              )}

              {(dispute.status === 'resolved' || dispute.status === 'rejected') && (
                <button
                  onClick={() => updateDisputeStatus(dispute.id, 'open')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {disputes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No disputes found.
        </div>
      )}
    </div>
  );
};