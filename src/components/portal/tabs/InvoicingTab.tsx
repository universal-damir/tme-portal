'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Plus, Search, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Import sections (to be created)
import { ClientManagementSection } from '@/components/invoicing/sections/ClientManagementSection';
import { InvoiceListSection } from '@/components/invoicing/sections/InvoiceListSection';
import { InvoiceCreationForm } from '@/components/invoicing/sections/InvoiceCreationForm';
import { InvoiceSummaryDashboard } from '@/components/invoicing/sections/InvoiceSummaryDashboard';
import { ManagerDashboard } from '@/components/invoicing/sections/ManagerDashboard';

// Types
import { InvoiceClient, Invoice } from '@/types/invoicing';

type ViewMode = 'dashboard' | 'clients' | 'invoices' | 'create' | 'approvals';

const InvoicingTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation buttons configuration
  const navigationButtons = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: FileText,
      color: '#243F7B'
    },
    {
      id: 'clients' as ViewMode,
      label: 'Clients',
      icon: Users,
      color: '#243F7B'
    },
    {
      id: 'invoices' as ViewMode,
      label: 'Invoices',
      icon: DollarSign,
      color: '#243F7B'
    },
    {
      id: 'approvals' as ViewMode,
      label: 'Approvals',
      icon: CheckCircle,
      color: '#f59e0b'
    },
    {
      id: 'create' as ViewMode,
      label: 'Create Invoice',
      icon: Plus,
      color: '#D2BC99'
    }
  ];

  const handleClientSelect = (client: InvoiceClient) => {
    setSelectedClient(client);
    setViewMode('create');
  };

  const handleInvoiceCreated = (invoice: Invoice) => {
    toast.success(`Invoice ${invoice.invoiceNumber} created successfully`);
    setViewMode('invoices');
    setSelectedInvoice(invoice);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return (
          <InvoiceSummaryDashboard 
            onNavigate={(mode) => setViewMode(mode)}
          />
        );
      
      case 'clients':
        return (
          <ClientManagementSection
            onClientSelect={handleClientSelect}
            onCreateInvoice={(client) => {
              setSelectedClient(client);
              setViewMode('create');
            }}
          />
        );
      
      case 'invoices':
        return (
          <InvoiceListSection
            selectedInvoice={selectedInvoice}
            onInvoiceSelect={setSelectedInvoice}
            onCreateNew={() => setViewMode('create')}
          />
        );

      case 'approvals':
        return (
          <ManagerDashboard
            onNavigate={(mode) => setViewMode(mode as ViewMode)}
          />
        );
      
      case 'create':
        return (
          <InvoiceCreationForm
            preselectedClient={selectedClient}
            onInvoiceCreated={handleInvoiceCreated}
            onCancel={() => {
              setSelectedClient(null);
              setViewMode('invoices');
            }}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2"
        style={{ borderColor: '#243F7B' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8" style={{ color: '#243F7B' }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#243F7B' }}>
                Invoice Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and track client invoices
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#243F7B' }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-500">Current Period</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-6">
          {navigationButtons.map((button) => (
            <motion.button
              key={button.id}
              onClick={() => setViewMode(button.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === button.id
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: viewMode === button.id ? button.color : 'transparent',
                borderWidth: '2px',
                borderColor: viewMode === button.id ? button.color : 'transparent'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button.icon className="w-4 h-4" />
              <span>{button.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default InvoicingTab;