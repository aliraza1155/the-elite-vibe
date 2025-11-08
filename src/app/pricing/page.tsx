'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('seller');
  const router = useRouter();

  const handlePlanSelect = async (planId: string, amount: number, type: 'buyer' | 'seller') => {
    setSelectedPlan(planId);
    setLoading(true);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser.id) {
        router.push('/login?redirect=pricing');
        return;
      }

      if (planId === 'buyer_free') {
        router.push('/marketplace');
        return;
      }

      localStorage.setItem('selectedPlan', JSON.stringify({
        planId,
        amount,
        type,
        selectedAt: new Date().toISOString()
      }));

      router.push('/payment');

    } catch (error: any) {
      console.error('Plan selection error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    buyer: [
      {
        id: 'buyer_free',
        name: 'Free Explorer',
        price: 0,
        period: 'month',
        description: 'Perfect for individuals exploring AI models',
        features: [
          'Access to all AI models',
          'Download purchased models',
          'Basic customer support',
          'Community access',
          'Free forever'
        ],
        popular: false,
        gradient: 'from-blue-500 to-cyan-500'
      }
    ],
    seller: [
      {
        id: 'seller_starter',
        name: 'Creator',
        price: 29.99,
        period: 'month',
        description: 'Start your AI model selling journey',
        features: [
          'List up to 3 models',
          '80% revenue share',
          'Basic analytics dashboard',
          'Standard model approval',
          'Email support',
          '30-day listing duration',
          'Model statistics'
        ],
        popular: false,
        gradient: 'from-emerald-500 to-green-500'
      },
      {
        id: 'seller_pro',
        name: 'Pro Creator',
        price: 79.99,
        period: 'month',
        description: 'For serious creators and agencies',
        features: [
          'List up to 15 models',
          '85% revenue share',
          'Advanced analytics dashboard',
          'Priority model approval',
          'Dedicated account manager',
          '90-day listing duration',
          'Featured placement opportunities',
          'Sales insights',
          'Custom storefront'
        ],
        popular: true,
        gradient: 'from-purple-500 to-blue-500'
      },
      {
        id: 'seller_enterprise',
        name: 'Enterprise',
        price: 199.99,
        period: 'month',
        description: 'Maximum exposure and revenue potential',
        features: [
          'Unlimited model listings',
          '90% revenue share',
          'Real-time analytics',
          'Instant model approval',
          '24/7 priority support',
          '180-day listing duration',
          'Homepage featured placement',
          'Custom branding options',
          'API access',
          'White-label solutions'
        ],
        popular: false,
        gradient: 'from-amber-500 to-orange-500'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
            Choose Your Creator Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Start selling your AI models. Select the perfect plan that matches your creative ambitions.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('buyer')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'buyer'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                🛍️ Explorer (Free)
              </button>
              <button
                onClick={() => setActiveTab('seller')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'seller'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                🤖 Creator Plans
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'buyer' && (
          <div className="mb-16">
            <div className="grid grid-cols-1 max-w-2xl mx-auto">
              {plans.buyer.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 relative transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-300 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400 ml-2">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3 border border-emerald-500/30">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                      if (!currentUser.id) {
                        router.push('/login');
                      } else {
                        alert('You already have free buyer access! Start exploring models.');
                        router.push('/marketplace');
                      }
                    }}
                    className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg shadow-blue-500/25 text-white py-4 rounded-xl font-medium transition-all duration-200`}
                  >
                    Start Exploring Free
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seller' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.seller.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-slate-800/60 backdrop-blur-xl border ${
                    plan.popular 
                      ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20 transform scale-105' 
                      : 'border-slate-700/50'
                  } rounded-3xl p-8 relative transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg shadow-purple-500/25">
                        Recommended
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-300 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400 ml-2">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3 border border-emerald-500/30">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PrimaryButton
                    onClick={() => handlePlanSelect(plan.id, plan.price, 'seller')}
                    loading={loading && selectedPlan === plan.id}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg ${
                      plan.popular ? 'shadow-purple-500/25' : 'shadow-emerald-500/25'
                    } transition-all duration-200 transform hover:scale-105`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Start Creating'
                    )}
                  </PrimaryButton>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Compare All Features
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-cyan-400 text-2xl mb-3">🚀</div>
              <h3 className="text-white font-semibold mb-2">Fast Downloads</h3>
              <p className="text-slate-400 text-sm">High-speed model downloads with resume capability</p>
            </div>
            <div className="p-4">
              <div className="text-purple-400 text-2xl mb-3">💎</div>
              <h3 className="text-white font-semibold mb-2">Premium Quality</h3>
              <p className="text-slate-400 text-sm">Curated AI models from top creators worldwide</p>
            </div>
            <div className="p-4">
              <div className="text-emerald-400 text-2xl mb-3">🛡️</div>
              <h3 className="text-white font-semibold mb-2">Secure Platform</h3>
              <p className="text-slate-400 text-sm">Enterprise-grade security and encryption</p>
            </div>
            <div className="p-4">
              <div className="text-amber-400 text-2xl mb-3">🌍</div>
              <h3 className="text-white font-semibold mb-2">Global Access</h3>
              <p className="text-slate-400 text-sm">Access models from anywhere in the world</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-amber-300 mb-2 flex items-center">
            💳 Test Payment Information
          </h3>
          <p className="text-amber-200 text-sm">
            Use test card: <strong className="text-amber-100">4242 4242 4242 4242</strong> | 
            Expiry: Any future date | CVC: Any 3 digits
          </p>
          <p className="text-amber-300 text-xs mt-2">
            This is a demo environment. No real payments will be processed.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}