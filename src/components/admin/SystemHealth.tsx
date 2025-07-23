'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SystemHealthData {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage?: number;
  activeConnections?: number;
  lastBackup?: string;
}

interface SystemHealthProps {
  health: SystemHealthData;
  detailed?: boolean;
}

export default function SystemHealth({ health, detailed = false }: SystemHealthProps) {
  const [localHealth, setLocalHealth] = useState(health);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLocalHealth(health);
  }, [health]);

  const refreshHealth = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/system-health');
      const newHealth = await response.json();
      setLocalHealth(newHealth);
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationCircleIcon;
      case 'error':
        return XCircleIcon;
      default:
        return CheckCircleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-green-600';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'bg-red-500';
    if (usage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatUptime = (uptime: string) => {
    if (uptime.includes('day')) return uptime;
    
    // If uptime is in seconds, convert to readable format
    const uptimeNum = parseInt(uptime);
    if (!isNaN(uptimeNum)) {
      const days = Math.floor(uptimeNum / 86400);
      const hours = Math.floor((uptimeNum % 86400) / 3600);
      const minutes = Math.floor((uptimeNum % 3600) / 60);
      
      if (days > 0) return `${days} days, ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    
    return uptime;
  };

  const StatusIcon = getStatusIcon(localHealth.status);

  const metrics = [
    {
      name: 'CPU Usage',
      value: localHealth.cpuUsage,
      unit: '%',
      icon: CpuChipIcon,
    },
    {
      name: 'Memory Usage',
      value: localHealth.memoryUsage,
      unit: '%',
      icon: ServerIcon,
    },
    ...(detailed && localHealth.diskUsage ? [{
      name: 'Disk Usage',
      value: localHealth.diskUsage,
      unit: '%',
      icon: CircleStackIcon,
    }] : []),
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <button
            onClick={refreshHealth}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon 
              className={`-ml-0.5 mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Status */}
        <div className="flex items-center mb-6">
          <StatusIcon className={`h-8 w-8 ${getStatusColor(localHealth.status)}`} />
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900">
              System Status: {localHealth.status.charAt(0).toUpperCase() + localHealth.status.slice(1)}
            </h4>
            <p className="text-sm text-gray-500">
              Uptime: {formatUptime(localHealth.uptime)}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <metric.icon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {metric.value}{metric.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metric.value)}`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info for Detailed View */}
        {detailed && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Active Connections:</span>
                <p className="text-gray-900">{localHealth.activeConnections || 0}</p>
              </div>
              {localHealth.lastBackup && (
                <div>
                  <span className="font-medium text-gray-700">Last Backup:</span>
                  <p className="text-gray-900">
                    {new Date(localHealth.lastBackup).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}