'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';

interface SelectedPlan {
  planId: string;
  amount: number;
  type: 'buyer' | 'seller';
  selectedAt: string;
}

// Import your actual Stripe price IDs - these should match lib/stripe.ts
const PRICE_IDS = {
  buyer_basic: 'price_1SM2P3LwYvvIBBdfFoe67i9N',
  buyer_premium: 'price_1SM2Q9LwYvvIBBdfNCgiaaEp',
  seller_starter: 'price_1SM2QoLwYvvIBBdf1A3nQJls',
  seller_pro: 'price_1SM2RNLwYvvIBBdfL0Pm3kdY',
  seller_enterprise: 'price_1SM2RwLwYvvIBBdf34Nk95Rp',
} as const;

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const router = useRouter();

  useEffect(() => {
    const planData = localStorage.getItem('selectedPlan');
    if (!planData) {
      router.push('/pricing');
      return;
    }
    setSelectedPlan(JSON.parse(planData));
  }, [router]);

  const handleStripeCheckout = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      // Get the actual Stripe price ID for the selected plan
      const priceId = PRICE_IDS[selectedPlan.planId as keyof typeof PRICE_IDS];
      
      if (!priceId) {
        throw new Error(`No price ID found for plan: ${selectedPlan.planId}`);
      }

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      console.log('Sending to checkout:', { priceId, planId: selectedPlan.planId });
      
      // Call your checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId, // Send the actual Stripe price ID
          userId: currentUser.id || `user_${Date.now()}`,
          planType: selectedPlan.type,
          planId: selectedPlan.planId, // Keep the plan ID for metadata
          customerEmail: currentUser.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed. Please try again.');
      }

      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No checkout URL received from server.');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  const getPlanFeatures = (planId: string) => {
    const features: any = {
      buyer_basic: { maxModels: 0, listingDuration: 0, revenueShare: 0 },
      buyer_premium: { maxModels: 0, listingDuration: 0, revenueShare: 0 },
      seller_starter: { maxModels: 3, listingDuration: 30, revenueShare: 80 },
      seller_pro: { maxModels: 15, listingDuration: 90, revenueShare: 85 },
      seller_enterprise: { maxModels: -1, listingDuration: 180, revenueShare: 90 }
    };
    return features[planId] || features.seller_starter;
  };

  const formatPlanName = (planId: string) => {
    return planId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading payment details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-slate-300">
              You're one step away from accessing premium features!
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Order Summary
            </h2>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-medium text-white text-lg">
                  {formatPlanName(selectedPlan.planId)} Plan
                </p>
                <p className="text-slate-300">
                  {selectedPlan.type === 'seller' ? 'Creator Subscription' : 'Explorer Subscription'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  ${selectedPlan.amount}
                </p>
                <p className="text-sm text-slate-400">per month</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Payment Method
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border-2 rounded-2xl text-center transition-all duration-200 backdrop-blur-sm ${
                  paymentMethod === 'card'
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/25'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                }`}
              >
                <div className="text-2xl mb-2">💳</div>
                <p className="font-medium text-white">Credit Card</p>
                <p className="text-sm text-slate-400 mt-1">Secure payment via Stripe</p>
              </button>
              
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`p-4 border-2 rounded-2xl text-center transition-all duration-200 backdrop-blur-sm ${
                  paymentMethod === 'crypto'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                }`}
                disabled
              >
                <div className="text-2xl mb-2">₿</div>
                <p className="font-medium text-white">Cryptocurrency</p>
                <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
              </button>
            </div>

            {/* Payment Information */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50">
                <div className="text-center">
                  <p className="text-slate-300 mb-4">
                    You'll be redirected to Stripe's secure checkout page to complete your payment.
                  </p>
                  <div className="flex justify-center space-x-6 mb-4">
                    <div className="text-2xl">💳</div>
                    <div className="text-2xl">🔒</div>
                    <div className="text-2xl">🛡️</div>
                  </div>
                  <p className="text-sm text-slate-400">
                    All payments are processed securely through Stripe. We never store your card details.
                  </p>
                </div>
              </div>
            )}

            {/* Crypto Payment Info */}
            {paymentMethod === 'crypto' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                <div className="text-4xl mb-4">₿</div>
                <h3 className="text-lg font-semibold text-amber-300 mb-2">
                  Cryptocurrency Payment
                </h3>
                <p className="text-amber-200 mb-4">
                  Crypto payments are coming soon! Please use credit card for now.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-amber-300">
                    <div className="font-semibold">Bitcoin (BTC)</div>
                    <div className="text-amber-200">Coming Soon</div>
                  </div>
                  <div className="text-amber-300">
                    <div className="font-semibold">Ethereum (ETH)</div>
                    <div className="text-amber-200">Coming Soon</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="text-emerald-400 mr-3 text-xl">🔒</div>
              <div>
                <p className="text-emerald-300 font-medium">
                  Secure & Encrypted Payment
                </p>
                <p className="text-emerald-200 text-sm mt-1">
                  Your payment is processed securely through Stripe with bank-level encryption. 
                  We never store your sensitive card details on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <PrimaryButton
              onClick={handleStripeCheckout}
              loading={loading}
              disabled={paymentMethod === 'crypto'}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redirecting to Secure Checkout...
                </div>
              ) : paymentMethod === 'crypto' ? (
                'Crypto Payments Coming Soon'
              ) : (
                `Proceed to Secure Checkout - $${selectedPlan.amount}`
              )}
            </PrimaryButton>

            <p className="text-center text-sm text-slate-400">
              By completing this purchase, you agree to our{' '}
              <button className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                Terms of Service
              </button>{' '}
              and{' '}
              <button className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                Privacy Policy
              </button>
              .
            </p>
          </div>

          {/* Additional Features Preview */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              What You'll Get
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {selectedPlan.type === 'seller' ? (
                <>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Upload AI Models
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Earn Revenue Share
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Analytics Dashboard
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Priority Support
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Unlimited Downloads
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Premium Models Access
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Early Access Features
                  </div>
                  <div className="flex items-center text-slate-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    Priority Customer Support
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Test Mode Notice */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-yellow-300 text-sm">
                <strong>Test Mode:</strong> Use Stripe test card <code className="bg-yellow-500/20 px-2 py-1 rounded">4242 4242 4242 4242</code> for testing
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}