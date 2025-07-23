'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import SecurityMonitor from '@/components/admin/SecurityMonitor';

export default function AdminSecurityPage() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }
  }, [user, isLoading, router]);

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
    <AdminLayout activeTab="security" onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
            <p className="mt-2 text-gray-600">
              Monitor security events, suspicious activities, and system alerts.
            </p>
          </div>
          <SecurityMonitor detailed={true} />
        </div>
      </div>
    </AdminLayout>
  );
}