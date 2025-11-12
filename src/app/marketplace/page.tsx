// app/marketplace/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import Link from 'next/link';
import { PaymentManager } from '@/lib/payment-utils';
import { unifiedFirestore } from '@/lib/firebase-unified';

interface AIModel {
  id: string;
  name: string;
  niche: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
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

export default function MarketplacePage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchasedModels, setPurchasedModels] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    loadModels();
  }, []);

  // Load user's purchased models
  useEffect(() => {
    if (currentUser) {
      loadPurchasedModels();
    }
  }, [currentUser]);

  const loadPurchasedModels = async () => {
    if (!currentUser) return;
    
    try {
      const userPurchases = await PaymentManager.getUserPurchases(currentUser.id);
      const purchasedModelIds = new Set(userPurchases.map(purchase => purchase.modelId));
      setPurchasedModels(purchasedModelIds);
    } catch (error) {
      console.error('Error loading purchased models:', error);
    }
  };

  const getActiveModels = (models: AIModel[]) => {
    return models.filter(model => {
      if (model.status !== 'approved') return false;
      
      const uploadDate = new Date(model.createdAt);
      const expirationDate = new Date(uploadDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      return new Date() <= expirationDate;
    });
  };

  const loadModels = async () => {
    try {
      console.log('🔄 Loading models with unified ID system...');
      
      // Use unified system to get approved models
      const approvedModels = await unifiedFirestore.getApprovedModels();
      
      console.log('✅ Loaded approved models:', approvedModels.length);
      
      const activeModels = getActiveModels(approvedModels);
      setModels(activeModels);

      // Update localStorage for offline access
      localStorage.setItem('aiModels', JSON.stringify(approvedModels));
      
    } catch (error) {
      console.error('❌ Error loading from unified system:', error);
      
      // Fallback to localStorage
      const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const approvedModels = allModels.filter((model: AIModel) => model.status === 'approved');
      const activeModels = getActiveModels(approvedModels);
      setModels(activeModels);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(model => {
    const matchesFilter = filter === 'all' || model.niche === filter;
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.niche.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleQuickPurchase = async (model: AIModel) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Check if already purchased using the local state
    if (purchasedModels.has(model.id)) {
      alert(`✅ You already purchased "${model.name}"! You can download it from your purchases.`);
      return;
    }

    setPurchaseLoading(model.id);
    try {
      const result = await PaymentManager.processModelPurchase(model.id, currentUser.id, model.price);
      
      if (result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        alert(`❌ Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('❌ Purchase failed. Please try again.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const niches = ['all', 'art', 'photography', 'writing', 'coding', 'music', 'video', '3d', 'animation', 'business', 'other'];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
            AI Model Marketplace
          </h1>
          <p className="text-xl text-slate-300">
            Discover and purchase amazing AI models from talented creators
          </p>
          <div className="mt-2 text-sm text-slate-400">
            Models automatically expire after 30 days to keep the marketplace fresh
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search models by name, description, or niche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {niches.map((niche) => (
            <button
              key={niche}
              onClick={() => setFilter(niche)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                filter === niche
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60'
              }`}
            >
              {niche === 'all' ? 'All Models' : niche.charAt(0).toUpperCase() + niche.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading models...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Active Models Found
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'No active models found matching your criteria. Try adjusting your search or filters.'
                : 'No active models available. Models expire after 30 days to keep content fresh.'
              }
            </p>
            {currentUser && (currentUser.role === 'seller' || currentUser.role === 'both') && (
              <Link href="/upload">
                <PrimaryButton className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25">
                  Upload New Model
                </PrimaryButton>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-slate-400">
                Showing {filteredModels.length} active AI models
              </p>
              <div className="text-sm text-slate-500">
                Sorted by: Newest First
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model) => {
                const uploadDate = new Date(model.createdAt);
                const expirationDate = new Date(uploadDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                const daysRemaining = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                // Use the pre-loaded purchased models state
                const hasPurchased = purchasedModels.has(model.id);
                
                return (
                  <div
                    key={model.id}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] relative"
                    onClick={() => router.push(`/marketplace/${model.id}`)}
                  >
                    {daysRemaining <= 7 && (
                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium z-10 backdrop-blur-sm ${
                        daysRemaining <= 3 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`}
                      </div>
                    )}

                    {hasPurchased && (
                      <div className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium z-10 backdrop-blur-sm">
                        ✅ Purchased
                      </div>
                    )}

                    <div className="aspect-video bg-slate-700/50 relative">
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
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1">
                        {model.name}
                      </h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                        {model.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNicheColor(model.niche)} backdrop-blur-sm`}>
                          {model.niche}
                        </span>
                        <span className="text-lg font-bold text-cyan-400">
                          ${model.price}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                        <span>By {model.ownerName}</span>
                        <div className="flex items-center space-x-3">
                          <span>👁️ {model.stats.views}</span>
                          <span>❤️ {model.stats.likes}</span>
                          <span>📥 {model.stats.downloads}</span>
                        </div>
                      </div>

                      <PrimaryButton 
                        className="w-full mb-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
                        onClick={() => {
                          // Use a ref or find another way to stop propagation if needed
                          // For now, we'll navigate directly
                          router.push(`/marketplace/${model.id}`);
                        }}
                      >
                        View Details
                      </PrimaryButton>

                      {hasPurchased ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`You already purchased "${model.name}"! You can download it from your purchases.`);
                          }}
                          className="w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                        >
                          ✅ Purchased
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickPurchase(model);
                          }}
                          disabled={purchaseLoading === model.id}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {purchaseLoading === model.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            `Buy Now - $${model.price}`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}