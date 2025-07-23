'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SuspiciousActivity {
  type: string;
  user_id: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  user_name?: string;
  employee_code?: string;
  timestamp?: string;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'account_locked' | 'unusual_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  user_id?: number;
  user_name?: string;
  timestamp: string;
  acknowledged: boolean;
}

interface SecurityMonitorProps {
  detailed?: boolean;
}

export default function SecurityMonitor({ detailed = false }: SecurityMonitorProps) {
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState({
    failedLogins24h: 0,
    lockedAccounts: 0,
    unusualAccess: 0,
    adminActions24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchSecurityData();
    
    // Set up auto-refresh every 30 seconds for security monitoring
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [activitiesResponse, alertsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/security/suspicious-activities'),
        fetch('/api/admin/security/alerts'),
        fetch('/api/admin/security/stats')
      ]);

      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json();
        setSuspiciousActivities(activities.activities || []);
      }

      if (alertsResponse.ok) {
        const alerts = await alertsResponse.json();
        setSecurityAlerts(alerts.alerts || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setSecurityAlerts(prev =>
          prev.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        );
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return ShieldExclamationIcon;
      case 'medium':
        return ExclamationTriangleIcon;
      default:
        return EyeIcon;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins (24h)</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedLogins24h}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Locked Accounts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lockedAccounts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Unusual Access</p>
              <p className="text-2xl font-bold text-blue-600">{stats.unusualAccess}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Actions (24h)</p>
              <p className="text-2xl font-bold text-green-600">{stats.adminActions24h}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchSecurityData}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {securityAlerts.filter(alert => !alert.acknowledged).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <ShieldExclamationIcon className="mx-auto h-12 w-12 text-green-400" />
              <h4 className="mt-4 text-sm font-medium text-gray-900">All Clear</h4>
              <p className="mt-2 text-sm text-gray-500">No security alerts at this time.</p>
            </div>
          ) : (
            securityAlerts
              .filter(alert => !alert.acknowledged)
              .slice(0, detailed ? undefined : 5)
              .map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                const colorClass = getSeverityColor(alert.severity);
                
                return (
                  <div key={alert.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
                          <SeverityIcon className="h-4 w-4" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {alert.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                            {alert.user_name && (
                              <span className="ml-2">• {alert.user_name}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Suspicious Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Suspicious Activities</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {suspiciousActivities.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-4 text-sm font-medium text-gray-900">No Suspicious Activity</h4>
              <p className="mt-2 text-sm text-gray-500">
                No unusual patterns detected in user behavior.
              </p>
            </div>
          ) : (
            suspiciousActivities
              .slice(0, detailed ? undefined : 10)
              .map((activity, index) => {
                const SeverityIcon = getSeverityIcon(activity.severity);
                const colorClass = getSeverityColor(activity.severity);
                
                return (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
                        <SeverityIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500">{activity.details}</p>
                        {activity.user_name && (
                          <p className="text-xs text-gray-400 mt-1">
                            User: {activity.user_name} ({activity.employee_code})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}