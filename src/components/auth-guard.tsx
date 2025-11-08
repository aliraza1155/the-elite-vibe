'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSeller?: boolean;
  requireAdmin?: boolean; // Added
  requireSubscription?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  requireSeller = false,
  requireAdmin = false, // Added
  requireSubscription = false,
  redirectTo = '/login'
}) => {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Check authentication
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isClient || loading) return;

    if (requireAuth && !currentUser) {
      router.push(redirectTo);
      return;
    }

    if (requireSeller && currentUser && currentUser.role !== 'seller' && currentUser.role !== 'both') {
      router.push('/buyer');
      return;
    }

    // Added admin check
    if (requireAdmin && currentUser && currentUser.role !== 'admin') {
      router.push('/');
      return;
    }

    if (requireSubscription && currentUser && currentUser.role === 'seller') {
      const hasActiveSubscription = currentUser.subscription?.status === 'active';
      if (!hasActiveSubscription) {
        router.push('/pricing');
        return;
      }
    }
  }, [isClient, currentUser, loading, requireAuth, requireSeller, requireAdmin, requireSubscription, redirectTo, router]);

  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};