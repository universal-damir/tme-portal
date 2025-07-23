'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import SystemHealth from '@/components/admin/SystemHealth';

export default function AdminSystemPage() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '0 days',
    cpuUsage: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (user?.role === 'admin') {
      fetchSystemHealth();
    }
  }, [user, isLoading, router]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
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
    <AdminLayout activeTab="system" onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="mt-2 text-gray-600">
              Monitor system performance and resource usage.
            </p>
          </div>
          <SystemHealth health={systemHealth} detailed={true} />
        </div>
      </div>
    </AdminLayout>
  );
}