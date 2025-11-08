'use client';

import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
  tags: string[];
}

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [faqData, setFaqData] = useState<FAQItem[]>([]);

  useEffect(() => {
    // Load FAQ data
    const faqs: FAQItem[] = [
      // Account & Registration
      {
        id: 'account-1',
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top navigation. Choose your role (Explorer, Creator, or Visionary), fill in your details, and verify your email address. You\'ll have immediate access to the platform based on your selected role.',
        category: 'account',
        popularity: 95,
        tags: ['signup', 'registration', 'account']
      },
      {
        id: 'account-2',
        question: 'Can I change my account type later?',
        answer: 'Yes! You can upgrade from Explorer to Creator or Visionary at any time. Go to your dashboard and click "Upgrade Plan" to access additional features. Downgrading may affect your active listings.',
        category: 'account',
        popularity: 78,
        tags: ['upgrade', 'downgrade', 'account-type']
      },
      {
        id: 'account-3',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. The link expires in 1 hour for security reasons.',
        category: 'account',
        popularity: 82,
        tags: ['password', 'security', 'login']
      },

      // Subscription & Billing
      {
        id: 'billing-1',
        question: 'What subscription plans are available?',
        answer: 'We offer Explorer (free), Creator ($29.99/month), Pro Creator ($79.99/month), and Enterprise ($199.99/month) plans. Each plan offers different features, revenue shares, and model limits.',
        category: 'billing',
        popularity: 88,
        tags: ['pricing', 'plans', 'subscription']
      },
      {
        id: 'billing-2',
        question: 'How do I cancel my subscription?',
        answer: 'Go to your dashboard → Subscription settings → Cancel Subscription. Your access will continue until the end of your billing period. No partial refunds are provided.',
        category: 'billing',
        popularity: 65,
        tags: ['cancel', 'refund', 'billing']
      },
      {
        id: 'billing-3',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards through Stripe. Currently, we support Visa, MasterCard, American Express, and Discover. Crypto payments are coming soon!',
        category: 'billing',
        popularity: 72,
        tags: ['payment', 'stripe', 'credit-card']
      },

      // Creator & Uploading
      {
        id: 'creator-1',
        question: 'How do I upload my first AI model?',
        answer: '1. Go to your Creator Dashboard 2. Click "Upload New Model" 3. Fill in model details (name, description, price) 4. Upload SFW/NSFW images and videos 5. Set your price (minimum $50) 6. Submit for approval. Models are typically approved within 24 hours.',
        category: 'creator',
        popularity: 92,
        tags: ['upload', 'model', 'first-time']
      },
      {
        id: 'creator-2',
        question: 'What are the file requirements for uploads?',
        answer: '• SFW Images: Minimum 4 images, max 50MB each\n• NSFW Images: Minimum 4 images, max 50MB each\n• SFW Videos: Minimum 1 video, max 500MB each\n• NSFW Videos: Minimum 1 video, max 500MB each\n• Supported formats: JPEG, PNG, WebP, MP4, WebM',
        category: 'creator',
        popularity: 85,
        tags: ['files', 'requirements', 'upload']
      },
      {
        id: 'creator-3',
        question: 'How long does model approval take?',
        answer: 'Typically 12-24 hours. Our team reviews each model for quality, appropriateness, and compliance with our guidelines. You\'ll receive an email notification once approved.',
        category: 'creator',
        popularity: 76,
        tags: ['approval', 'moderation', 'waiting']
      },

      // Sales & Payouts
      {
        id: 'payouts-1',
        question: 'When will I receive my earnings?',
        answer: 'Earnings are available for payout once they reach $50. Payouts are processed weekly every Friday. It may take 3-5 business days to reach your account depending on your payment method.',
        category: 'payouts',
        popularity: 90,
        tags: ['earnings', 'money', 'payout']
      },
      {
        id: 'payouts-2',
        question: 'What is the revenue share for creators?',
        answer: '• Starter Plan: 80% revenue share\n• Pro Plan: 85% revenue share\n• Enterprise Plan: 90% revenue share\nPlatform commission covers payment processing, hosting, and maintenance costs.',
        category: 'payouts',
        popularity: 88,
        tags: ['revenue', 'commission', 'earnings']
      },
      {
        id: 'payouts-3',
        question: 'How do I request a payout?',
        answer: '1. Go to your Creator Dashboard 2. Navigate to Earnings & Payouts 3. Enter the amount (minimum $50) 4. Click "Request Payout" 5. Confirm your payment details. Payouts are sent via Stripe.',
        category: 'payouts',
        popularity: 79,
        tags: ['withdraw', 'payout', 'money']

      },
      // Buying & Downloads
      {
        id: 'buyer-1',
        question: 'How do I purchase an AI model?',
        answer: '1. Browse the marketplace 2. Click on a model to view details 3. Click "Buy Now" 4. Complete payment through Stripe 5. Download immediately from "My Purchases". All purchases are instant and available for lifetime access.',
        category: 'buyer',
        popularity: 84,
        tags: ['purchase', 'buy', 'download']
      },
      {
        id: 'buyer-2',
        question: 'Can I get a refund for a purchased model?',
        answer: 'Due to the digital nature of AI models, we generally do not offer refunds. However, if a model is significantly different from its description or doesn\'t work as advertised, contact support within 7 days of purchase.',
        category: 'buyer',
        popularity: 68,
        tags: ['refund', 'money-back', 'guarantee']
      },
      {
        id: 'buyer-3',
        question: 'Where can I find my purchased models?',
        answer: 'All your purchased models are available in "My Purchases" section. You can download them anytime, and they never expire. Each model includes its license terms for usage.',
        category: 'buyer',
        popularity: 75,
        tags: ['downloads', 'library', 'purchases']
      },

      // Technical Issues
      {
        id: 'technical-1',
        question: 'The upload is stuck or very slow',
        answer: 'Try these solutions:\n• Check your internet connection\n• Use our ultra-fast uploader with background support\n• Compress large files before uploading\n• Try during off-peak hours\n• Contact support if issue persists',
        category: 'technical',
        popularity: 71,
        tags: ['upload', 'slow', 'technical']
      },
      {
        id: 'technical-2',
        question: 'I can\'t log in to my account',
        answer: '• Ensure you\'re using the correct email and password\n• Try resetting your password\n• Clear your browser cache and cookies\n• Try a different browser or incognito mode\n• Check if your subscription is active',
        category: 'technical',
        popularity: 63,
        tags: ['login', 'access', 'technical']
      },
      {
        id: 'technical-3',
        question: 'Payment failed but I was charged',
        answer: 'Sometimes payments get stuck in pending state. Contact our support team with your transaction ID and we\'ll investigate immediately. Most issues are resolved within 2 hours.',
        category: 'technical',
        popularity: 59,
        tags: ['payment', 'failed', 'technical']
      }
    ];
    setFaqData(faqs);
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', count: faqData.length, icon: '📚' },
    { id: 'account', name: 'Account & Registration', count: faqData.filter(f => f.category === 'account').length, icon: '👤' },
    { id: 'billing', name: 'Subscription & Billing', count: faqData.filter(f => f.category === 'billing').length, icon: '💳' },
    { id: 'creator', name: 'Creator Guide', count: faqData.filter(f => f.category === 'creator').length, icon: '🤖' },
    { id: 'payouts', name: 'Sales & Payouts', count: faqData.filter(f => f.category === 'payouts').length, icon: '💰' },
    { id: 'buyer', name: 'Buying & Downloads', count: faqData.filter(f => f.category === 'buyer').length, icon: '🛒' },
    { id: 'technical', name: 'Technical Issues', count: faqData.filter(f => f.category === 'technical').length, icon: '🔧' }
  ];

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const popularFaqs = [...faqData].sort((a, b) => b.popularity - a.popularity).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
            Help Center
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Find answers to common questions and learn how to make the most of The Elite Vibe.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for answers... (e.g., 'upload', 'payout', 'subscription')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-lg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                🔍
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Help Center Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Articles</span>
                    <span>{faqData.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Updated</span>
                    <span>Today</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Success Rate</span>
                    <span className="text-emerald-400">98%</span>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-sm text-cyan-300 mb-3">
                  Can't find what you're looking for?
                </p>
                <Link href="/contact">
                  <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-xl text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25">
                    Contact Support
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Popular Questions */}
            {searchTerm === '' && activeCategory === 'all' && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">🔥</span>
                  Popular Questions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {popularFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => toggleItem(faq.id)}
                      className="text-left p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all duration-200 backdrop-blur-sm group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-slate-300 group-hover:text-white transition-colors duration-200 text-sm font-medium">
                          {faq.question}
                        </span>
                        <span className={`text-cyan-400 transition-transform duration-200 ${
                          expandedItems.has(faq.id) ? 'rotate-180' : ''
                        }`}>
                          ↓
                        </span>
                      </div>
                      {expandedItems.has(faq.id) && (
                        <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                          <p className="text-slate-300 text-sm whitespace-pre-line">{faq.answer}</p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {faq.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-slate-600/50 text-slate-400 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ List */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {activeCategory === 'all' ? 'All Questions' : categories.find(c => c.id === activeCategory)?.name}
                </h2>
                <span className="text-slate-400 text-sm">
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-slate-400 mb-6">
                    Try different search terms or browse the categories.
                  </p>
                  <button
                    onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/70 transition-all duration-200 backdrop-blur-sm"
                    >
                      <button
                        onClick={() => toggleItem(faq.id)}
                        className="w-full text-left p-6 bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {faq.question}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-400">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                                {faq.popularity}% helpful
                              </span>
                              <span>•</span>
                              <span>{categories.find(c => c.id === faq.category)?.name}</span>
                            </div>
                          </div>
                          <span className={`text-cyan-400 text-2xl transition-transform duration-200 ml-4 ${
                            expandedItems.has(faq.id) ? 'rotate-180' : ''
                          }`}>
                            ↓
                          </span>
                        </div>
                      </button>
                      
                      {expandedItems.has(faq.id) && (
                        <div className="p-6 bg-slate-700/20 border-t border-slate-700/50">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
                            {faq.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-slate-600/50 text-slate-300 text-sm rounded-full border border-slate-500/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                            <span className="text-sm text-slate-400">
                              Was this helpful?
                            </span>
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors duration-200">
                                👍 Yes
                              </button>
                              <button className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm hover:bg-rose-500/30 transition-colors duration-200">
                                👎 No
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Resources */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-white mb-2">Creator Academy</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Learn how to create, price, and market your AI models effectively.
                </p>
                <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
                  Explore Guides →
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl mb-4">🎥</div>
                <h3 className="text-lg font-semibold text-white mb-2">Video Tutorials</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Watch step-by-step tutorials for common tasks and features.
                </p>
                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200">
                  Watch Videos →
                </button>
              </div>
            </div>

            {/* Still Need Help */}
            <div className="mt-8 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-white mb-2">Still need help?</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Our support team is ready to assist you with any questions or issues you might have.
                We typically respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25">
                    Contact Support
                  </button>
                </Link>
                <button className="border-2 border-slate-600 text-slate-300 px-8 py-3 rounded-xl hover:border-cyan-500 hover:text-cyan-400 transition-all duration-200 font-medium backdrop-blur-sm bg-slate-800/30">
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}