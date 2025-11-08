'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { PrimaryButton } from '@/components/ui';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    urgency: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save contact form submission (in a real app, this would go to your backend)
      const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
      submissions.push({
        ...formData,
        id: `contact_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'new'
      });
      localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

      setSuccess('Thank you for your message! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
        urgency: 'normal'
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email',
      details: 'support@theelitevibe.com',
      responseTime: 'Within 24 hours',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Instant messaging support',
      details: 'Available 9AM-6PM PST',
      responseTime: 'Immediate during business hours',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Talk to our support team',
      details: '+1 (555) 123-ELITE',
      responseTime: 'Within 30 minutes',
      color: 'from-emerald-500 to-green-500'
    },
    {
      icon: '🔔',
      title: 'Status Page',
      description: 'Check platform status',
      details: 'status.theelitevibe.com',
      responseTime: 'Real-time updates',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const faqQuickLinks = [
    { question: 'How do I reset my password?', category: 'account' },
    { question: 'What are the subscription plans?', category: 'billing' },
    { question: 'How do I upload AI models?', category: 'creator' },
    { question: 'When will I receive my payout?', category: 'payouts' },
    { question: 'Can I request a refund?', category: 'billing' },
    { question: 'How to become a verified creator?', category: 'creator' }
  ];

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
            Contact Us
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Get in touch with our support team. We're here to help you succeed on The Elite Vibe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Support Channels</h2>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-slate-500 transition-all duration-200 backdrop-blur-sm"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center text-white text-lg shadow-lg`}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{method.title}</h3>
                        <p className="text-sm text-slate-300">{method.description}</p>
                        <p className="text-sm text-cyan-400 font-medium mt-1">{method.details}</p>
                        <p className="text-xs text-slate-400 mt-1">Response: {method.responseTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Help</h2>
              <div className="space-y-3">
                {faqQuickLinks.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => window.open(`/help#${item.category}`, '_blank')}
                    className="w-full text-left p-3 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 group-hover:text-white transition-colors duration-200 text-sm">
                        {item.question}
                      </span>
                      <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => window.open('/help', '_blank')}
                  className="w-full text-center py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
                >
                  Visit Help Center
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Send us a Message</h2>
              <p className="text-slate-300 mb-6">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {/* Status Messages */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-rose-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-rose-200">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-emerald-200">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      required
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="creator">Creator Support</option>
                      <option value="buyer">Buyer Support</option>
                      <option value="abuse">Report Abuse</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Urgency *
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => handleChange('urgency', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      required
                    >
                      <option value="low">Low - General question</option>
                      <option value="normal">Normal - Need help</option>
                      <option value="high">High - Urgent issue</option>
                      <option value="critical">Critical - Platform down</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
                    placeholder="Please describe your issue or question in detail..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                  <div className="flex-shrink-0 w-5 h-5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-cyan-500 bg-slate-600 border-slate-500 rounded focus:ring-cyan-500 focus:ring-2"
                      required
                    />
                  </div>
                  <p className="text-sm text-slate-300">
                    I agree to the{' '}
                    <button type="button" className="text-cyan-400 hover:text-cyan-300">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-cyan-400 hover:text-cyan-300">
                      Privacy Policy
                    </button>
                  </p>
                </div>

                <PrimaryButton
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Message...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </PrimaryButton>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="font-semibold text-white mb-2">Response Time</h3>
            <p className="text-slate-300 text-sm">
              We typically respond within 24 hours for normal inquiries and within 4 hours for urgent matters.
            </p>
          </div>
          <div className="text-center p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-semibold text-white mb-2">Global Support</h3>
            <p className="text-slate-300 text-sm">
              Our support team operates across multiple time zones to serve our global community.
            </p>
          </div>
          <div className="text-center p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold text-white mb-2">Expert Help</h3>
            <p className="text-slate-300 text-sm">
              Get assistance from AI experts and platform specialists who understand your needs.
            </p>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-6">The Elite Vibe</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="font-semibold text-cyan-400 mb-2">Headquarters</p>
              <p className="text-slate-300">San Francisco, CA</p>
              <p className="text-slate-400">United States</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400 mb-2">Business Hours</p>
              <p className="text-slate-300">Mon - Fri: 9AM - 6PM PST</p>
              <p className="text-slate-400">Weekends: Limited</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-400 mb-2">Emergency</p>
              <p className="text-slate-300">Critical Issues: 24/7</p>
              <p className="text-slate-400">Platform Outages</p>
            </div>
            <div>
              <p className="font-semibold text-amber-400 mb-2">Legal</p>
              <p className="text-slate-300">legal@theelitevibe.com</p>
              <p className="text-slate-400">DMCA & Legal</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}