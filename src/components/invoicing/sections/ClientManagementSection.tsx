'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  FileText,
  Building,
  Mail,
  Phone,
  MapPin,
  Filter,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { InvoiceClient } from '@/types/invoicing';
import { toast } from 'sonner';

interface ClientManagementSectionProps {
  onClientSelect?: (client: InvoiceClient) => void;
  onCreateInvoice?: (client: InvoiceClient) => void;
}

export const ClientManagementSection: React.FC<ClientManagementSectionProps> = ({
  onClientSelect,
  onCreateInvoice
}) => {
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<InvoiceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<'all' | 'DET' | 'FZCO' | 'DMCC'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<InvoiceClient | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterCompany, filterStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoicing/clients');
      const data = await response.json();
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
      // Mock data for development
      const mockClients: InvoiceClient[] = [
        {
          id: 1,
          clientCode: '10001',
          clientName: 'ABC Trading LLC',
          clientAddress: 'Dubai, UAE',
          managerName: 'John Doe',
          managerEmail: 'john@abc.com',
          vatNumber: 'VAT123456',
          annualCode: '001',
          annualCodeYear: 2024,
          issuingCompany: 'FZCO',
          isActive: true,
          isRecurring: true
        },
        {
          id: 2,
          clientCode: '10002',
          clientName: 'XYZ Consulting',
          clientAddress: 'Abu Dhabi, UAE',
          managerName: 'Jane Smith',
          managerEmail: 'jane@xyz.com',
          vatNumber: 'VAT789012',
          annualCode: '002',
          annualCodeYear: 2024,
          issuingCompany: 'DET',
          isActive: true,
          isRecurring: false
        }
      ];
      setClients(mockClients);
      setFilteredClients(mockClients);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientCode.includes(searchTerm) ||
        client.annualCode?.includes(searchTerm) ||
        client.vatNumber?.includes(searchTerm)
      );
    }

    // Company filter
    if (filterCompany !== 'all') {
      filtered = filtered.filter(client => client.issuingCompany === filterCompany);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => 
        filterStatus === 'active' ? client.isActive : !client.isActive
      );
    }

    setFilteredClients(filtered);
  };

  const handleAddClient = async (clientData: Partial<InvoiceClient>) => {
    try {
      const response = await fetch('/api/invoicing/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      
      if (response.ok) {
        const newClient = await response.json();
        setClients([...clients, newClient]);
        toast.success('Client added successfully');
        setShowAddModal(false);
      } else {
        toast.error('Failed to add client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const companyColors = {
    DET: '#243F7B',
    FZCO: '#D2BC99',
    DMCC: '#10B981'
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2" style={{ borderColor: '#243F7B20' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
            Client Management
          </h2>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#D2BC99' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Company Filter */}
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value as any)}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">All Companies</option>
            <option value="DET">DET</option>
            <option value="FZCO">FZCO</option>
            <option value="DMCC">DMCC</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600">
              {filteredClients.length} clients found
            </span>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#243F7B' }}></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm border-2 hover:shadow-md transition-all cursor-pointer"
                style={{ borderColor: companyColors[client.issuingCompany] + '40' }}
                onClick={() => onClientSelect?.(client)}
              >
                {/* Client Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: '#243F7B' }}>
                      {client.clientName}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full" 
                        style={{ 
                          backgroundColor: companyColors[client.issuingCompany] + '20',
                          color: companyColors[client.issuingCompany]
                        }}
                      >
                        {client.issuingCompany}
                      </span>
                      {client.isRecurring && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Client Code</p>
                    <p className="font-mono font-bold" style={{ color: '#243F7B' }}>
                      {client.clientCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Annual: {client.annualCode}</p>
                  </div>
                </div>

                {/* Client Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600 flex-1">{client.clientAddress}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{client.managerName}</span>
                  </div>
                  {client.managerEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{client.managerEmail}</span>
                    </div>
                  )}
                  {client.vatNumber && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{client.vatNumber}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateInvoice?.(client);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#243F7B' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Invoice
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                    }}
                    className="px-3 py-2 rounded-lg border-2 text-sm font-medium"
                    style={{ borderColor: '#243F7B', color: '#243F7B' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <AnimatePresence>
        {(showAddModal || editingClient) && (
          <ClientFormModal
            client={editingClient}
            onSave={handleAddClient}
            onClose={() => {
              setShowAddModal(false);
              setEditingClient(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Client Form Modal Component
const ClientFormModal: React.FC<{
  client?: InvoiceClient | null;
  onSave: (data: Partial<InvoiceClient>) => void;
  onClose: () => void;
}> = ({ client, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<InvoiceClient>>({
    clientName: client?.clientName || '',
    clientAddress: client?.clientAddress || '',
    managerName: client?.managerName || '',
    managerEmail: client?.managerEmail || '',
    vatNumber: client?.vatNumber || '',
    issuingCompany: client?.issuingCompany || 'FZCO',
    isActive: client?.isActive ?? true,
    isRecurring: client?.isRecurring ?? false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Client Name *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Client Address */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Client Address *
            </label>
            <textarea
              required
              value={formData.clientAddress}
              onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
              rows={3}
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manager Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Manager Name *
              </label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Manager Email */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Manager Email
              </label>
              <input
                type="email"
                value={formData.managerEmail}
                onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VAT Number */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                VAT Number
              </label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Issuing Company */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Issuing Company *
              </label>
              <select
                required
                value={formData.issuingCompany}
                onChange={(e) => setFormData({ ...formData, issuingCompany: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="DET">DET</option>
                <option value="FZCO">FZCO</option>
                <option value="DMCC">DMCC</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#243F7B' }}
              />
              <span className="text-sm">Active Client</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#243F7B' }}
              />
              <span className="text-sm">Recurring Invoice</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border-2 font-medium"
              style={{ borderColor: '#243F7B', color: '#243F7B' }}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#243F7B' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {client ? 'Update Client' : 'Add Client'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};