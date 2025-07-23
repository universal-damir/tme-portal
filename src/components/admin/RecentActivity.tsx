'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  UserIcon,
  ShieldExclamationIcon,
  KeyIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface RecentActivityProps {
  activities: Activity[];
  detailed?: boolean;
}

export default function RecentActivity({ activities, detailed = false }: RecentActivityProps) {
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setDisplayedActivities(detailed ? activities : activities.slice(0, 10));
  }, [activities, detailed]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return UserIcon;
      case 'password_change':
        return KeyIcon;
      case 'profile_update':
        return EyeIcon;
      case 'admin_action':
        return ShieldExclamationIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'text-green-600 bg-green-100';
      case 'logout':
        return 'text-gray-600 bg-gray-100';
      case 'password_change':
        return 'text-blue-600 bg-blue-100';
      case 'admin_action':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAction = (action: string, details: any) => {
    switch (action) {
      case 'login':
        return 'Logged in';
      case 'logout':
        return 'Logged out';
      case 'password_change':
        return 'Changed password';
      case 'profile_update':
        return 'Updated profile';
      case 'admin_action':
        return details?.description || 'Performed admin action';
      default:
        return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (displayedActivities.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {detailed ? 'System Activity' : 'Recent Activity'}
        </h3>
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-4 text-sm font-medium text-gray-900">No activity yet</h4>
          <p className="mt-2 text-sm text-gray-500">
            User activities will appear here once they start using the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {detailed ? 'System Activity' : 'Recent Activity'}
        </h3>
        {!detailed && (
          <p className="mt-1 text-sm text-gray-500">
            Last {displayedActivities.length} activities
          </p>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {displayedActivities.map((activity) => {
          const ActivityIcon = getActivityIcon(activity.action);
          const iconColorClass = getActivityColor(activity.action);

          return (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-2 rounded-full ${iconColorClass}`}>
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatAction(activity.action, activity.details)}
                        {activity.resource && (
                          <span className="ml-1">
                            on <span className="font-medium">{activity.resource}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="mr-1 h-4 w-4" />
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                  {detailed && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span>IP: {activity.ip_address}</span>
                      {activity.user_agent && (
                        <span className="ml-4 truncate max-w-md">
                          UA: {activity.user_agent.slice(0, 50)}...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!detailed && activities.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button className="w-full flex items-center justify-center text-sm text-blue-600 hover:text-blue-500">
            View all activities
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}