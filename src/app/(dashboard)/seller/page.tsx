'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import Link from 'next/link';
import { PaymentManager } from '@/lib/payment-utils';
import { SubscriptionManager } from '@/lib/subscription-utils';
import { AuthGuard } from '@/components/auth-guard';
import { firestore } from '@/lib/firebase';
import { where } from 'firebase/firestore';

interface AIModel {
  id: string;
  name: string;
  niche: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  owner: string;
  ownerName: string;
  media: {
    sfwImages: string[];
    nsfwImages: string[];
    sfwVideos: string[];
    nsfwVideos: string[];
  };
  stats: {
    views: number;
    likes: number;
    downloads: number;
    rating: number;
  };
  createdAt: string;
}

interface Sale {
  id: string;
  modelId: string;
  modelName: string;
  buyerId: string;
  buyerName: string;
  price: number;
  soldAt: string;
  revenue: number;
  commissionRate: number;
}

interface EarningsSummary {
  totalRevenue: number;
  totalSales: number;
  monthlyRevenue: number;
  averageSalePrice: number;
  topSellingModel: string;
  conversionRate: number;
}

interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  subscriptionTier: string;
  canListModels: boolean;
  maxModels: number;
  currentModels: number;
  reason?: string;
}

export default function SellerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userModels, setUserModels] = useState<AIModel[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [earnings, setEarnings] = useState({
    total: 0,
    available: 0,
    pending: 0,
    paidOut: 0
  });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    totalRevenue: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    averageSalePrice: 0,
    topSellingModel: 'None',
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'models' | 'sales' | 'analytics'>('models');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [approvingModelId, setApprovingModelId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'seller' && user.role !== 'both') {
      router.push('/buyer');
      return;
    }

    setCurrentUser(user);
    checkSubscriptionStatus(user);
    loadSellerData(user.id);
  }, [router]);

  const checkSubscriptionStatus = (user: any) => {
    try {
      const subscriptionCheck = SubscriptionManager.canUserListModels(user);
      setSubscriptionStatus({
        hasActiveSubscription: SubscriptionManager.hasActiveSubscription(user),
        subscriptionTier: subscriptionCheck.subscriptionTier || 'Free',
        canListModels: subscriptionCheck.canList,
        maxModels: subscriptionCheck.maxModels || 0,
        currentModels: subscriptionCheck.currentModels || 0,
        reason: subscriptionCheck.reason
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscriptionTier: 'Free',
        canListModels: false,
        maxModels: 0,
        currentModels: 0,
        reason: 'Error checking subscription status'
      });
    }
  };

  const loadSellerData = async (userId: string) => {
    try {
      console.log('🔄 Loading seller data from Firestore...');
      
      // Load user models from Firestore with proper query
      const userModels = await firestore.query('aiModels', [
        where('owner', '==', userId)
      ]);
      
      console.log('✅ Loaded user models from Firestore:', userModels.length);
      
      // Convert to AIModel type
      const formattedModels: AIModel[] = userModels.map((model: any) => ({
        id: model.id,
        name: model.name || '',
        niche: model.niche || '',
        description: model.description || '',
        status: model.status || 'pending',
        price: model.price || 0,
        owner: model.owner || '',
        ownerName: model.ownerName || '',
        media: model.media || {
          sfwImages: [],
          nsfwImages: [],
          sfwVideos: [],
          nsfwVideos: []
        },
        stats: model.stats || {
          views: 0,
          likes: 0,
          downloads: 0,
          rating: 0
        },
        createdAt: model.createdAt || new Date().toISOString()
      }));
      
      setUserModels(formattedModels);

      // Load earnings data
      const earnings = PaymentManager.getSellerEarnings(userId);
      setEarnings({
        total: earnings.totalRevenue,
        available: earnings.availableBalance,
        pending: earnings.pendingPayout,
        paidOut: earnings.totalPayouts
      });

      // Load sales data
      const salesData = earnings.transactions.map(transaction => ({
        id: transaction.id,
        modelId: transaction.modelId,
        modelName: transaction.modelName,
        buyerId: transaction.buyerId,
        buyerName: transaction.buyerName,
        price: transaction.price,
        soldAt: transaction.purchasedAt,
        revenue: transaction.sellerRevenue,
        commissionRate: transaction.commissionRate
      }));

      setSales(salesData);
      calculateEarnings(formattedModels, salesData);
    } catch (error) {
      console.error('❌ Error loading seller data from Firestore:', error);
      alert('Error loading your data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (models: AIModel[], salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalSales = salesData.length;
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = salesData
      .filter(sale => new Date(sale.soldAt) >= thirtyDaysAgo)
      .reduce((sum, sale) => sum + sale.revenue, 0);

    const modelSales: { [key: string]: number } = {};
    salesData.forEach(sale => {
      modelSales[sale.modelName] = (modelSales[sale.modelName] || 0) + 1;
    });
    const topSellingModel = Object.keys(modelSales).length > 0 
      ? Object.keys(modelSales).reduce((a, b) => modelSales[a] > modelSales[b] ? a : b)
      : 'None';

    const totalViews = models.reduce((sum, model) => sum + model.stats.views, 0);
    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

    setEarningsSummary({
      totalRevenue,
      totalSales,
      monthlyRevenue,
      averageSalePrice,
      topSellingModel,
      conversionRate
    });
  };

  const switchToBuyer = () => {
    router.push('/buyer');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'rejected':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const handleApproveModel = async (modelId: string) => {
    if (!currentUser) {
      alert('❌ No user found. Please log in again.');
      return;
    }

    console.log('🔄 Starting model approval process for:', modelId);
    console.log('👤 Current user:', currentUser.id);
    
    setApprovingModelId(modelId);

    try {
      // First check if model exists in Firestore
      console.log('🔍 Checking if model exists in Firestore...');
      const model = await firestore.get('aiModels', modelId);
      
      if (!model) {
        throw new Error('Model not found in database. It may have been deleted.');
      }

      console.log('✅ Model found:', model.name);

      // Check subscription status
      const approvalCheck = PaymentManager.canUserApproveModel(currentUser, modelId);
      console.log('📋 Approval check result:', approvalCheck);
      
      if (!approvalCheck.canApprove) {
        const userConfirmed = window.confirm(
          `${approvalCheck.reason}\n\nClick OK to view our pricing plans and subscribe.`
        );
        
        if (userConfirmed) {
          router.push('/pricing');
        }
        setApprovingModelId(null);
        return;
      }

      console.log('✅ Subscription check passed, proceeding with approval...');

      // ✅ Update in Firestore
      console.log('🔥 Updating model status to approved in Firestore...');
      await firestore.update('aiModels', modelId, { 
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Model approved in Firestore');

      // ✅ Update UI state
      setUserModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'approved' } : m
      ));
      
      // ✅ Refresh subscription status
      checkSubscriptionStatus(currentUser);
      
      console.log('🎉 Model approval completed successfully!');
      alert('✅ Model approved and listed in marketplace successfully!');
      
    } catch (error: any) {
      console.error('❌ Error approving model:', error);
      
      // Provide specific error messages
      let errorMessage = 'Error approving model. Please try again.';
      
      if (error.message?.includes('No document to update') || error.message?.includes('Model not found')) {
        errorMessage = 'Model not found in database. It may have been deleted. Please refresh the page.';
        // Refresh the data to remove the missing model
        loadSellerData(currentUser.id);
      } else if (error.message?.includes('permission') || error.message?.includes('not authorized')) {
        errorMessage = 'You do not have permission to approve this model. Please check your subscription status.';
      } else if (error.message?.includes('network') || error.message?.includes('offline')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setApprovingModelId(null);
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      return;
    }

    try {
      // First check if model exists
      const model = await firestore.get('aiModels', modelId);
      if (!model) {
        alert('Model not found. It may have already been deleted.');
        // Refresh data to remove the missing model
        loadSellerData(currentUser.id);
        return;
      }

      // ✅ Delete from Firestore
      await firestore.delete('aiModels', modelId);
      console.log('✅ Model deleted from Firestore');
      
      // Refresh data to get updated list
      loadSellerData(currentUser.id);
      
      alert('✅ Model deleted successfully!');
    } catch (error: any) {
      console.error('❌ Error deleting model:', error);
      
      let errorMessage = 'Error deleting model. Please try again.';
      if (error.message?.includes('No document to delete') || error.message?.includes('not found')) {
        errorMessage = 'Model not found. It may have already been deleted.';
        loadSellerData(currentUser.id);
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  const getNicheColor = (niche: string) => {
    const colors: { [key: string]: string } = {
      art: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
      photography: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      writing: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      coding: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      music: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      video: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      '3d': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      animation: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      business: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      other: 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
    };
    return colors[niche] || colors.other;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePayoutRequest = async () => {
    if (!payoutAmount || !currentUser) return;
    
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setPayoutLoading(true);
    
    try {
      const result = PaymentManager.requestPayout(currentUser.id, amount);
      
      if (result.success) {
        alert('Payout request submitted successfully!');
        setPayoutAmount('');
        const earnings = PaymentManager.getSellerEarnings(currentUser.id);
        setEarnings({
          total: earnings.totalRevenue,
          available: earnings.availableBalance,
          pending: earnings.pendingPayout,
          paidOut: earnings.totalPayouts
        });
      } else {
        alert(`Payout request failed: ${result.error}`);
      }
    } catch (error) {
      alert('Payout request failed. Please try again.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleUpgradeSubscription = () => {
    router.push('/pricing');
  };

  const refreshSubscriptionStatus = () => {
    if (currentUser) {
      checkSubscriptionStatus(currentUser);
      alert('Subscription status refreshed!');
    }
  };

  if (!isClient || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const approvedModels = userModels.filter(m => m.status === 'approved');
  const pendingModels = userModels.filter(m => m.status === 'pending');
  const totalListingsValue = userModels.reduce((sum, model) => sum + model.price, 0);

  return (
    <AuthGuard requireAuth requireSeller>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          {subscriptionStatus && !subscriptionStatus.canListModels && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-300 mb-2">
                    {subscriptionStatus.hasActiveSubscription ? 'Subscription Sync Issue' : 'Subscription Required'}
                  </h3>
                  <p className="text-amber-200">
                    {subscriptionStatus.reason}
                  </p>
                  {subscriptionStatus.hasActiveSubscription && (
                    <p className="text-amber-300 text-sm mt-2">
                      It looks like you have a subscription but it's not properly synced. 
                      Try refreshing the page or click the refresh button.
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {subscriptionStatus.hasActiveSubscription && (
                    <button
                      onClick={refreshSubscriptionStatus}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25 whitespace-nowrap text-sm"
                    >
                      Refresh Status
                    </button>
                  )}
                  <button
                    onClick={handleUpgradeSubscription}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium shadow-lg shadow-amber-500/25 whitespace-nowrap"
                  >
                    {subscriptionStatus.hasActiveSubscription ? 'Manage Plan' : 'Upgrade Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                  Creator Dashboard
                </h1>
                <p className="mt-2 text-slate-300">
                  Welcome back, {currentUser.displayName}! Manage your AI models and track your earnings.
                  {currentUser.role === 'both' && (
                    <span className="text-cyan-400 font-medium">
                      {' '}(You also have buyer access)
                    </span>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { label: 'Total Models', value: userModels.length, color: 'blue' },
                    { label: 'Total Sales', value: earningsSummary.totalSales, color: 'emerald' },
                    { label: 'Total Earnings', value: formatCurrency(earnings.total), color: 'purple' },
                    { label: 'Active Listings', value: approvedModels.length, color: 'amber' }
                  ].map((stat, index) => (
                    <div key={index} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 px-3 py-2 rounded-xl backdrop-blur-sm`}>
                      <span className={`font-semibold text-${stat.color}-300`}>
                        {stat.value}
                      </span>
                      <span className={`text-${stat.color}-400 ml-2 text-sm`}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
                {currentUser.role === 'both' && (
                  <button
                    onClick={switchToBuyer}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
                  >
                    Switch to Buyer
                  </button>
                )}
                <Link href="/upload">
                  <PrimaryButton 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                  >
                    Upload New Model
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {[
              { 
                name: 'Total Earnings', 
                value: formatCurrency(earnings.total), 
                change: `+${earningsSummary.totalSales} sales`, 
                changeType: earningsSummary.totalSales > 0 ? 'positive' : 'neutral',
                icon: '💰',
                gradient: 'from-emerald-500 to-green-500'
              },
              { 
                name: 'Monthly Revenue', 
                value: formatCurrency(earningsSummary.monthlyRevenue), 
                change: 'Last 30 days', 
                changeType: earningsSummary.monthlyRevenue > 0 ? 'positive' : 'neutral',
                icon: '📈',
                gradient: 'from-blue-500 to-cyan-500'
              },
              { 
                name: 'Total Sales', 
                value: earningsSummary.totalSales.toString(), 
                change: `${earningsSummary.conversionRate.toFixed(1)}% conversion`, 
                changeType: earningsSummary.totalSales > 0 ? 'positive' : 'neutral',
                icon: '🛒',
                gradient: 'from-purple-500 to-pink-500'
              },
              { 
                name: 'Avg. Sale Price', 
                value: formatCurrency(earningsSummary.averageSalePrice), 
                change: earningsSummary.topSellingModel, 
                changeType: 'neutral',
                icon: '⭐',
                gradient: 'from-amber-500 to-orange-500'
              },
            ].map((stat, index) => (
              <div key={stat.name} className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-2xl bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.icon}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                    stat.changeType === 'positive' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : stat.changeType === 'negative'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-6">
              Earnings & Payouts
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {[
                { label: 'Total Earnings', value: earnings.total, color: 'emerald' },
                { label: 'Available', value: earnings.available, color: 'blue' },
                { label: 'Pending', value: earnings.pending, color: 'amber' },
                { label: 'Paid Out', value: earnings.paidOut, color: 'purple' }
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className={`text-2xl font-bold text-${item.color}-400`}>
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            
            {earnings.available >= 50 && (
              <div className="border-t border-slate-700/50 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Request Payout
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount (Minimum: $50)
                    </label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      min="50"
                      max={earnings.available}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter amount"
                    />
                  </div>
                  
                  <button
                    onClick={handlePayoutRequest}
                    disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) < 50}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25 disabled:shadow-none"
                  >
                    {payoutLoading ? 'Processing...' : 'Request Payout'}
                  </button>
                </div>
                
                <p className="text-sm text-slate-400 mt-3">
                  Available for payout: <span className="text-emerald-400 font-medium">{formatCurrency(earnings.available)}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
            <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-slate-700/50 pb-4 mb-6">
              {[
                { id: 'models', label: `My Models (${userModels.length})` },
                { id: 'sales', label: `Sales History (${sales.length})` },
                { id: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'models' && (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                    Your AI Models
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm">
                      {userModels.length} model{userModels.length !== 1 ? 's' : ''}
                    </span>
                    {subscriptionStatus && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subscriptionStatus.canListModels 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {subscriptionStatus.subscriptionTier.toUpperCase()} Plan
                      </div>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Loading your models...</p>
                  </div>
                ) : userModels.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Models Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Start by uploading your first AI model to the marketplace.
                    </p>
                    <Link href="/upload">
                      <PrimaryButton 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Upload Your First Model
                      </PrimaryButton>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userModels.map((model) => (
                      <div
                        key={model.id}
                        className="bg-slate-700/30 border border-slate-600/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 backdrop-blur-sm"
                      >
                        <div className="aspect-video bg-slate-600/50 relative">
                          {model.media.sfwImages.length > 0 ? (
                            <img
                              src={model.media.sfwImages[0]}
                              alt={model.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">🤖</span>
                            </div>
                          )}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)} backdrop-blur-sm`}>
                            {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-white truncate text-lg">
                            {model.name}
                          </h3>
                          <p className="text-slate-300 text-sm mt-1 line-clamp-2">
                            {model.description}
                          </p>
                          <div className="flex items-center justify-between mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNicheColor(model.niche)}`}>
                              {model.niche}
                            </span>
                            <span className="text-sm font-semibold text-cyan-400">
                              ${model.price}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                            <span>👁️ {model.stats.views}</span>
                            <span>❤️ {model.stats.likes}</span>
                            <span>📥 {model.stats.downloads}</span>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            {model.status === 'pending' && (
                              <button
                                onClick={() => handleApproveModel(model.id)}
                                disabled={!subscriptionStatus?.canListModels || approvingModelId === model.id}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                  subscriptionStatus?.canListModels
                                    ? approvingModelId === model.id
                                      ? 'bg-amber-500/50 text-amber-200 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25'
                                    : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {approvingModelId === model.id ? (
                                  <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Approving...
                                  </span>
                                ) : subscriptionStatus?.canListModels ? (
                                  'Approve'
                                ) : (
                                  'Need Subscription'
                                )}
                              </button>
                            )}
                            
                            {model.status === 'approved' && (
                              <div className="flex-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-2 rounded-xl text-sm font-medium text-center backdrop-blur-sm">
                                ✅ Listed
                              </div>
                            )}

                            <button
                              onClick={() => deleteModel(model.id)}
                              className="px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2 rounded-xl text-sm font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-rose-500/25"
                            >
                              Delete
                            </button>
                          </div>
                          
                          {model.status === 'pending' && !subscriptionStatus?.canListModels && (
                            <div className="mt-3 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-300 text-xs text-center">
                                Subscribe to a plan to list this model
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                    Sales History
                  </h2>
                  <span className="text-slate-400 text-sm">
                    {sales.length} sale{sales.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Sales Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Your sales will appear here once customers purchase your models.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-600/50">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          {['Model', 'Buyer', 'Sale Price', 'Your Earnings', 'Commission', 'Date'].map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/50">
                        {sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {sale.modelName}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-300">
                                {sale.buyerName}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-300">
                                {formatCurrency(sale.price)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-emerald-400">
                                {formatCurrency(sale.revenue)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-amber-400">
                                {sale.commissionRate}%
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-400">
                                {new Date(sale.soldAt).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="pt-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-6">
                  Performance Analytics
                </h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Model Performance
                    </h3>
                    <div className="space-y-4">
                      {userModels.map((model) => {
                        const modelSales = sales.filter(sale => sale.modelId === model.id);
                        const revenue = modelSales.reduce((sum, sale) => sum + sale.revenue, 0);
                        
                        return (
                          <div key={model.id} className="flex items-center justify-between p-4 bg-slate-600/30 rounded-xl border border-slate-500/30">
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {model.name}
                              </div>
                              <div className="text-sm text-slate-400">
                                {modelSales.length} sales • {model.stats.views} views
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-emerald-400">
                                {formatCurrency(revenue)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {model.stats.downloads} downloads
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sales Insights
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Conversion Rate', value: `${earningsSummary.conversionRate.toFixed(1)}%`, color: 'purple' },
                        { label: 'Top Selling Model', value: earningsSummary.topSellingModel, color: 'emerald' },
                        { label: 'Active Listings', value: approvedModels.length.toString(), color: 'blue' },
                        { label: 'Pending Approval', value: pendingModels.length.toString(), color: 'amber' }
                      ].map((insight, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-slate-600/30 rounded-xl border border-slate-500/30">
                          <span className="text-slate-300">{insight.label}</span>
                          <span className={`font-semibold text-${insight.color}-400`}>
                            {insight.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Models', value: userModels.length, color: 'purple' },
                    { label: 'Total Sales', value: earningsSummary.totalSales, color: 'emerald' },
                    { label: 'Conversion Rate', value: `${Math.round(earningsSummary.conversionRate)}%`, color: 'blue' },
                    { label: 'Portfolio Value', value: formatCurrency(totalListingsValue), color: 'amber' }
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div className={`text-2xl font-bold text-${stat.color}-400`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-300 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}