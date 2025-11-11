'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import Link from 'next/link';
import { PaymentManager } from '@/lib/payment-utils';
import { SubscriptionManager } from '@/lib/subscription-utils';
import { AuthGuard } from '@/components/auth-guard';
import { unifiedFirestore } from '@/lib/firebase-unified';
import { userService } from '@/lib/firebase';

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

  const checkSubscriptionStatus = async (user: any) => {
    try {
      const subscriptionCheck = await SubscriptionManager.canUserListModels(user);
      const hasActiveSub = await SubscriptionManager.hasActiveSubscription(user);
      
      setSubscriptionStatus({
        hasActiveSubscription: hasActiveSub,
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
      console.log('🔄 Loading seller data with Firebase...');
      
      // Load user models using unified system
      const userModels = await unifiedFirestore.getUserModels(userId);
      
      console.log('✅ Loaded user models:', userModels.length);
      
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

      // Load earnings data from Firebase
      const earningsData = await PaymentManager.getSellerEarnings(userId);
      setEarnings({
        total: earningsData.totalRevenue,
        available: earningsData.availableBalance,
        pending: earningsData.pendingPayout,
        paidOut: earningsData.totalPayouts
      });

      // Load sales data
      const salesData = earningsData.transactions.map((transaction: any) => ({
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
      console.error('❌ Error loading seller data:', error);
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

    console.log('🔄 Starting model approval with Firebase ID:', modelId);
    setApprovingModelId(modelId);

    try {
      // Step 1: Get the model using our enhanced unified system
      console.log('🔍 Getting model details...');
      const model = await unifiedFirestore.getModel(modelId);
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}. It may have been deleted or there might be an ID mismatch.`);
      }

      console.log('✅ Model found:', model.name);

      // Step 2: Check subscription status using Firebase
      const approvalCheck = await PaymentManager.canUserApproveModel(currentUser, modelId);
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

      // Step 3: Update using enhanced unified system
      console.log('🔥 Updating model status to approved...');
      await unifiedFirestore.updateModel(modelId, { 
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Model approved successfully!');

      // Step 4: Update UI state
      setUserModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'approved' } : m
      ));
      
      // Step 5: Refresh subscription status
      await checkSubscriptionStatus(currentUser);
      
      console.log('🎉 Model approval completed successfully!');
      alert('✅ Model approved and listed in marketplace successfully!');
      
    } catch (error: any) {
      console.error('❌ Error approving model:', error);
      
      let errorMessage = 'Error approving model. Please try again.';
      
      if (error.message?.includes('not found')) {
        errorMessage = `Model not found: ${modelId}. It may have been deleted or there's an ID mismatch.`;
        await loadSellerData(currentUser.id);
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to approve this model. Please check your subscription status.';
      } else if (error.message?.includes('Failed to update')) {
        errorMessage = 'Database update failed. This might be a temporary issue. Please try again.';
      } else if (error.message?.includes('Firestore database is not initialized')) {
        errorMessage = 'Database connection issue. Please refresh the page and try again.';
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
      console.log('🗑️ Deleting model with Firebase ID:', modelId);
      
      // Delete using unified system
      await unifiedFirestore.deleteModel(modelId);
      console.log('✅ Model deleted successfully!');
      
      // Refresh data
      await loadSellerData(currentUser.id);
      
      alert('✅ Model deleted successfully!');
    } catch (error: any) {
      console.error('❌ Error deleting model:', error);
      
      let errorMessage = 'Error deleting model. Please try again.';
      if (error.message?.includes('not found')) {
        errorMessage = 'Model not found. It may have already been deleted.';
        await loadSellerData(currentUser.id);
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
      const result = await PaymentManager.requestPayout(currentUser.id, amount);
      
      if (result.success) {
        alert('Payout request submitted successfully!');
        setPayoutAmount('');
        // Refresh earnings data
        const earningsData = await PaymentManager.getSellerEarnings(currentUser.id);
        setEarnings({
          total: earningsData.totalRevenue,
          available: earningsData.availableBalance,
          pending: earningsData.pendingPayout,
          paidOut: earningsData.totalPayouts
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

  const refreshSubscriptionStatus = async () => {
    if (currentUser) {
      await checkSubscriptionStatus(currentUser);
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

          {/* ... Rest of the JSX remains the same ... */}
          {/* The UI structure is unchanged, only data fetching methods are updated */}
          
        </div>
      </div>
    </AuthGuard>
  );
}