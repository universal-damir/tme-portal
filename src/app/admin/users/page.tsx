'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import UserManagementPanel from '@/components/admin/UserManagementPanel';

export default function AdminUsersPage() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }
  }, [user, isLoading, router]);

  const handleRefresh = () => {
    // Refresh function for user management panel
    window.location.reload();
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
    <AdminLayout activeTab="users" onTabChange={(tab) => router.push(`/admin${tab === 'overview' ? '' : `/${tab}`}`)}>
      <div className="p-6">
        <UserManagementPanel onRefresh={handleRefresh} />
      </div>
    </AdminLayout>
  );
}