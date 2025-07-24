import React, { Suspense } from 'react';
import Portal from '@/components/portal';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Portal />
    </Suspense>
  );
} 