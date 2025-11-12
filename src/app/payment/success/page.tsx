'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';
import Link from 'next/link';
import { PaymentManager } from '@/lib/payment-utils';
import { SubscriptionManager } from '@/lib/subscription-utils';

// Main content component that uses useSearchParams
function PaymentSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [firebaseStatus, setFirebaseStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type'); // 'model' or 'subscription'

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('No session ID found in URL');
      return;
    }

    if (type === 'model') {
      verifyModelPurchase(sessionId);
    } else {
      verifySubscription(sessionId);
    }
  }, [sessionId, type]);

  const verifyModelPurchase = async (sessionId: string) => {
    try {
      console.log('🔄 Verifying model purchase with session:', sessionId);
      setFirebaseStatus('pending');

      const result = await PaymentManager.verifyStripePayment(sessionId);
      
      if (result.success && result.isPaid && result.modelId && result.buyerId && result.amount) {
        console.log('✅ Payment verified, completing purchase in Firebase...');
        
        // Complete the purchase with Firebase integration
        const purchaseResult = await PaymentManager.completePurchaseAfterStripePayment(
          sessionId,
          result.modelId,
          result.buyerId,
          result.amount
        );

        if (purchaseResult.success) {
          setFirebaseStatus('completed');
          setStatus('success');
          setPurchaseDetails(purchaseResult.transaction);
          console.log('🎉 Purchase completed successfully with Firebase');
        } else {
          setFirebaseStatus('failed');
          setStatus('error');
          setError(purchaseResult.error || 'Failed to complete purchase');
          console.error('❌ Purchase completion failed:', purchaseResult.error);
        }
      } else {
        setFirebaseStatus('failed');
        setStatus('error');
        setError('Payment verification failed');
        console.error('❌ Payment verification failed:', result);
      }
    } catch (err: any) {
      setFirebaseStatus('failed');
      console.error('Model purchase verification error:', err);
      setStatus('error');
      setError(err.message || 'Failed to verify payment');
    }
  };

  const verifySubscription = async (sessionId: string) => {
    try {
      console.log('🔄 Verifying subscription with session:', sessionId);
      setFirebaseStatus('pending');

      // Call backend to verify Stripe session
      const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify session');
      }

      const { session } = result;
      
      if (session.payment_status === 'paid') {
        console.log('✅ Subscription payment verified, updating in Firebase...');
        await updateUserSubscription(session);
        setFirebaseStatus('completed');
        setStatus('success');
        setSubscription(session);
        console.log('🎉 Subscription updated successfully in Firebase');
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err: any) {
      setFirebaseStatus('failed');
      console.error('Subscription verification error:', err);
      setStatus('error');
      setError(err.message || 'Failed to verify payment');
    }
  };

  const updateUserSubscription = async (session: any) => {
    try {
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser.id) {
        throw new Error('No user logged in');
      }

      // Extract plan information from metadata
      const planId = session.metadata?.planId;
      const planType = session.metadata?.planType || 'seller';
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      if (!planId) {
        throw new Error('No plan information found in session');
      }

      // Create subscription record for Firebase
      const subscriptionData = {
        stripeSubscriptionId: session.subscription?.id || session.id,
        stripeCustomerId: session.customer,
        planId: planId,
        type: planType,
        amount: amount,
        status: 'active',
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        paymentMethod: 'card',
        features: SubscriptionManager.getSubscriptionFeatures(planId),
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Update subscription in Firebase
      console.log('🔥 Saving subscription to Firebase...');
      const firebaseResult = await PaymentManager.updateUserSubscription(
        currentUser.id,
        subscriptionData
      );

      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error || 'Failed to save subscription to Firebase');
      }

      console.log('✅ Subscription saved to Firebase:', firebaseResult.subscription?.firestoreId);

      // Update current user in localStorage for immediate UI update
      const updatedUser = {
        ...currentUser,
        subscription: {
          ...subscriptionData,
          id: firebaseResult.subscription?.id || `sub_${Date.now()}`,
          firestoreId: firebaseResult.subscription?.firestoreId
        },
        role: planType === 'seller' ? (currentUser.role === 'both' ? 'both' : 'seller') : currentUser.role,
        stripeCustomerId: session.customer,
        updatedAt: new Date().toISOString()
      };

      // Save updated user to localStorage for immediate access
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Update users array in localStorage for backward compatibility
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
      }

      // Clear selected plan
      localStorage.removeItem('selectedPlan');

      console.log('✅ Subscription updated successfully for user:', currentUser.id);
      
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  };

  const formatPlanName = (planId: string) => {
    return planId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <Header />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Verifying Your Payment
            </h2>
            <p className="text-slate-400 mb-4">
              Please wait while we confirm your payment details...
            </p>
            
            {/* Firebase Status Indicator */}
            <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Database Sync</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    firebaseStatus === 'completed' ? 'bg-emerald-500' : 
                    firebaseStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-xs text-slate-400">
                    {firebaseStatus === 'completed' ? 'Firebase Synced' :
                     firebaseStatus === 'failed' ? 'Sync Failed' : 'Syncing...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <Header />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-8 text-center">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
              <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent mb-4">
              Payment Failed
            </h1>
            
            <p className="text-xl text-slate-300 mb-6">
              {error}
            </p>

            {/* Firebase Status for Error */}
            {firebaseStatus === 'failed' && (
              <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                <p className="text-amber-300 text-sm">
                  Note: Your payment was processed but we encountered issues saving to our database. 
                  Please contact support if you don't see your purchase in your account.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {type === 'model' ? (
                <Link href="/marketplace">
                  <PrimaryButton className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25">
                    Back to Marketplace
                  </PrimaryButton>
                </Link>
              ) : (
                <PrimaryButton
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
                >
                  Try Again
                </PrimaryButton>
              )}
              
              <Link href="/">
                <button className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm">
                  Return Home
                </button>
              </Link>
            </div>
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent mb-4">
            Payment Successful! 🎉
          </h1>
          
          {/* Firebase Success Indicator */}
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-emerald-300 text-sm">
                ✅ Successfully saved to secure database
              </span>
            </div>
          </div>
          
          {type === 'model' && purchaseDetails ? (
            <>
              <p className="text-xl text-slate-300 mb-6">
                Thank you for purchasing <strong>{purchaseDetails.modelName}</strong>
              </p>
              
              {/* Purchase Details */}
              <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-8 text-left">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Purchase Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="font-medium text-cyan-300">
                      {purchaseDetails.modelName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="font-medium text-emerald-400">
                      {formatCurrency(purchaseDetails.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seller Earnings:</span>
                    <span className="font-medium text-emerald-300">
                      {formatCurrency(purchaseDetails.sellerRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission:</span>
                    <span className="font-medium text-amber-400">
                      {purchaseDetails.commissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Purchase Date:</span>
                    <span className="text-white">
                      {new Date(purchaseDetails.purchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {purchaseDetails.firestoreId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {purchaseDetails.firestoreId.substring(0, 12)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/my-purchases">
                  <PrimaryButton className="px-8 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25">
                    View My Purchases
                  </PrimaryButton>
                </Link>
                <Link href="/marketplace">
                  <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </>
          ) : (
            // Subscription success content
            <>
              <p className="text-xl text-slate-300 mb-8">
                Welcome to the elite circle! Your subscription is now active.
              </p>

              {/* Subscription Details */}
              {subscription && (
                <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Subscription Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan:</span>
                      <span className="font-medium text-cyan-300">
                        {formatPlanName(subscription.metadata?.planId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-medium text-emerald-400">
                        {formatCurrency(subscription.amount_total ? subscription.amount_total / 100 : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-medium text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full text-sm border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Billing Cycle:</span>
                      <span className="font-medium text-white">
                        Monthly
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Billing:</span>
                      <span className="font-medium text-white">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {subscription?.metadata?.planType === 'seller' ? (
                  <Link href="/upload">
                    <PrimaryButton className="px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25">
                      Upload Your First Model
                    </PrimaryButton>
                  </Link>
                ) : (
                  <Link href="/marketplace">
                    <PrimaryButton className="px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25">
                      Browse Premium Models
                    </PrimaryButton>
                  </Link>
                )}
                
                <Link href={subscription?.metadata?.planType === 'seller' ? '/seller' : '/buyer'}>
                  <button className="px-8 py-3 bg-slate-700/30 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm">
                    Go to Dashboard
                  </button>
                </Link>
              </div>
            </>
          )}

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">
              A confirmation email has been sent to your registered email address.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Need help? Contact our{' '}
              <button 
                onClick={() => alert('Support: support@aimarketplace.com')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
              >
                support team
              </button>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Loading component for Suspense fallback
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading Payment Details
          </h2>
          <p className="text-slate-400">
            Please wait while we load your payment information...
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}