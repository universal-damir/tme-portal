'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import RecentActivity from '@/components/admin/RecentActivity';

export default function AdminActivityPage() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (user?.role === 'admin') {
      fetchActivities();
    }
  }, [user, isLoading, router]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/recent-activity?limit=100');
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
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
    <AdminLayout activeTab="activity" onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Activity</h1>
            <p className="mt-2 text-gray-600">
              Monitor all user activities and system events.
            </p>
          </div>
          <RecentActivity activities={activities} detailed={true} />
        </div>
      </div>
    </AdminLayout>
  );
}