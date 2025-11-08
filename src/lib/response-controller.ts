import { platformKnowledge, quickResponses, navigateToPage, planUserJourney } from './platform-knowledge';

export class ResponseController {
  private static instance: ResponseController;
  private conversationContext: string[] = [];

  static getInstance(): ResponseController {
    if (!ResponseController.instance) {
      ResponseController.instance = new ResponseController();
    }
    return ResponseController.instance;
  }

  // Strict platform-focused response generation
  generateResponse(userMessage: string, currentUser: any = null): { response: string; action?: { type: string; data: any } } {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Update conversation context
    this.conversationContext.push(userMessage);
    if (this.conversationContext.length > 5) {
      this.conversationContext.shift();
    }

    // 1. Handle greetings
    if (this.isGreeting(lowerMessage)) {
      return this.handleGreeting(currentUser);
    }

    // 2. Handle authentication-required journeys
    const journeyResponse = this.handleAuthenticationJourneys(lowerMessage, currentUser);
    if (journeyResponse) {
      return journeyResponse;
    }

    // 3. Handle platform identity questions
    if (this.isPlatformIdentityQuestion(lowerMessage)) {
      return this.handlePlatformIdentity();
    }

    // 4. Handle chatbot identity questions
    if (this.isChatbotIdentityQuestion(lowerMessage)) {
      return this.handleChatbotIdentity();
    }

    // 5. Handle navigation requests
    const navigationResult = this.handleNavigation(lowerMessage, currentUser);
    if (navigationResult) {
      return navigationResult;
    }

    // 6. Handle specific platform questions
    const platformResponse = this.handlePlatformQuestions(lowerMessage, currentUser);
    if (platformResponse) {
      return platformResponse;
    }

    // 7. Handle off-topic questions with redirection
    if (this.isOffTopic(lowerMessage)) {
      return this.handleOffTopic();
    }

    // 8. Default: Encourage platform exploration
    return this.encouragePlatformExploration();
  }

  private isGreeting(message: string): boolean {
    const greetings = [
      'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon',
      'good evening', 'what\'s up', 'howdy', 'yo', 'hi there', 'hello there'
    ];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isPlatformIdentityQuestion(message: string): boolean {
    const triggers = [
      'what is', 'tell me about', 'explain', 'what does', 'how does',
      'what kind of', 'describe the', 'what is this', 'what is the elite vibe',
      'what is this platform', 'what is this website'
    ];
    return triggers.some(trigger => message.includes(trigger));
  }

  private isChatbotIdentityQuestion(message: string): boolean {
    const triggers = [
      'who are you', 'what are you', 'your name', 'who is this',
      'are you a bot', 'are you ai', 'what is your purpose',
      'what can you do', 'your capabilities'
    ];
    return triggers.some(trigger => message.includes(trigger));
  }

  private isOffTopic(message: string): boolean {
    const platformKeywords = [
      'ai', 'model', 'upload', 'buy', 'purchase', 'download', 'creator',
      'seller', 'buyer', 'explorer', 'marketplace', 'price', 'cost',
      'subscription', 'plan', 'revenue', 'earnings', 'sell', 'market',
      'elite vibe', 'platform', 'website', 'upload', 'model', 'ai model',
      'pricing', 'help', 'support', 'contact', 'about', 'terms', 'privacy'
    ];

    const hasPlatformKeyword = platformKeywords.some(keyword => 
      message.includes(keyword)
    );

    return !hasPlatformKeyword && message.length > 3;
  }

  private handleGreeting(currentUser: any): { response: string } {
    const greetings = quickResponses.greetings;
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return {
      response: randomGreeting
    };
  }

  private handlePlatformIdentity(): { response: string } {
    const responses = quickResponses.whatIsPlatform;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: randomResponse
    };
  }

  private handleChatbotIdentity(): { response: string } {
    return {
      response: `I'm ${platformKnowledge.chatbot.name}, the official AI assistant for ${platformKnowledge.identity.name}! ${platformKnowledge.chatbot.role}. ${platformKnowledge.chatbot.capabilities.join(' ')} My goal is to help you succeed on our platform! 🚀`
    };
  }

