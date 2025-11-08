'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PurchaseManager } from '@/lib/purchase-utils';
import ChatbotTrigger from './chatbot/ChatbotTrigger';

export const ClientHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    if (user) {
      const userPurchases = PurchaseManager.getUserPurchases(user.id);
      setPurchases(userPurchases);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      if (currentUser) {
        const userPurchases = PurchaseManager.getUserPurchases(currentUser.id);
        setPurchases(userPurchases);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setPurchases([]);
    router.push('/');
    setIsMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all duration-300">
                  <span className="text-white font-bold text-lg">TEV</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                  The Elite Vibe
                </h1>
                <p className="text-xs text-slate-400">AI Models Marketplace</p>
              </div>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                href="/marketplace" 
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActiveRoute('/marketplace')
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                🛍️ Marketplace
              </Link>
              
              {currentUser ? (
                <>
                  <Link 
                    href="/my-purchases" 
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 relative ${
                      isActiveRoute('/my-purchases')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    📦 My Purchases
                    {purchases.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                        {purchases.length}
                      </span>
                    )}
                  </Link>
                  
                  {(currentUser.role === 'seller' || currentUser.role === 'both') && (
                    <Link 
                      href="/seller" 
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActiveRoute('/seller')
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      🤖 Creator Hub
                    </Link>
                  )}
                  
                  {(currentUser.role === 'buyer' || currentUser.role === 'both') && (
                    <Link 
                      href="/buyer" 
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActiveRoute('/buyer')
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      🎯 Explorer Hub
                    </Link>
                  )}
                  
                  <Link 
                    href="/about" 
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActiveRoute('/about')
                        ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    ℹ️ About
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/about" 
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActiveRoute('/about')
                        ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    ℹ️ About
                  </Link>
                  <Link 
                    href="/pricing" 
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActiveRoute('/pricing')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    💎 Pricing
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="hidden md:flex items-center space-x-4">
                  {/* Upload Button for Sellers */}
                  {(currentUser.role === 'seller' || currentUser.role === 'both') && (
                    <Link 
                      href="/upload"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
                    >
                      📤 Upload
                    </Link>
                  )}

                  {/* User Profile */}
                  <div className="flex items-center space-x-3 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {getInitials(currentUser.displayName || currentUser.email)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {currentUser.role === 'both' ? 'Creator & Explorer' : currentUser.role}
                      </div>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="text-slate-300 hover:text-red-400 transition-colors font-medium text-sm hover:bg-red-500/10 px-3 py-2 rounded-xl border border-transparent hover:border-red-500/30"
                  >
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link 
                    href="/login" 
                    className="text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-xl hover:bg-slate-800/50"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
                  >
                    Get Started
                  </Link>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className={`block w-6 h-0.5 bg-slate-300 transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}></span>
                <span className={`block w-6 h-0.5 bg-slate-300 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`block w-6 h-0.5 bg-slate-300 transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}></span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
              <div className="flex flex-col space-y-3">
                <Link 
                  href="/marketplace" 
                  className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🛍️ Marketplace
                </Link>
                
                {currentUser ? (
                  <>
                    <Link 
                      href="/my-purchases" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>📦 My Purchases</span>
                      {purchases.length > 0 && (
                        <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center shadow-lg">
                          {purchases.length}
                        </span>
                      )}
                    </Link>
                    
                    {(currentUser.role === 'seller' || currentUser.role === 'both') && (
                      <Link 
                        href="/seller" 
                        className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        🤖 Creator Hub
                      </Link>
                    )}
                    
                    {(currentUser.role === 'buyer' || currentUser.role === 'both') && (
                      <Link 
                        href="/buyer" 
                        className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        🎯 Explorer Hub
                      </Link>
                    )}
                    
                    {(currentUser.role === 'seller' || currentUser.role === 'both') && (
                      <Link 
                        href="/upload"
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-center hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        📤 Upload Model
                      </Link>
                    )}
                    
                    <Link 
                      href="/about" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ℹ️ About
                    </Link>
                    
                    <Link 
                      href="/pricing" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      💎 Pricing
                    </Link>
                    
                    {/* Mobile User Info */}
                    <div className="pt-4 border-t border-slate-700/50">
                      <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {getInitials(currentUser.displayName || currentUser.email)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {currentUser.displayName || currentUser.email?.split('@')[0]}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {currentUser.role === 'both' ? 'Creator & Explorer' : currentUser.role}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium text-left border border-transparent hover:border-red-500/30"
                    >
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/about" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ℹ️ About
                    </Link>
                    <Link 
                      href="/pricing" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      💎 Pricing
                    </Link>
                    <Link 
                      href="/login" 
                      className="px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium text-center hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Chatbot Trigger - Now inside the header component */}
      <ChatbotTrigger />
    </>
  );
};