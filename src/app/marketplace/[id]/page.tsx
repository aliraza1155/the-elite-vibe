// app/marketplace/[id]/page.tsx - UPDATED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import { PaymentManager } from '@/lib/payment-utils';
import { firestore } from '@/lib/firebase';

interface AIModel {
  id: string;
  name: string;
  niche: string;
  description: string;
  framework: string;
  modelSize: string;
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

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id as string;
  
  const [model, setModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState<'sfw' | 'nsfw'>('sfw');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    loadModelDetails();
  }, [modelId]);

  const loadModelDetails = async () => {
    try {
      console.log('🔄 Loading model details from Firestore...');
      
      // Try Firestore first
      const allModels = await firestore.query('aiModels');
      const foundModel = allModels.find((m: any) => m.id === modelId) as AIModel;
      
      if (foundModel) {
        await processModel(foundModel); // ADDED AWAIT
        return;
      }
      
      // Fallback to localStorage
      const localModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const localFoundModel = localModels.find((m: AIModel) => m.id === modelId);
      
      if (!localFoundModel) {
        setError('Model not found');
        setLoading(false);
        return;
      }
      
      await processModel(localFoundModel); // ADDED AWAIT
      
    } catch (error) {
      console.error('❌ Error loading from Firestore:', error);
      
      // Fallback to localStorage
      const localModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const localFoundModel = localModels.find((m: AIModel) => m.id === modelId);
      
      if (!localFoundModel) {
        setError('Model not found');
        setLoading(false);
        return;
      }
      
      await processModel(localFoundModel); // ADDED AWAIT
    }
  };

  const processModel = async (model: AIModel) => { // ADDED ASYNC
    if (model.status !== 'approved') {
      setError('This model is not available for viewing');
      setLoading(false);
      return;
    }

    trackView(model.id);
    
    const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
    setIsLiked(userLikes[model.id] === true);

    if (currentUser) {
      // FIXED: Added await to handle the Promise
      const purchased = await PaymentManager.hasUserPurchasedModel(currentUser.id, model.id);
      setHasPurchased(purchased);
    }

    setModel(model);
    setLoading(false);
  };

  const trackView = async (modelId: string) => {
    try {
      // Update in Firestore
      const allModels = await firestore.query('aiModels');
      const modelToUpdate = allModels.find((m: any) => m.id === modelId);
      
      if (modelToUpdate) {
        await firestore.update('aiModels', modelId, {
          stats: {
            ...modelToUpdate.stats,
            views: (modelToUpdate.stats.views || 0) + 1
          }
        });
      }
      
      // Also update localStorage
      const localModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
      const updatedModels = localModels.map((m: AIModel) =>
        m.id === modelId ? { ...m, stats: { ...m.stats, views: m.stats.views + 1 } } : m
      );
      localStorage.setItem('aiModels', JSON.stringify(updatedModels));
      
      if (model) {
        setModel(prev => prev ? { ...prev, stats: { ...prev.stats, views: prev.stats.views + 1 } } : null);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!model || !currentUser) {
      router.push('/login');
      return;
    }

    try {
      if (isLiked) {
        // Update in Firestore
        await firestore.update('aiModels', model.id, {
          stats: {
            ...model.stats,
            likes: Math.max(0, model.stats.likes - 1)
          }
        });
        
        // Update localStorage
        const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
        const updatedModels = allModels.map((m: AIModel) =>
          m.id === model.id ? { ...m, stats: { ...m.stats, likes: Math.max(0, m.stats.likes - 1) } } : m
        );
        localStorage.setItem('aiModels', JSON.stringify(updatedModels));
        
        const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
        delete userLikes[model.id];
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
        
        setIsLiked(false);
        
        if (model) {
          setModel(prev => prev ? { ...prev, stats: { ...prev.stats, likes: Math.max(0, prev.stats.likes - 1) } } : null);
        }
      } else {
        // Update in Firestore
        await firestore.update('aiModels', model.id, {
          stats: {
            ...model.stats,
            likes: model.stats.likes + 1
          }
        });
        
        // Update localStorage
        const allModels = JSON.parse(localStorage.getItem('aiModels') || '[]');
        const updatedModels = allModels.map((m: AIModel) =>
          m.id === model.id ? { ...m, stats: { ...m.stats, likes: m.stats.likes + 1 } } : m
        );
        localStorage.setItem('aiModels', JSON.stringify(updatedModels));
        
        const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
        userLikes[model.id] = true;
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
        
        setIsLiked(true);
        
        if (model) {
          setModel(prev => prev ? { ...prev, stats: { ...prev.stats, likes: prev.stats.likes + 1 } } : null);
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!model) return;

    // FIXED: Added await to handle the Promise
    const hasPurchased = await PaymentManager.hasUserPurchasedModel(currentUser.id, model.id);
    if (hasPurchased) {
      alert(`✅ You already purchased "${model.name}"! You can download it from your purchases.`);
      return;
    }

    setPurchaseLoading(true);
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
      setPurchaseLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading model details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {error || 'Model Not Found'}
            </h1>
            <p className="text-slate-400 mb-6">
              The model you're looking for doesn't exist or is no longer available.
            </p>
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => router.push('/marketplace')}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                Marketplace
              </button>
            </li>
            <li>
              <span className="text-slate-600">/</span>
            </li>
            <li>
              <span className="text-white font-medium">{model.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
              <div className="aspect-video bg-slate-700/50">
                {model.media.sfwImages.length > 0 ? (
                  <img
                    src={currentTab === 'sfw' ? model.media.sfwImages[0] : model.media.nsfwImages[0]}
                    alt={model.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🤖</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentTab('sfw')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    currentTab === 'sfw'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  SFW Preview
                </button>
                <button
                  onClick={() => setCurrentTab('nsfw')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    currentTab === 'nsfw'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  NSFW Preview
                </button>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {currentTab === 'sfw' ? 'SFW Images' : 'NSFW Images'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(currentTab === 'sfw' ? model.media.sfwImages : model.media.nsfwImages).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-slate-700/50 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-200 border border-slate-600/50"
                    onClick={() => console.log('Open image:', image)}
                  >
                    <img
                      src={image}
                      alt={`${model.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {currentTab === 'sfw' ? 'SFW Video Preview' : 'NSFW Video Preview'}
              </h3>
              <div className="aspect-video bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600/50">
                {(currentTab === 'sfw' ? model.media.sfwVideos : model.media.nsfwVideos).length > 0 ? (
                  <video
                    src={currentTab === 'sfw' ? model.media.sfwVideos[0] : model.media.nsfwVideos[0]}
                    controls
                    className="w-full h-full"
                    poster={currentTab === 'sfw' ? model.media.sfwImages[0] : model.media.nsfwImages[0]}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-slate-400">🎬 Video Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">
                  {model.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getNicheColor(model.niche)} backdrop-blur-sm`}>
                  {model.niche}
                </span>
              </div>

              <p className="text-slate-300 mb-6">
                {model.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="text-xl font-bold text-white">
                    {model.stats.views}
                  </div>
                  <div className="text-sm text-slate-400">Views</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="text-xl font-bold text-white">
                    {model.stats.likes}
                  </div>
                  <div className="text-sm text-slate-400">Likes</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="text-xl font-bold text-white">
                    {model.stats.downloads}
                  </div>
                  <div className="text-sm text-slate-400">Downloads</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Framework:</span>
                  <span className="text-white font-medium">
                    {model.framework || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Size:</span>
                  <span className="text-white font-medium">
                    {model.modelSize || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Creator:</span>
                  <span className="text-white font-medium">
                    {model.ownerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded:</span>
                  <span className="text-white font-medium">
                    {new Date(model.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    ${model.price}
                  </div>
                  <div className="text-sm text-slate-400">
                    One-time purchase
                  </div>
                </div>

                {hasPurchased ? (
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-3 rounded-xl text-center font-medium backdrop-blur-sm">
                    ✅ Purchased
                  </div>
                ) : (
                  <PrimaryButton
                    onClick={handlePurchase}
                    loading={purchaseLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25"
                  >
                    {purchaseLoading ? 'Processing...' : `Purchase Now - $${model.price}`}
                  </PrimaryButton>
                )}

                <button
                  onClick={handleLike}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border transition-all duration-200 backdrop-blur-sm ${
                    isLiked
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span>{isLiked ? '❤️' : '🤍'}</span>
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                About the Creator
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {model.ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white">
                    {model.ownerName}
                  </div>
                  <div className="text-sm text-slate-400">
                    AI Model Creator
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}