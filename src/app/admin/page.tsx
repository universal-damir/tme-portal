'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentActivity from '@/components/admin/RecentActivity';
import SystemHealth from '@/components/admin/SystemHealth';

export default function AdminDashboard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    recentActivity: [],
    systemHealth: {
      status: 'healthy',
      uptime: '0 days',
      cpuUsage: 0,
      memoryUsage: 0,
    }
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse, healthResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recent-activity'),
        fetch('/api/admin/system-health')
      ]);

      const stats = await statsResponse.json();
      const activity = await activityResponse.json();
      const health = await healthResponse.json();

      setDashboardData({
        totalUsers: stats.totalUsers || 0,
        activeUsers: stats.activeUsers || 0,
        lockedUsers: stats.lockedUsers || 0,
        recentActivity: activity.activities || [],
        systemHealth: health || dashboardData.systemHealth
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    <AdminLayout activeTab="overview" onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.full_name}. Here&apos;s an overview of the TME Portal system.
            </p>
          </div>

          <DashboardStats
            totalUsers={dashboardData.totalUsers}
            activeUsers={dashboardData.activeUsers}
            lockedUsers={dashboardData.lockedUsers}
            onRefresh={fetchDashboardData}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity activities={dashboardData.recentActivity} />
            <SystemHealth health={dashboardData.systemHealth} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}