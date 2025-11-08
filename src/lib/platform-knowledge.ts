// Comprehensive platform knowledge base for The Elite Vibe
export const platformKnowledge = {
  // Platform Identity
  identity: {
    name: "The Elite Vibe",
    fullName: "The Elite Vibe AI Model Marketplace",
    tagline: "The World's Largest AI Model Marketplace",
    description: "A premium marketplace connecting AI creators with users worldwide to buy and sell cutting-edge AI models with secure transactions and maximum revenue sharing.",
    purpose: "To democratize access to cutting-edge AI technology by creating a global marketplace where creators can monetize their AI models and users can discover powerful tools for their projects.",
    yearFounded: "2024"
  },

  // Chatbot Identity
  chatbot: {
    name: "VibeAgent",
    role: "Official AI Assistant of The Elite Vibe",
    personality: "Enthusiastic, helpful, professional, and deeply knowledgeable about the platform",
    capabilities: [
      "Guide users through platform features",
      "Help with model uploads and purchases",
      "Explain pricing and subscription plans",
      "Provide creator success strategies",
      "Navigate users to appropriate pages",
      "Answer platform-specific questions"
    ]
  },

  // User Roles & Capabilities
  roles: {
    explorer: {
      name: "Explorer",
      description: "Users who browse and purchase AI models",
      capabilities: [
        "Browse marketplace",
        "Purchase models",
        "Download purchased models",
        "Save favorite models",
        "Access basic customer support"
      ],
      subscription: "Free"
    },
    creator: {
      name: "Creator",
      description: "Users who upload and sell AI models",
      capabilities: [
        "Upload AI models",
        "Set model prices ($50 minimum)",
        "Earn 80-90% revenue share",
        "Track sales and earnings",
        "Access analytics dashboard",
        "Manage model listings"
      ],
      subscription: "Paid plans required"
    },
    visionary: {
      name: "Visionary",
      description: "Users with both buying and selling capabilities",
      capabilities: [
        "All Explorer features",
        "All Creator features",
        "Complete marketplace access",
        "Maximum flexibility"
      ],
      subscription: "Paid plans required for selling"
    }
  },

  // Subscription Plans (from pricing page)
  subscriptions: {
    explorer: {
      name: "Explorer",
      price: 0,
      period: "month",
      features: [
        "Access to all AI models",
        "Download purchased models",
        "Basic customer support",
        "Community access",
        "Free forever"
      ],
      description: "Perfect for individuals exploring AI models"
    },
    creator: {
      name: "Creator",
      price: 29.99,
      period: "month",
      features: [
        "List up to 3 models",
        "80% revenue share",
        "Basic analytics dashboard",
        "Standard model approval",
        "Email support",
        "30-day listing duration",
        "Model statistics"
      ],
      description: "Start your AI model selling journey"
    },
    pro: {
      name: "Pro Creator",
      price: 79.99,
      period: "month",
      features: [
        "List up to 15 models",
        "85% revenue share",
        "Advanced analytics dashboard",
        "Priority model approval",
        "Dedicated account manager",
        "90-day listing duration",
        "Featured placement opportunities",
        "Sales insights",
        "Custom storefront"
      ],
      description: "For serious creators and agencies"
    },
    enterprise: {
      name: "Enterprise",
      price: 199.99,
      period: "month",
      features: [
        "Unlimited model listings",
        "90% revenue share",
        "Real-time analytics",
        "Instant model approval",
        "24/7 priority support",
        "180-day listing duration",
        "Homepage featured placement",
        "Custom branding options",
        "API access",
        "White-label solutions"
      ],
      description: "Maximum exposure and revenue potential"
    }
  },

  // Upload Requirements (from upload page)
  uploadRequirements: {
    minimumFiles: {
      sfwImages: 4,
      nsfwImages: 4,
      sfwVideos: 1,
      nsfwVideos: 1
    },
    fileSpecs: {
      images: {
        maxSize: "50MB each",
        formats: "JPEG, PNG, WebP"
      },
      videos: {
        maxSize: "500MB each",
        formats: "MP4, WebM, QuickTime"
      }
    },
    modelDetails: {
      price: "Minimum $50",
      requiredFields: ["name", "niche", "description"],
      niches: [
        "art", "photography", "writing", "coding", "music",
        "video", "3d", "animation", "business", "other"
      ]
    },
    process: [
      "Fill model details (name, description, niche, price)",
      "Upload minimum required media files",
      "Submit for approval",
      "Typically approved within 24 hours",
      "Model goes live in marketplace for 30 days (auto-expires)"
    ]
  },

  // Marketplace Features
  marketplace: {
    features: [
      "10,000+ AI models",
      "Secure Stripe payments",
      "Instant downloads",
      "Model previews (SFW/NSFW)",
      "Advanced search and filtering",
      "Model statistics tracking",
      "Creator profiles",
      "Rating and review system"
    ],
    stats: {
      totalModels: "10K+",
      activeCreators: "5K+",
      totalDownloads: "50K+",
      creatorEarnings: "$2M+"
    }
  },

  // Platform Pages & Navigation
  pages: {
    home: {
      path: "/",
      purpose: "Landing page with platform overview and hero section"
    },
    marketplace: {
      path: "/marketplace",
      purpose: "Browse and purchase AI models"
    },
    upload: {
      path: "/upload",
      purpose: "Upload new AI models (creator feature)",
      requirements: "Creator or Visionary role with active subscription"
    },
    seller: {
      path: "/seller",
      purpose: "Creator dashboard for managing models and earnings"
    },
    buyer: {
      path: "/buyer",
      purpose: "Explorer dashboard for managing purchases"
    },
    "my-purchases": {
      path: "/my-purchases",
      purpose: "View and download purchased AI models",
      requirements: "Logged in user"
    },
    pricing: {
      path: "/pricing",
      purpose: "View subscription plans and features"
    },
    signup: {
      path: "/signup",
      purpose: "Create new account with role selection"
    },
    login: {
      path: "/login",
      purpose: "Sign in to existing account"
    },
    about: {
      path: "/about",
      purpose: "Learn about platform mission and features"
    },
    contact: {
      path: "/contact",
      purpose: "Get support and contact the team"
    },
    help: {
      path: "/help",
      purpose: "Access help center and documentation"
    },
    terms: {
      path: "/terms",
      purpose: "Terms of Service"
    },
    privacy: {
      path: "/privacy",
      purpose: "Privacy Policy"
    }
  },

  // Success Stories & Social Proof
  successStories: [
    "Creators earning $5,000+ per month",
    "Models with 1,000+ downloads",
    "95% creator satisfaction rate",
    "24-hour average support response time",
    "Global community across 50+ countries"
  ],

  // Platform Rules & Guidelines
  guidelines: {
    prohibitedContent: [
      "Content infringing intellectual property rights",
      "Malicious software or harmful code",
      "Hate speech, violence, or illegal activities",
      "Spam or misleading content",
      "Privacy violations",
      "Unethical AI applications"
    ],
    modelQuality: [
      "Must function as described",
      "No false advertising",
      "Clear documentation",
      "Regular updates encouraged",
      "Responsive to buyer questions"
    ]
  }
};

