'use client';

import { useState } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  LockClosedIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  onRefresh: () => void;
}

interface StatCard {
  name: string;
  value: number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

export default function DashboardStats({ 
  totalUsers, 
  activeUsers, 
  lockedUsers, 
  onRefresh 
}: DashboardStatsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const stats: StatCard[] = [
    {
      name: 'Total Users',
      value: totalUsers,
      icon: UsersIcon,
      color: 'blue',
    },
    {
      name: 'Active Users',
      value: activeUsers,
      icon: UserGroupIcon,
      color: 'green',
    },
    {
      name: 'Locked Accounts',
      value: lockedUsers,
      icon: LockClosedIcon,
      color: 'red',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 text-blue-600',
      green: 'bg-green-500 text-green-600', 
      red: 'bg-red-500 text-red-600',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon 
            className={`-ml-0.5 mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const colorClasses = getColorClasses(stat.color);
          return (
            <div
              key={stat.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${colorClasses.split(' ')[0]}`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
                {stat.change && (
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase'
                        ? 'text-green-600'
                        : stat.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {stat.change}
                  </p>
                )}
              </dd>
            </div>
          );
        })}
      </div>
    </div>
  );
}