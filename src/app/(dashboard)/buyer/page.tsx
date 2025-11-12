'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import Link from 'next/link';
import { PaymentManager } from '@/lib/payment-utils';
import { AuthGuard } from '@/components/auth-guard';

interface Purchase {
  id: string;
  modelId: string;
  modelName: string;
  buyerId: string;
  buyerName: string;
  price: number;
  purchasedAt: string;
  downloadUrl?: string;
  firestoreId?: string;
}

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

export default function BuyerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasedModels, setPurchasedModels] = useState<AIModel[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    loadPurchaseData(user.id);
  }, [router]);

  const loadPurchaseData = async (userId: string) => {
    try {
      setLoading(true);
      console.log('🔄 Loading purchase data with Firebase integration...');

      // Load purchases from Firebase with fallback to localStorage
      const userPurchases = await PaymentManager.getUserPurchases(userId);
      console.log('✅ Loaded purchases:', userPurchases.length);
      
      setPurchases(userPurchases);

      const total = userPurchases.reduce((sum: number, purchase: Purchase) => sum + purchase.price, 0);
      setTotalSpent(total);
      
      const recent = userPurchases.slice(-3).reverse();
      setRecentPurchases(recent);

      // Load purchased models data
      const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const purchasedModelsData = userPurchases.map((purchase: Purchase) => 
        allModels.find((model: AIModel) => model.id === purchase.modelId)
      ).filter(Boolean);
      
      setPurchasedModels(purchasedModelsData);
      
      // Update current user data
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUser = users.find((u: any) => u.id === userId);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
    } catch (error) {
      console.error('❌ Error loading purchase data:', error);
      setPurchases([]);
      setPurchasedModels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    if (currentUser) {
      setRefreshing(true);
      await loadPurchaseData(currentUser.id);
    }
  };

  const switchToSeller = () => {
    router.push('/seller');
  };

  const getUniqueModelsCount = () => {
    const uniqueModelIds = new Set(purchases.map(purchase => purchase.modelId));
    return uniqueModelIds.size;
  };

  const handleDownload = async (modelId: string, modelName: string) => {
    try {
      // Check if user actually purchased this model using Firebase
      if (currentUser) {
        const hasPurchased = await PaymentManager.hasUserPurchasedModel(currentUser.id, modelId);
        if (!hasPurchased) {
          alert('❌ You have not purchased this model. Please complete your purchase first.');
          return;
        }
      }

      alert(`📥 Downloading ${modelName}...`);
      console.log(`Download requested for model: ${modelId}`);
      
      // Here you would typically:
      // 1. Generate a secure download link
      // 2. Track the download in Firebase
      // 3. Provide the actual download
      
      // Simulate download process
      setTimeout(() => {
        alert(`✅ ${modelName} downloaded successfully!`);
      }, 1000);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Download failed. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSubscriptionStatus = () => {
    if (!currentUser?.subscription) {
      return { status: 'Free', isActive: false };
    }
    
    const isActive = currentUser.subscription.status === 'active';
    const planType = currentUser.subscription.planId?.includes('premium') ? 'Premium' : 'Basic';
    
    return { 
      status: isActive ? planType : 'Free', 
      isActive 
    };
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

  const subscription = getSubscriptionStatus();

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Refresh Data Button */}
          <div className="flex justify-end">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </span>
              ) : (
                '🔄 Refresh Data'
              )}
            </button>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                  Explorer Dashboard
                </h1>
                <p className="mt-2 text-slate-300">
                  Welcome back, {currentUser.displayName}! Manage your purchases and subscriptions.
                  {currentUser.role === 'both' && (
                    <span className="text-cyan-400 font-medium">
                      {' '}(You also have creator access)
                    </span>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { label: 'Total Purchases', value: purchases.length, color: 'blue' },
                    { label: 'Total Spent', value: formatCurrency(totalSpent), color: 'emerald' },
                    { label: 'Unique Models', value: getUniqueModelsCount(), color: 'purple' },
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
                    onClick={switchToSeller}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
                  >
                    Switch to Creator
                  </button>
                )}
                <Link href="/marketplace">
                  <PrimaryButton className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25">
                    Browse Models
                  </PrimaryButton>
                </Link>
                <Link href="/my-purchases">
                  <button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25">
                    My Purchases
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {[
              { 
                name: 'Models Purchased', 
                value: purchases.length.toString(), 
                change: `+${purchases.length}`, 
                changeType: purchases.length > 0 ? 'positive' : 'neutral',
                icon: '🛍️',
                gradient: 'from-blue-500 to-cyan-500'
              },
              { 
                name: 'Total Spent', 
                value: formatCurrency(totalSpent), 
                change: `+${formatCurrency(totalSpent)}`, 
                changeType: totalSpent > 0 ? 'positive' : 'neutral',
                icon: '💰',
                gradient: 'from-emerald-500 to-green-500'
              },
              { 
                name: 'Unique Models', 
                value: getUniqueModelsCount().toString(), 
                change: `+${getUniqueModelsCount()}`, 
                changeType: getUniqueModelsCount() > 0 ? 'positive' : 'neutral',
                icon: '🤖',
                gradient: 'from-purple-500 to-pink-500'
              },
              { 
                name: 'Active Plan', 
                value: subscription.status, 
                change: subscription.isActive ? 'Active' : 'Free Tier', 
                changeType: subscription.isActive ? 'positive' : 'neutral',
                icon: '📋',
                gradient: 'from-amber-500 to-orange-500'
              },
            ].map((stat) => (
              <div key={stat.name} className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {recentPurchases.length > 0 && (
              <div className="xl:col-span-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                    Recent Purchases
                  </h2>
                  <Link href="/my-purchases" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
                    View All {purchases.length}
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentPurchases.map((purchase) => {
                    const model = purchasedModels.find(m => m.id === purchase.modelId);
                    return (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            {model?.media.sfwImages.length ? '🖼️' : '🎯'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">
                              {purchase.modelName}
                            </div>
                            <div className="text-sm text-slate-400">
                              Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}
                            </div>
                            {purchase.firestoreId && (
                              <div className="text-xs text-slate-500 mt-1">
                                Firebase ID: {purchase.firestoreId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-emerald-400">
                            {formatCurrency(purchase.price)}
                          </div>
                          <button
                            onClick={() => handleDownload(purchase.modelId, purchase.modelName)}
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 mt-1"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Link 
                  href="/marketplace" 
                  className="flex items-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors duration-200">
                    <span className="text-lg text-cyan-400">🛍️</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-white">Browse Models</p>
                    <p className="text-sm text-slate-400">Discover new AI models</p>
                  </div>
                </Link>

                <Link 
                  href="/my-purchases" 
                  className="flex items-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-700/50 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors duration-200">
                    <span className="text-lg text-emerald-400">📦</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-white">My Purchases</p>
                    <p className="text-sm text-slate-400">
                      {purchases.length} purchased model{purchases.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/pricing" 
                  className="flex items-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-purple-500/50 hover:bg-slate-700/50 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-200">
                    <span className="text-lg text-purple-400">⭐</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-white">Upgrade Plan</p>
                    <p className="text-sm text-slate-400">Get premium features</p>
                  </div>
                </Link>
              </div>

              {/* Firebase Status Indicator */}
              <div className="mt-6 p-3 bg-slate-700/40 rounded-xl border border-slate-600/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Data Source</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${purchases.some(p => p.firestoreId) ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <span className="text-xs text-slate-400">
                      {purchases.some(p => p.firestoreId) ? 'Firebase + Local' : 'Local Storage'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading your purchase data...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="bg-gradient-to-r from-slate-800/60 to-cyan-900/20 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-6">
                Begin Your AI Journey
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                    <span className="text-2xl text-white">🔍</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Browse Models</h3>
                  <p className="text-sm text-slate-300">
                    Explore our collection of AI models across different niches and categories
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                    <span className="text-2xl text-white">🛒</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Purchase Models</h3>
                  <p className="text-sm text-slate-300">
                    Buy models that fit your creative needs with secure payment processing
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                    <span className="text-2xl text-white">🚀</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Start Creating</h3>
                  <p className="text-sm text-slate-300">
                    Download and use your purchased AI models in your creative projects
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Link href="/marketplace">
                  <PrimaryButton className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25 px-8">
                    Start Exploring Models
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-6">
                Your Collection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedModels.slice(0, 3).map((model, index) => (
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
                      <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        Purchased
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-lg mb-2">{model.name}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{model.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 font-semibold">{formatCurrency(model.price)}</span>
                        <button
                          onClick={() => handleDownload(model.id, model.name)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {purchasedModels.length > 3 && (
                <div className="text-center mt-6">
                  <Link href="/my-purchases">
                    <button className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200">
                      View All {purchasedModels.length} Models →
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}