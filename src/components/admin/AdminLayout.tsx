'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'overview' | 'users' | 'activity' | 'system' | 'security';
  onTabChange: (tab: 'overview' | 'users' | 'activity' | 'system' | 'security') => void;
}

const navigation = [
  { name: 'Overview', key: 'overview', icon: HomeIcon },
  { name: 'User Management', key: 'users', icon: UsersIcon },
  { name: 'Activity Logs', key: 'activity', icon: DocumentChartBarIcon },
  { name: 'System Health', key: 'system', icon: ChartBarIcon },
  { name: 'Security Monitor', key: 'security', icon: ShieldCheckIcon },
];

export default function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleBackToPortal = () => {
    router.push('/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            onBackToPortal={handleBackToPortal}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
            onBackToPortal={handleBackToPortal}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">TME Portal Administration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Logged in as <span className="font-medium">{user?.full_name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  onBackToPortal, 
  onLogout, 
  user 
}: {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onBackToPortal: () => void;
  onLogout: () => void;
  user: any;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <ShieldCheckIcon className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-lg font-bold text-gray-900">Admin Panel</span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Link
                key={item.name}
                href={`/admin${item.key === 'overview' ? '' : `/${item.key}`}`}
                className={`${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.full_name}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                Administrator
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={onBackToPortal}
              className="w-full text-left flex items-center px-2 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
              Back to Portal
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left flex items-center px-2 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}