  private handleAuthenticationJourneys(message: string, currentUser: any): { response: string; action?: { type: string; data: any } } | null {
    // Seller/Creator journeys
    if (message.includes('upload') || message.includes('sell') || message.includes('create model') || message.includes('become creator')) {
      const journey = planUserJourney('upload-model', currentUser);
      if (journey) {
        return this.handleJourneyNavigation(journey, currentUser, 'upload-model');
      }
    }

    // Seller dashboard journey
    if (message.includes('seller') || message.includes('creator dashboard') || message.includes('my models') || message.includes('creator hub')) {
      const journey = planUserJourney('become-seller', currentUser);
      if (journey) {
        return this.handleJourneyNavigation(journey, currentUser, 'seller-dashboard');
      }
    }

    // Buyer dashboard journey
    if (message.includes('buyer') || message.includes('explorer') || message.includes('buyer dashboard') || message.includes('explorer hub')) {
      const journey = planUserJourney('become-buyer', currentUser);
      if (journey) {
        return this.handleJourneyNavigation(journey, currentUser, 'buyer-dashboard');
      }
    }

    // Purchases journey
    if (message.includes('purchase') || message.includes('my purchase') || message.includes('bought') || message.includes('download')) {
      const journey = planUserJourney('view-purchases', currentUser);
      if (journey) {
        return this.handleJourneyNavigation(journey, currentUser, 'view-purchases');
      }
    }

    return null;
  }

  private handleJourneyNavigation(journey: any, currentUser: any, journeyType: string): { response: string; action: { type: string; data: any } } {
    const nextStep = journey.steps[0];
    const navResult = navigateToPage(nextStep, currentUser);

    let response = '';
    
    if (navResult.requiresAuth) {
      response = navResult.authMessage || navResult.message;
    } else {
      // Create journey-specific messages with proper type checking
      const journeyMessages: Record<string, string> = {
        'upload-model': currentUser ? 
          (['seller', 'both'].includes(currentUser.role) ? 
            "Let's upload your first AI model! You'll need 4+ SFW/NSFW images and 1+ SFW/NSFW video. After upload, approve it in your dashboard to list it! 🚀" :
            "To upload models, you'll need a Creator subscription! Let me show you our plans. 💎") :
          "Ready to become an AI creator? Let's start by creating your account, then we'll set up your creator subscription and upload your first model! 🌟",
        
        'seller-dashboard': currentUser ? 
          (['seller', 'both'].includes(currentUser.role) ? 
            "Taking you to your creator dashboard! Here you can manage your models, track earnings, and approve listings. 📊" :
            "To access the creator dashboard, you'll need a Creator subscription! Let me show you our plans. 💫") :
          "The creator dashboard is where the magic happens! Let's get you signed up first, then we'll explore the creator features. 🎯",
        
        'buyer-dashboard': currentUser ? 
          "Taking you to your explorer dashboard! Here you can manage your purchases and explore new models. 🔍" :
          "The explorer dashboard is your AI model command center! Let's start by creating your account. 🚀",
        
        'view-purchases': currentUser ? 
          "Taking you to your purchases! All your downloaded models are waiting here. 📦" :
          "Your purchased models library is just a signup away! Let's get you started. 💫"
      };

      response = journeyMessages[journeyType] || navResult.message;
    }

    return {
      response: response,
      action: {
        type: 'navigate',
        data: { path: navResult.path, journey: journeyType, nextSteps: journey.steps.slice(1) }
      }
    };
  }

  private handleNavigation(message: string, currentUser: any): { response: string; action: { type: string; data: any } } | null {
    const navigationMap: { [key: string]: string } = {
      'marketplace': 'marketplace',
      'browse': 'marketplace',
      'shop': 'marketplace',
      'models': 'marketplace',
      'buy': 'marketplace',
      'purchase': 'marketplace',
      'upload': 'upload',
      'sell': 'upload',
      'create': 'upload',
      'creator': 'seller',
      'seller': 'seller',
      'dashboard': 'seller',
      'my models': 'seller',
      'buyer': 'buyer',
      'explorer': 'buyer',
      'my purchases': 'my-purchases',
      'purchases': 'my-purchases',
      'download': 'my-purchases',
      'pricing': 'pricing',
      'plans': 'pricing',
      'subscription': 'pricing',
      'price': 'pricing',
      'sign up': 'signup',
      'register': 'signup',
      'signup': 'signup',
      'login': 'login',
      'sign in': 'login',
      'about': 'about',
      'contact': 'contact',
      'support': 'contact',
      'help': 'help',
      'faq': 'help',
      'terms': 'terms',
      'privacy': 'privacy'
    };

    for (const [keyword, pageKey] of Object.entries(navigationMap)) {
      if (message.includes(keyword)) {
        const navResult = navigateToPage(pageKey, currentUser);
        
        if (navResult.requiresAuth) {
          return {
            response: navResult.authMessage || navResult.message,
            action: {
              type: 'navigate',
              data: { path: navResult.path, requiresAuth: true }
            }
          };
        }

        return {
          response: navResult.message,
          action: {
            type: 'navigate',
            data: { path: navResult.path }
          }
        };
      }
    }

    return null;
  }

