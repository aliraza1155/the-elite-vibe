import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header/>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
            About The Elite Vibe
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            The premier marketplace for AI models, connecting visionary creators with forward-thinking users worldwide.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            To democratize access to cutting-edge AI technology by creating a global marketplace 
            where creators can monetize their AI models and users can discover powerful tools 
            for their projects. We believe in empowering innovation through accessible AI solutions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                <span className="text-cyan-400">🎯</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Vision</h4>
                <p className="text-slate-400 text-sm">To be the world's most trusted AI model marketplace</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <span className="text-purple-400">💡</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Innovation</h4>
                <p className="text-slate-400 text-sm">Pushing the boundaries of AI accessibility and commerce</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-3 border border-cyan-500/30">
                <span className="text-cyan-400">🤖</span>
              </span>
              For Creators
            </h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                Monetize your AI models with up to 90% revenue share
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                Reach global audience of AI enthusiasts
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                Secure payment processing with instant payouts
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                Advanced analytics and performance insights
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 border border-purple-500/30">
                <span className="text-purple-400">🔍</span>
              </span>
              For Explorers
            </h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Discover cutting-edge AI models across all domains
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Secure transactions with quality assurance
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Regular updates and new model releases
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Premium support and community access
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Join the AI Revolution?
          </h2>
          <p className="text-slate-300 mb-6">
            Start your journey with The Elite Vibe today and be part of the future of AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
            >
              Get Started
            </Link>
            <Link 
              href="/marketplace" 
              className="border-2 border-slate-600 text-slate-300 px-8 py-3 rounded-xl hover:border-cyan-500 hover:text-cyan-400 transition-all duration-200 font-medium backdrop-blur-sm bg-slate-800/30"
            >
              Browse Models
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}