'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/components/ui';
import { RealPaymentProcessor } from '@/lib/real-payment-processor';
import { PaymentManager } from '@/lib/payment-utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
  paymentIntent: any;
  model: any;
  currentUser: any; // Add currentUser to props
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  paymentIntent, 
  model,
  currentUser 
}: PaymentModalProps) {
  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    setError('');

    try {
      const result = await RealPaymentProcessor.processPayment(
        paymentIntent.id,
        cardDetails
      );

      if (result.success && result.transaction) {
        // Complete the purchase with all required arguments
        const purchaseResult = PaymentManager.completePurchaseAfterStripePayment(
          paymentIntent.id,
          model.id,
          currentUser.id,
          model.price
        );

        if (purchaseResult.success) {
          onSuccess(purchaseResult.transaction);
        } else {
          setError(purchaseResult.error || 'Failed to complete purchase');
        }
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (error) {
      setError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const validateForm = (): boolean => {
    if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardDetails.exp_month || !cardDetails.exp_year) {
      setError('Please enter card expiration date');
      return false;
    }
    if (!cardDetails.cvc || cardDetails.cvc.length !== 3) {
      setError('Please enter a valid CVC');
      return false;
    }
    if (!cardDetails.name) {
      setError('Please enter cardholder name');
      return false;
    }
    return true;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches ? matches[0] : '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    return parts.length ? parts.join(' ') : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-300">Model:</span>
            <span className="text-white font-medium">{model.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Amount:</span>
            <span className="text-2xl font-bold text-cyan-400">${model.price}</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 mb-4">
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={cardDetails.number}
              onChange={(e) => handleInputChange('number', formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Expiry Date
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={cardDetails.exp_month}
                  onChange={(e) => handleInputChange('exp_month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="MM"
                  maxLength={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  value={cardDetails.exp_year}
                  onChange={(e) => handleInputChange('exp_year', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="YYYY"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CVC
              </label>
              <input
                type="text"
                value={cardDetails.cvc}
                onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                maxLength={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <PrimaryButton
            onClick={handlePayment}
            loading={processing}
            disabled={processing}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25"
          >
            {processing ? 'Processing Payment...' : `Pay $${model.price}`}
          </PrimaryButton>
          
          <div className="text-center">
            <p className="text-xs text-slate-400">
              🔒 Secure payment processed with bank-level encryption
            </p>
          </div>
        </div>

        {/* Test Card Info */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-xs text-amber-300 font-medium mb-1">Test Card:</p>
          <p className="text-xs text-amber-200">4242 4242 4242 4242</p>
          <p className="text-xs text-amber-200">Any future expiry | Any 3-digit CVC</p>
        </div>
      </div>
    </div>
  );
}