  private handlePlatformQuestions(message: string, currentUser: any): { response: string } | null {
    // Upload questions with auth context
    if (message.includes('upload') || message.includes('sell') || message.includes('create model')) {
      if (!currentUser) {
        return { 
          response: "To upload AI models, you'll need to create an account first! After signing up, choose the Creator or Visionary role, then you can upload models with 4+ SFW/NSFW images and 1+ SFW/NSFW videos. Ready to start? 🚀" 
        };
      } else if (!['seller', 'both'].includes(currentUser.role)) {
        return { 
          response: "You're signed in! To upload models, you'll need a Creator subscription. Our plans start at $29.99/month with 80% revenue share. Want to see the options? 💎" 
        };
      } else {
        return { 
          response: "Ready to upload! You'll need: 4+ SFW images, 4+ NSFW images, 1+ SFW video, 1+ NSFW video. Set your price ($50+), and approve it in your dashboard after upload. Let's go! 🎯" 
        };
      }
    }

    // Seller dashboard questions
    if (message.includes('seller') || message.includes('creator dashboard')) {
      if (!currentUser) {
        return { 
          response: "The creator dashboard is where you manage your AI models and earnings! First, let's create your account and set up your creator profile. 🌟" 
        };
      } else if (!['seller', 'both'].includes(currentUser.role)) {
        return { 
          response: "The creator dashboard shows your model performance, earnings, and sales analytics! To access it, you'll need a Creator subscription. Ready to upgrade? 💫" 
        };
      } else {
        return { 
          response: "Your creator dashboard is ready! Here you can: view model statistics, track earnings, manage listings, and approve models for the marketplace. 📊" 
        };
      }
    }

    // Purchase questions
    if (message.includes('buy') || message.includes('purchase') || message.includes('how to buy')) {
      const responses = quickResponses.howToBuy;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return { response: randomResponse };
    }

    // Pricing questions
    if (message.includes('price') || message.includes('cost') || message.includes('subscription') || message.includes('plan')) {
      const responses = quickResponses.pricingInfo;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return { response: randomResponse };
    }

    // Revenue questions
    if (message.includes('revenue') || message.includes('earn') || message.includes('money') || message.includes('income')) {
      return {
        response: `Creators earn amazing revenue shares! 🤑 Starter: 80%, Pro: 85%, Enterprise: 90%! Most creators start earning within days of uploading their first model. The minimum payout is $50, processed weekly.`
      };
    }

    // Model requirements
    if (message.includes('requirement') || message.includes('need to upload') || message.includes('what do i need')) {
      return {
        response: `To upload: You'll need 4+ SFW images, 4+ NSFW images, 1+ SFW video, 1+ NSFW video. Model price starts at $50. Approval typically takes 24 hours. Ready to create? 🎨`
      };
    }

    return null;
  }

  private handleOffTopic(): { response: string } {
    const redirects = [
      "I'm specialized in helping with The Elite Vibe platform! I'd be happy to help you with AI model uploads, marketplace purchases, or any platform questions! 🚀",
      "Let's focus on your journey with The Elite Vibe! I can help you explore models, start selling, or learn about our amazing creator opportunities! 💫",
      "I'm here to help you succeed on The Elite Vibe! Want to know about uploading models, making purchases, or our subscription plans? 🎯",
      "As your Elite Vibe assistant, I'm excited to help with platform features! How can I assist with model creation, marketplace exploration, or platform guidance today? 🔥"
    ];

    return {
      response: redirects[Math.floor(Math.random() * redirects.length)]
    };
  }

  private encouragePlatformExploration(): { response: string } {
    const encouragements = [
      "The Elite Vibe has so much to offer! 🚀 Would you like to explore the marketplace, learn about creator opportunities, or check out our subscription plans?",
      "I'm excited to help you discover The Elite Vibe! 💫 Want to browse AI models, learn how to upload your own, or see our pricing plans?",
      "There's a world of AI possibilities waiting! 🎯 Shall we explore model uploads, marketplace shopping, or platform features together?",
      "Ready to dive into The Elite Vibe? 🔥 I can guide you through model creation, marketplace exploration, or help you choose the perfect subscription plan!"
    ];

    return {
      response: encouragements[Math.floor(Math.random() * encouragements.length)]
    };
  }
}