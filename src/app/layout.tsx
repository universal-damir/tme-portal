import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ClientProvider } from '@/components/providers/ClientProvider';

export const metadata: Metadata = {
  title: 'TME Portal v5.1',
  description: 'Professional UAE Business Setup Services Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans">
        <ClientProvider>
          {children}
        </ClientProvider>
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
        />
      </body>
    </html>
  );
} 