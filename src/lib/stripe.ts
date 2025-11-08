import Stripe from 'stripe';

// 🔹 Server-side Stripe configuration
export const getStripeServer = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover', // Updated to the latest API version
    typescript: true,
  });
};

// 🔹 Price IDs - Replace these with your actual Stripe Price IDs
export const PRICE_IDS = {
  // Buyer Plans
  buyer_basic: 'price_1SM2P3LwYvvIBBdfFoe67i9N',
  buyer_premium: 'price_1SM2Q9LwYvvIBBdfNCgiaaEp',

  // Seller Plans
  seller_starter: 'price_1SM2QoLwYvvIBBdf1A3nQJls',
  seller_pro: 'price_1SM2RNLwYvvIBBdfL0Pm3kdY',
  seller_enterprise: 'price_1SM2RwLwYvvIBBdf34Nk95Rp',
} as const;

// 🔹 Plan feature definitions
export const PLAN_FEATURES = {
  buyer_basic: {
    maxModels: 0,
    listingDuration: 0,
    revenueShare: 0,
    maxDownloads: 1,
    support: 'basic',
  },
  buyer_premium: {
    maxModels: 0,
    listingDuration: 0,
    revenueShare: 0,
    maxDownloads: 5,
    support: 'priority',
  },
  seller_starter: {
    maxModels: 3,
    listingDuration: 30,
    revenueShare: 80,
    maxDownloads: 0,
    support: 'email',
  },
  seller_pro: {
    maxModels: 15,
    listingDuration: 90,
    revenueShare: 85,
    maxDownloads: 0,
    support: 'dedicated',
  },
  seller_enterprise: {
    maxModels: -1, // unlimited
    listingDuration: 180,
    revenueShare: 90,
    maxDownloads: 0,
    support: '24/7',
  },
} as const;

// 🔹 Create a Checkout Session for subscriptions
export const createCheckoutSession = async (
  priceId: string,
  customerId?: string,
  metadata: Record<string, any> = {}
) => {
  const stripe = getStripeServer();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      customer: customerId,
      subscription_data: {
        metadata,
      },
      metadata,
      allow_promotion_codes: true,
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

// 🔹 Create a Checkout Session for one-time payments (model purchases)
export const createOneTimeCheckoutSession = async (
  amount: number,
  modelName: string,
  modelId: string,
  buyerId: string,
  sellerId: string,
  customerId?: string,
  metadata: Record<string, any> = {}
) => {
  const stripe = getStripeServer();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: modelName,
              description: `AI Model Purchase - ${modelName}`,
              metadata: {
                modelId,
                type: 'ai_model'
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=model`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/${modelId}`,
      customer: customerId,
      metadata: {
        ...metadata,
        type: 'model_purchase',
        modelId,
        modelName,
        buyerId,
        sellerId,
        amount,
        timestamp: new Date().toISOString()
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'if_required',
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating one-time checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

// 🔹 Retrieve Checkout Session (e.g., after redirect)
export const getCheckoutSession = async (sessionId: string) => {
  const stripe = getStripeServer();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'line_items'],
    });
    return session;
  } catch (error) {
    console.error('❌ Error retrieving checkout session:', error);
    throw new Error('Failed to retrieve checkout session');
  }
};

// 🔹 Create a one-time Payment Intent (if needed for direct payments)
export const createPaymentIntent = async (amount: number, metadata: Record<string, any> = {}) => {
  const stripe = getStripeServer();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return paymentIntent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

// 🔹 Create Customer Billing Portal Session
export const createCustomerPortalSession = async (customerId: string) => {
  const stripe = getStripeServer();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    });

    return session;
  } catch (error) {
    console.error('❌ Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
};

// 🔹 Verify Stripe Webhook Signature
export const verifyWebhookSignature = (body: string, signature: string) => {
  const stripe = getStripeServer();

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};