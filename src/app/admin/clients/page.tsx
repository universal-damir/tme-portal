'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientManagementPanel from '@/components/admin/ClientManagementPanel';

export default function AdminClientsPage() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }
  }, [user, isLoading, router]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout 
      activeTab="clients" 
      onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}
    >
      <div className="p-6">
        <ClientManagementPanel onRefresh={handleRefresh} key={refreshTrigger} />
      </div>
    </AdminLayout>
  );
}