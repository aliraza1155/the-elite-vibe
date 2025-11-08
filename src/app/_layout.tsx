import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { RootProvider } from '@/providers/RootProvider';

export const metadata: Metadata = {
  title: 'The Elite Vibe - AI Models Marketplace',
  description: 'The World\'s Largest AI Model Marketplace - Buy and sell cutting-edge AI models with secure transactions and premium quality.',
  keywords: 'AI models, marketplace, machine learning, artificial intelligence, buy AI, sell AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white dark:bg-gray-950" suppressHydrationWarning>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}