// Enhanced authentication-aware navigation helper
export const navigateToPage = (pageKey: string, currentUser: any = null): { 
  success: boolean; 
  path: string; 
  message: string;
  requiresAuth?: boolean;
  authMessage?: string;
} => {
  const page = platformKnowledge.pages[pageKey as keyof typeof platformKnowledge.pages];
  
  if (!page) {
    return {
      success: false,
      path: "/",
      message: "I'm not sure which page you're looking for. Let me help you explore our platform!"
    };
  }

  // Check authentication requirements
  const authCheck = checkAuthenticationRequirements(pageKey, currentUser);
  
  if (authCheck.requiresAuth && !currentUser) {
    return {
      success: false,
      path: "/signup",
      message: authCheck.message,
      requiresAuth: true,
      authMessage: authCheck.message
    };
  }

  // Check role requirements
  const roleCheck = checkRoleRequirements(pageKey, currentUser);
  if (roleCheck.requiresRole && !roleCheck.hasRequiredRole) {
    return {
      success: false,
      path: "/pricing",
      message: roleCheck.message,
      requiresAuth: true
    };
  }

  return {
    success: true,
    path: page.path,
    message: `Taking you to ${page.purpose.toLowerCase()}...`
  };
};

// Authentication requirements for different pages
const checkAuthenticationRequirements = (pageKey: string, currentUser: any) => {
  const authRequiredPages = ['upload', 'seller', 'buyer', 'my-purchases'];
  
  if (authRequiredPages.includes(pageKey) && !currentUser) {
    const messages = [
      `To access ${pageKey === 'upload' ? 'model uploads' : pageKey === 'seller' ? 'creator dashboard' : 'your dashboard'}, you'll need to create an account first! Let me take you to sign up. 🚀`,
      `I'd love to show you the ${pageKey === 'upload' ? 'upload page' : 'dashboard'}! First, let's get you signed up - it only takes a moment. 💫`,
      `The ${pageKey === 'upload' ? 'model upload' : pageKey === 'seller' ? 'creator' : 'explorer'} features require an account. Let me help you get started with a quick sign up! 🎯`
    ];
    
    return {
      requiresAuth: true,
      message: messages[Math.floor(Math.random() * messages.length)]
    };
  }

  return { requiresAuth: false, message: '' };
};

