'use client';

import React from 'react';
import { AuthProvider, PaymentProvider, UploadProvider } from '@/contexts';

interface RootProviderProps {
  children: React.ReactNode;
}

export const RootProvider: React.FC<RootProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <PaymentProvider>
        <UploadProvider>
          {children}
        </UploadProvider>
      </PaymentProvider>
    </AuthProvider>
  );
};