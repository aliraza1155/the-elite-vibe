'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import { UserManager } from '@/lib/user-utils';
import { userService } from '@/lib/firebase';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'seller' | 'both'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user) {
      if (user.role === 'seller' || user.role === 'both') {
        router.push('/seller');
      } else {
        router.push('/buyer');
      }
    }
  }, [router]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Client-side validation
      const usernameValidation = UserManager.validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        setError(usernameValidation.errors[0]);
        setLoading(false);
        return;
      }

      const emailValidation = UserManager.validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setError(emailValidation.errors[0]);
        setLoading(false);
        return;
      }

      const passwordValidation = UserManager.validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors[0]);
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Check for existing users in Firestore
      const existingEmail = await userService.findUserByEmail(formData.email);
      if (existingEmail) {
        setError('An account with this email already exists');
        setLoading(false);
        return;
      }

      const existingUsername = await userService.findUserByUsername(formData.username);
      if (existingUsername) {
        setError('Username already taken');
        setLoading(false);
        return;
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = {
        id: userId,
        username: formData.username,
        displayName: formData.displayName || formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          displayName: formData.displayName || formData.username,
          ageVerified: false,
          bio: '',
          profilePicture: ''
        },
        stats: {
          totalListings: 0,
          totalSales: 0,
          rating: 0,
          totalPurchases: 0
        },
        earnings: formData.role === 'seller' || formData.role === 'both' ? {
          total: 0,
          available: 0,
          pending: 0,
          paidOut: 0
        } : undefined,
        subscription: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to Firestore
      await userService.createUser(user);
      console.log('✅ User saved to Firestore');

      // Create session without password for security
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      setSuccess('Account created successfully! Redirecting...');

      setTimeout(() => {
        if (formData.role === 'seller' || formData.role === 'both') {
          router.push('/seller');
        } else {
          router.push('/buyer');
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Signup error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <span className="text-white font-bold text-xl">TEV</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
            Join The Elite Vibe
          </h1>
          <p className="text-lg text-cyan-100/80 max-w-2xl mx-auto">
            Create your account and dive into the future of AI model marketplace
          </p>
        </div>

        {/* Signup Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8">
            {/* Floating Elements */}
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-cyan-400 rounded-full blur-sm animate-ping"></div>
            <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-purple-400 rounded-full blur-sm animate-ping delay-700"></div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Username & Display Name */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-100">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="Choose a unique username"
                    required
                  />
                  <p className="text-xs text-slate-300">
                    3-20 characters, letters, numbers, underscores
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-100">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="How you'll appear to others"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-100">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-100">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm pr-10"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    8+ chars with uppercase, lowercase, number, special
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-100">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm pr-10"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Type Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-cyan-100">
                  Choose Your Path *
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Buyer Card */}
                  <button
                    type="button"
                    onClick={() => handleChange('role', 'buyer')}
                    className={`p-4 sm:p-6 border-2 rounded-2xl text-center transition-all duration-300 backdrop-blur-sm ${
                      formData.role === 'buyer'
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-2xl shadow-cyan-500/20 transform scale-105'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-3">🛒</div>
                    <p className="font-semibold text-white text-base sm:text-lg mb-2">Explorer</p>
                    <p className="text-xs sm:text-sm text-slate-300 mb-3">
                      Discover and purchase AI models
                    </p>
                    <div className="space-y-1 text-xs text-cyan-300">
                      <p>• Browse marketplace</p>
                      <p>• Purchase models</p>
                      <p>• Download content</p>
                    </div>
                  </button>
                  
                  {/* Seller Card */}
                  <button
                    type="button"
                    onClick={() => handleChange('role', 'seller')}
                    className={`p-4 sm:p-6 border-2 rounded-2xl text-center transition-all duration-300 backdrop-blur-sm ${
                      formData.role === 'seller'
                        ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20 transform scale-105'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-3">🤖</div>
                    <p className="font-semibold text-white text-base sm:text-lg mb-2">Creator</p>
                    <p className="text-xs sm:text-sm text-slate-300 mb-3">
                      Build and sell AI models
                    </p>
                    <div className="space-y-1 text-xs text-purple-300">
                      <p>• Upload models</p>
                      <p>• Earn revenue</p>
                      <p>• Build portfolio</p>
                    </div>
                  </button>

                  {/* Both Card */}
                  <button
                    type="button"
                    onClick={() => handleChange('role', 'both')}
                    className={`p-4 sm:p-6 border-2 rounded-2xl text-center transition-all duration-300 backdrop-blur-sm ${
                      formData.role === 'both'
                        ? 'border-blue-500 bg-blue-500/10 shadow-2xl shadow-blue-500/20 transform scale-105'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-3">🚀</div>
                    <p className="font-semibold text-white text-base sm:text-lg mb-2">Visionary</p>
                    <p className="text-xs sm:text-sm text-slate-300 mb-3">
                      Complete marketplace experience
                    </p>
                    <div className="space-y-1 text-xs text-blue-300">
                      <p>• Buy & sell models</p>
                      <p>• Full access</p>
                      <p>• Maximum flexibility</p>
                    </div>
                  </button>
                </div>

                {/* Role Description */}
                <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <h4 className="font-semibold text-cyan-100 mb-2 text-sm sm:text-base">
                    What you'll get as {formData.role === 'buyer' ? 'Explorer' : formData.role === 'seller' ? 'Creator' : 'Visionary'}:
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                    {formData.role === 'buyer' && (
                      <>
                        <p>• Access to browse and purchase AI models</p>
                        <p>• Download purchased models instantly</p>
                        <p>• Save favorite models for later</p>
                        <p>• Basic customer support</p>
                      </>
                    )}
                    {formData.role === 'seller' && (
                      <>
                        <p>• Upload and list your AI models for sale</p>
                        <p>• Earn 85% revenue from each sale</p>
                        <p>• Track sales and earnings in real-time</p>
                        <p>• Access to seller analytics dashboard</p>
                        <p className="text-amber-400 font-medium">• Subscription required for model listings</p>
                      </>
                    )}
                    {formData.role === 'both' && (
                      <>
                        <p>• Full access to browse and purchase models</p>
                        <p>• Upload and sell your own AI models</p>
                        <p>• Earn revenue from your creations</p>
                        <p>• Complete marketplace experience</p>
                        <p className="text-amber-400 font-medium">• Subscription required for model listings</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Create Account Button */}
              <div className="pt-4">
                <PrimaryButton
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-cyan-500/25 text-base sm:text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    `Become ${formData.role === 'both' ? 'Visionary' : formData.role === 'seller' ? 'Creator' : 'Explorer'}`
                  )}
                </PrimaryButton>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-4 border-t border-slate-700/50">
                <p className="text-slate-300 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-200 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>

              {/* Terms */}
              <div className="border-t border-slate-700/50 pt-4">
                <p className="text-xs text-slate-400 text-center">
                  By creating an account, you agree to our{' '}
                  <button className="text-cyan-400 hover:text-cyan-300">Terms of Service</button>
                  {' '}and{' '}
                  <button className="text-cyan-400 hover:text-cyan-300">Privacy Policy</button>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <div className="text-center p-4 sm:p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="font-semibold text-white text-sm sm:text-base mb-2">Secure Platform</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Enterprise-grade security for your data and transactions
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-2xl mb-3">💸</div>
            <h3 className="font-semibold text-white text-sm sm:text-base mb-2">Fair Earnings</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Sellers keep 85% revenue with transparent payouts
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl shadow-lg">
            <div className="text-2xl mb-3">🌍</div>
            <h3 className="font-semibold text-white text-sm sm:text-base mb-2">Global Network</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Connect with AI creators and enthusiasts worldwide
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            © 2024 The Elite Vibe. Next-generation AI marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}