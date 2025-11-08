// Price IDs for Stripe (replace with your actual price IDs from Stripe dashboard)
export const PRICE_IDS = {
  // Buyer Plans
  buyer_basic: 'price_1SM2P3LwYvvIBBdfFoe67i9N', // $5.99/month
  buyer_premium: 'price_1SM2Q9LwYvvIBBdfNCgiaaEp', // $14.99/month
  
  // Seller Plans
  seller_starter: 'price_1SM2QoLwYvvIBBdf1A3nQJls', // $29.99/month
  seller_pro: 'price_1SM2RNLwYvvIBBdfL0Pm3kdY', // $79.99/month
  seller_enterprise: 'price_1SM2RwLwYvvIBBdf34Nk95Rp', // $199.99/month
} as const;

// Plan features configuration
export const PLAN_FEATURES = {
  buyer_basic: {
    maxModels: 0,
    listingDuration: 0,
    revenueShare: 0,
    maxDownloads: 1,
    support: 'basic'
  },
  buyer_premium: {
    maxModels: 0,
    listingDuration: 0,
    revenueShare: 0,
    maxDownloads: 5,
    support: 'priority'
  },
  seller_starter: {
    maxModels: 3,
    listingDuration: 30,
    revenueShare: 80,
    maxDownloads: 0,
    support: 'email'
  },
  seller_pro: {
    maxModels: 15,
    listingDuration: 90,
    revenueShare: 85,
    maxDownloads: 0,
    support: 'dedicated'
  },
  seller_enterprise: {
    maxModels: -1, // unlimited
    listingDuration: 180,
    revenueShare: 90,
    maxDownloads: 0,
    support: '24/7'
  }
} as const;

// App configuration
export const APP_CONFIG = {
  name: 'The Elite Vibe',
  description: 'AI Models Marketplace',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'support@theelitevibe.com'
} as const;