// Role requirements for different pages
const checkRoleRequirements = (pageKey: string, currentUser: any) => {
  if (!currentUser) {
    return { requiresRole: false, hasRequiredRole: false, message: '' };
  }

  // Upload and seller pages require creator/visionary role
  if ((pageKey === 'upload' || pageKey === 'seller') && 
      !['seller', 'both'].includes(currentUser.role)) {
    return {
      requiresRole: true,
      hasRequiredRole: false,
      message: `To access ${pageKey === 'upload' ? 'model uploads' : 'the creator dashboard'}, you'll need a Creator or Visionary account. Let me show you our subscription plans! 💎`
    };
  }

  return { requiresRole: false, hasRequiredRole: true, message: '' };
};

// Smart journey planning for common user flows
export const planUserJourney = (intent: string, currentUser: any = null) => {
  const journeys = {
    'upload-model': {
      steps: currentUser ? 
        (['seller', 'both'].includes(currentUser.role) ? 
          ['upload', 'seller'] : 
          ['pricing', 'upload', 'seller']) : 
        ['signup', 'pricing', 'upload', 'seller'],
      description: 'Become a creator and upload your first AI model'
    },
    'become-seller': {
      steps: currentUser ? 
        (['seller', 'both'].includes(currentUser.role) ? 
          ['seller'] : 
          ['pricing', 'seller']) : 
        ['signup', 'pricing', 'seller'],
      description: 'Start your journey as an AI model creator'
    },
    'become-buyer': {
      steps: currentUser ? 
        (['buyer', 'both'].includes(currentUser.role) ? 
          ['buyer'] : 
          ['buyer']) : 
        ['signup', 'buyer'],
      description: 'Explore and purchase AI models'
    },
    'view-purchases': {
      steps: currentUser ? 
        ['my-purchases'] : 
        ['signup', 'my-purchases'],
      description: 'Access your purchased AI models'
    }
  };

  return journeys[intent as keyof typeof journeys] || null;
};

// Quick responses for common questions
export const quickResponses = {
  greetings: [
    "Welcome to The Elite Vibe! 🚀 I'm VibeAgent, your guide to the world's largest AI model marketplace. Ready to explore amazing AI tools or start your creator journey?",
    "Hey there! 👋 I'm VibeAgent from The Elite Vibe. Whether you're here to discover cutting-edge AI models or share your own creations, I'm here to help!",
    "Hello visionary! 💫 Welcome to The Elite Vibe - where AI creators and explorers connect. I'm VibeAgent, your partner in this exciting AI marketplace journey!"
  ],
  
  whatIsPlatform: [
    "The Elite Vibe is the world's largest AI model marketplace! We connect creators who build amazing AI models with users who need them. Think of us as the premium meeting point for AI innovation and practical application.",
    "We're a revolutionary platform where AI creators can monetize their models and users can discover powerful AI tools. With secure payments, high revenue shares, and a global community, we're shaping the future of AI commerce!",
    "The Elite Vibe is your gateway to the AI economy! Creators earn 80-90% revenue sharing, explorers access thousands of models, and everyone benefits from our secure, premium marketplace experience."
  ],
  
  howToUpload: [
    "Ready to share your AI genius? 🎯 First, you'll need a Creator subscription. Then: 1) Go to Upload page 2) Add model details 3) Upload 4+ SFW/NSFW images & videos 4) Set your price ($50+ min) 5) Submit for approval!",
    "Uploading is exciting! You'll need: Creator role, 4 SFW images, 4 NSFW images, 1 SFW video, 1 NSFW video. Set your price from $50+, and we'll typically approve within 24 hours!",
    "To upload: Be a Creator/Visionary, have your model files ready (images & videos), describe your model well, price it fairly ($50 minimum), and we handle the rest! Approval usually takes 24 hours."
  ],
  
  howToBuy: [
    "Shopping for AI power? 🛍️ Browse our marketplace, filter by niche, check model previews, click Buy Now, complete secure Stripe payment, and download instantly! All purchases are lifetime access.",
    "Buying is simple! Explore models, view SFW/NSFW previews, purchase with secure payments, and download immediately. Your models stay available forever in 'My Purchases'!",
    "To buy: Visit marketplace, find your perfect model, review previews, purchase securely, download instantly. All your purchases are safely stored for lifetime access!"
  ],
  
  pricingInfo: [
    "We have plans for everyone! 🎯 Explorer: Free browsing. Creator: $29.99/mo (3 models, 80% revenue). Pro: $79.99/mo (15 models, 85% revenue). Enterprise: $199.99/mo (unlimited, 90% revenue).",
    "Choose your path: Free Explorer access or Creator plans starting at $29.99/month with 80-90% revenue sharing and increasing model limits!",
    "Pricing made simple: Start free as Explorer or upgrade to Creator plans from $29.99/month. Higher plans = more models + better revenue share (up to 90%!)"
  ]
};