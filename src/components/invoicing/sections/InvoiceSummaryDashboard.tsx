'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  DollarSign,
  FileText,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  clientCount: number;
  draftCount: number;
  pendingApprovalCount: number;
}

interface InvoiceSummaryDashboardProps {
  onNavigate: (view: 'clients' | 'invoices' | 'create') => void;
}

export const InvoiceSummaryDashboard: React.FC<InvoiceSummaryDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    clientCount: 0,
    draftCount: 0,
    pendingApprovalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/invoicing/dashboard/stats');
      // const data = await response.json();
      
      // Mock data for now
      setStats({
        totalInvoices: 42,
        totalAmount: 156780.50,
        paidAmount: 98450.25,
        outstandingAmount: 58330.25,
        overdueAmount: 12500.00,
        clientCount: 28,
        draftCount: 3,
        pendingApprovalCount: 2
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: '#243F7B',
      bgColor: '#E8F0FF',
      suffix: ` this month`,
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: '#10B981',
      bgColor: '#D1FAE5',
      trend: '+8.5%',
      trendUp: true
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats.outstandingAmount),
      icon: Clock,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      clickAction: () => onNavigate('invoices')
    },
    {
      title: 'Overdue',
      value: formatCurrency(stats.overdueAmount),
      icon: AlertCircle,
      color: '#EF4444',
      bgColor: '#FEE2E2',
      clickAction: () => onNavigate('invoices')
    }
  ];

  const quickActions = [
    {
      title: 'Create New Invoice',
      description: 'Start a new invoice for a client',
      icon: FileText,
      color: '#243F7B',
      action: () => onNavigate('create')
    },
    {
      title: 'Manage Clients',
      description: `${stats.clientCount} active clients`,
      icon: Users,
      color: '#D2BC99',
      action: () => onNavigate('clients')
    },
    {
      title: 'View All Invoices',
      description: `${stats.draftCount} drafts, ${stats.pendingApprovalCount} pending approval`,
      icon: Calendar,
      color: '#243F7B',
      action: () => onNavigate('invoices')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#243F7B' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderColor: stat.color + '40' }}
            onClick={stat.clickAction}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                {stat.suffix && (
                  <p className="text-xs text-gray-500 mt-1">{stat.suffix}</p>
                )}
                {stat.trend && (
                  <div className="flex items-center mt-2">
                    {stat.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.trend}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2" style={{ borderColor: '#243F7B20' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.action}
              className="flex items-start space-x-4 p-4 rounded-lg border-2 hover:shadow-md transition-all text-left"
              style={{ borderColor: action.color + '40' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: action.color + '10' }}
              >
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium" style={{ color: action.color }}>
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border-2"
          style={{ borderColor: '#F59E0B40' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
            Pending Actions
          </h2>
          <div className="space-y-3">
            {stats.pendingApprovalCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Pending Approval</p>
                    <p className="text-xs text-gray-600">{stats.pendingApprovalCount} invoices waiting</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-sm text-yellow-600 hover:underline"
                >
                  Review
                </button>
              </div>
            )}
            {stats.draftCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">Draft Invoices</p>
                    <p className="text-xs text-gray-600">{stats.draftCount} invoices to complete</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Complete
                </button>
              </div>
            )}
            {stats.overdueAmount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">Overdue Invoices</p>
                    <p className="text-xs text-gray-600">{formatCurrency(stats.overdueAmount)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-sm text-red-600 hover:underline"
                >
                  Follow up
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border-2"
          style={{ borderColor: '#10B98140' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
            Payment Status - {currentMonth}
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Paid</span>
                <span className="text-sm font-medium">{formatCurrency(stats.paidAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.paidAmount / stats.totalAmount) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Outstanding</span>
                <span className="text-sm font-medium">{formatCurrency(stats.outstandingAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(stats.outstandingAmount / stats.totalAmount) * 100}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Collection Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};