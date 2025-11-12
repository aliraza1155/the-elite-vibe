// app/my-purchases/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
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
  media?: {
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

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasedModels, setPurchasedModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (user) {
      loadPurchases(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadPurchases = async (userId: string) => {
    try {
      // ADDED AWAIT - This is now an async function
      const userPurchases = await PaymentManager.getUserPurchases(userId);
      setPurchases(userPurchases);

      const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      
      // FIXED: userPurchases is now properly typed as Purchase[]
      const purchasedModelsData = userPurchases.map((purchase: Purchase) => 
        allModels.find((model: AIModel) => model.id === purchase.modelId)
      ).filter((model): model is AIModel => model !== undefined);
      
      setPurchasedModels(purchasedModelsData);
    } catch (error) {
      console.error('Error loading purchases:', error);
      setPurchases([]);
      setPurchasedModels([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSpent = () => {
    return purchases.reduce((total, purchase) => total + purchase.price, 0);
  };

  const handleDownload = (modelId: string, modelName: string) => {
    alert(`Downloading ${modelName}...`);
    console.log(`Download requested for model: ${modelId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getModelThumbnail = (model: AIModel) => {
    const hasImages = model.media?.sfwImages && model.media.sfwImages.length > 0;
    if (hasImages) {
      return (
        <img
          src={model.media!.sfwImages[0]}
          alt={model.name}
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-4xl">🤖</span>
      </div>
    );
  };

  const getModelDisplayName = (model: AIModel | undefined, purchase: Purchase) => {
    return model?.name || purchase.modelName || 'Unknown Model';
  };

  const getModelNiche = (model: AIModel | undefined) => {
    return model?.niche || 'Unknown Niche';
  };

  const getModelPrice = (model: AIModel | undefined, purchase: Purchase) => {
    return purchase ? formatCurrency(purchase.price) : formatCurrency(model?.price || 0);
  };

  const getModelThumbnailSmall = (model: AIModel | undefined) => {
    const hasImages = model?.media?.sfwImages && model.media.sfwImages.length > 0;
    if (hasImages && model) {
      return (
        <img
          src={model.media!.sfwImages[0]}
          alt={model.name}
          className="w-10 h-10 rounded-lg object-cover mr-3"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mr-3">
        <span className="text-lg">🤖</span>
      </div>
    );
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">
              Please log in to view your purchases
            </h1>
            <Link href="/login">
              <PrimaryButton className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                Sign In
              </PrimaryButton>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <Header />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                My Collection
              </h1>
              <p className="text-slate-300 mt-2">
                All your purchased AI models in one place
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(getTotalSpent())}
                </div>
                <div className="text-sm text-slate-400">
                  Total Investment
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70'
                  }`}
                >
                  🏠
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70'
                  }`}
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[
              { label: 'Total Purchases', value: purchases.length, color: 'blue', icon: '🛍️' },
              { label: 'Total Value', value: formatCurrency(getTotalSpent()), color: 'emerald', icon: '💰' },
              { label: 'Unique Models', value: new Set(purchases.map(p => p.modelId)).size, color: 'purple', icon: '🤖' }
            ].map((stat, index) => (
              <div key={index} className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold text-${stat.color}-400`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                  <div className="text-2xl opacity-60">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading your collection...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Purchases Yet
              </h3>
              <p className="text-slate-400 mb-6">
                Start exploring the marketplace to find amazing AI models!
              </p>
              <Link href="/marketplace">
                <PrimaryButton className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25">
                  Explore Marketplace
                </PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {purchasedModels.map((model, index) => {
                    const purchase = purchases[index];
                    return (
                      <div
                        key={model.id}
                        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div 
                          className="aspect-video bg-slate-700/50 relative cursor-pointer"
                          onClick={() => router.push(`/marketplace/${model.id}`)}
                        >
                          {getModelThumbnail(model)}
                          <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                            Purchased
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1">
                            {getModelDisplayName(model, purchase)}
                          </h3>
                          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                            {model.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNicheColor(model.niche)} backdrop-blur-sm`}>
                              {model.niche}
                            </span>
                            <span className="text-lg font-bold text-emerald-400">
                              {getModelPrice(model, purchase)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                            <span>Purchased: {purchase ? new Date(purchase.purchasedAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/marketplace/${model.id}`)}
                              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-cyan-500/25"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDownload(model.id, model.name)}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/25"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white">
                      Purchase History
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Model
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Purchase Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {purchases.map((purchase) => {
                          const model = purchasedModels.find(m => m.id === purchase.modelId);
                          return (
                            <tr key={purchase.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getModelThumbnailSmall(model)}
                                  <div>
                                    <div className="text-sm font-medium text-white">
                                      {getModelDisplayName(model, purchase)}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                      {getModelNiche(model)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-emerald-400 font-medium">
                                  {formatCurrency(purchase.price)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-300">
                                  {new Date(purchase.purchasedAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(purchase.purchasedAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                <button
                                  onClick={() => router.push(`/marketplace/${purchase.modelId}`)}
                                  className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownload(purchase.modelId, purchase.modelName)}
                                  className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                                >
                                  Download
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{purchases.length}</div>
                    <div className="text-sm text-slate-400">Total Items</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(getTotalSpent())}</div>
                    <div className="text-sm text-slate-400">Total Value</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(purchases.map(p => p.modelId)).size}
                    </div>
                    <div className="text-sm text-slate-400">Unique Models</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">
                      {Math.round(getTotalSpent() / purchases.length) || 0}
                    </div>
                    <div className="text-sm text-slate-400">Avg. Price</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}