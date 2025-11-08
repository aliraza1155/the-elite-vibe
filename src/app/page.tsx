import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                The World's Largest{' '}
              </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AI Model Marketplace
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-4xl mx-auto leading-relaxed">
              Discover, buy, and sell cutting-edge AI models in a secure, premium marketplace. 
              Join thousands of creators and innovators shaping the future of artificial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/marketplace" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
              >
                🚀 Explore Models
              </Link>
              <Link 
                href="/signup" 
                className="border-2 border-slate-600 text-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-cyan-500 hover:text-cyan-400 transition-all duration-200 backdrop-blur-sm bg-slate-800/30"
              >
                💎 Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
              Why Choose The Elite Vibe?
            </h2>
            <p className="text-xl text-slate-300">Premium features for creators and explorers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-cyan-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Encrypted</h3>
              <p className="text-slate-300">Bank-level security with end-to-end encryption for all transactions and data.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-purple-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-slate-300">High-performance platform with instant uploads and downloads powered by edge computing.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Global Community</h3>
              <p className="text-slate-300">Join thousands of AI enthusiasts, developers, and creators from around the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Value Proposition Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
              Built for Everyone in AI
            </h2>
            <p className="text-xl text-slate-300">Whether you're exploring AI or building the future</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Buyers */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">For AI Explorers</h3>
                <p className="text-slate-300">Discover and leverage cutting-edge AI models</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mt-1 border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Instant Access</h4>
                    <p className="text-slate-400 text-sm">Download purchased models immediately with no restrictions</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mt-1 border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Quality Guaranteed</h4>
                    <p className="text-slate-400 text-sm">Every model verified for performance and reliability</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mt-1 border border-cyan-500/30">
                    <span className="text-cyan-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Free Exploration</h4>
                    <p className="text-slate-400 text-sm">Browse and discover models without any subscription required</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/marketplace" 
                  className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
                >
                  Start Exploring
                </Link>
              </div>
            </div>

            {/* For Sellers */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">For AI Creators</h3>
                <p className="text-slate-300">Monetize your AI innovations and reach global audience</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1 border border-purple-500/30">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">High Revenue Share</h4>
                    <p className="text-slate-400 text-sm">Keep up to 90% of your earnings with our premium plans</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1 border border-purple-500/30">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Upload Unlimited</h4>
                    <p className="text-slate-400 text-sm">Start uploading models immediately - subscription only needed for marketplace listing</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1 border border-purple-500/30">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Global Exposure</h4>
                    <p className="text-slate-400 text-sm">Reach thousands of potential buyers worldwide</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/upload" 
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
                >
                  Start Creating
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-12">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join the AI Revolution?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start buying or selling AI models today. Join our premium marketplace and take your AI projects to the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              🚀 Create Account
            </Link>
            <Link 
              href="/marketplace" 
              className="border-2 border-slate-600 text-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-cyan-500 hover:text-cyan-400 transition-all duration-200 backdrop-blur-sm bg-slate-800/30"
            >
              🔍 Browse Models
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}