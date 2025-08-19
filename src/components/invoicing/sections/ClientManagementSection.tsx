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
  X,
  Trash2,
  Grid,
  List
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterCompany, filterStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoicing/clients', {
        credentials: 'same-origin'
      });
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

  const handleAddClient = async (clientData: Partial<InvoiceClient>, isEdit: boolean = false) => {
    try {
      if (isEdit && editingClient) {
        // Update existing client
        const response = await fetch(`/api/invoicing/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(clientData)
        });
        
        if (response.ok) {
          toast.success('Client updated successfully');
          setEditingClient(null);
          // Force refresh all clients to ensure consistency
          await fetchClients();
        } else {
          const error = await response.json();
          if (error.error?.includes('Client code') && error.error?.includes('already in use')) {
            toast.error('Client code already in use by another client. Please use a different 5-digit code.');
          } else if (error.error?.includes('Annual code') && error.error?.includes('already in use')) {
            toast.error('Annual invoice code already assigned to another client this year. Please use a different 3-digit code.');
          } else {
            toast.error(error.error || 'Failed to update client');
          }
        }
      } else {
        // Create new client
        const response = await fetch('/api/invoicing/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(clientData)
        });
        
        if (response.ok) {
          const newClient = await response.json();
          setClients(prevClients => [...prevClients, newClient]);
          // Trigger re-filter to include the new client
          setFilteredClients(prevFiltered => {
            // Apply current filters to the new list
            let newList = [...clients, newClient];
            if (searchTerm) {
              newList = newList.filter(client =>
                client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.clientCode.includes(searchTerm) ||
                client.annualCode?.includes(searchTerm) ||
                client.vatNumber?.includes(searchTerm)
              );
            }
            if (filterCompany !== 'all') {
              newList = newList.filter(client => client.issuingCompany === filterCompany);
            }
            if (filterStatus !== 'all') {
              newList = newList.filter(client => 
                filterStatus === 'active' ? client.isActive : !client.isActive
              );
            }
            return newList;
          });
          toast.success('Client added successfully');
          setShowAddModal(false);
        } else {
          const error = await response.json();
          if (error.error?.includes('Client code') && error.error?.includes('already exists')) {
            toast.error('Client code already in use. Please use a different 5-digit code.');
          } else if (error.error?.includes('Annual code') && error.error?.includes('already used')) {
            toast.error('Annual invoice code already in use for this year. Please use a different 3-digit code.');
          } else {
            toast.error(error.error || 'Failed to add client');
          }
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
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

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <motion.button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Grid className="w-4 h-4" style={{ color: viewMode === 'grid' ? '#243F7B' : '#9CA3AF' }} />
              <span className="text-sm font-medium" style={{ color: viewMode === 'grid' ? '#243F7B' : '#9CA3AF' }}>
                Grid
              </span>
            </motion.button>
            <motion.button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <List className="w-4 h-4" style={{ color: viewMode === 'list' ? '#243F7B' : '#9CA3AF' }} />
              <span className="text-sm font-medium" style={{ color: viewMode === 'list' ? '#243F7B' : '#9CA3AF' }}>
                List
              </span>
            </motion.button>
          </div>
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

      {/* Clients Display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#243F7B' }}></div>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
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
                    <p className="text-xs text-gray-500 mt-1">Annual Invoice: {client.annualCode}</p>
                  </div>
                </div>

                {/* Client Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-gray-600 flex-1">
                      {client.clientAddress.split('\n').map((line, idx) => {
                        // Clean up duplicated P.O. Box prefix
                        let cleanLine = line.trim();
                        if (cleanLine.match(/^P\.?O\.?\s*Box\s+P\.?O\.?\s*Box\s+/i)) {
                          cleanLine = cleanLine.replace(/^P\.?O\.?\s*Box\s+/i, '');
                        }
                        return (
                          <div key={idx} className="leading-relaxed">
                            {cleanLine}
                          </div>
                        );
                      })}
                    </div>
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
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-sm border-2" style={{ borderColor: '#243F7B20' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ backgroundColor: '#243F7B10' }}>
                  <th className="text-left px-6 py-4 text-sm font-semibold w-1/4" style={{ color: '#243F7B' }}>
                    Client
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-semibold" style={{ color: '#243F7B' }}>
                    Company
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-semibold" style={{ color: '#243F7B' }}>
                    Manager
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-semibold whitespace-nowrap" style={{ color: '#243F7B' }}>
                    VAT Number
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-semibold" style={{ color: '#243F7B' }}>
                    Annual<br/>Invoice Code
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-semibold" style={{ color: '#243F7B' }}>
                    Status
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-semibold" style={{ color: '#243F7B' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredClients
                    .sort((a, b) => a.clientCode.localeCompare(b.clientCode))
                    .map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => onClientSelect?.(client)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold" style={{ color: '#243F7B' }}>
                              {client.clientCode} {client.clientName}
                            </p>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                              {client.clientAddress.split('\n').map((line, idx) => {
                                // Clean up duplicated P.O. Box prefix
                                let cleanLine = line.trim();
                                if (cleanLine.match(/^P\.?O\.?\s*Box\s+P\.?O\.?\s*Box\s+/i)) {
                                  cleanLine = cleanLine.replace(/^P\.?O\.?\s*Box\s+/i, '');
                                }
                                return <div key={idx}>{cleanLine}</div>;
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span 
                            className="text-xs px-2 py-1 rounded-full inline-block"
                            style={{ 
                              backgroundColor: companyColors[client.issuingCompany] + '20',
                              color: companyColors[client.issuingCompany]
                            }}
                          >
                            {client.issuingCompany}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{client.managerName}</p>
                            {client.managerEmail && (
                              <p className="text-gray-500 text-xs">{client.managerEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {client.vatNumber || '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono text-sm font-semibold">{client.annualCode}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            {client.isActive ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Active
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                Inactive
                              </span>
                            )}
                            {client.isRecurring && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                Recurring
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateInvoice?.(client);
                              }}
                              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                              style={{ backgroundColor: '#243F7B' }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Create Invoice
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClient(client);
                              }}
                              className="p-1.5 rounded-lg border"
                              style={{ borderColor: '#243F7B', color: '#243F7B' }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
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
  onSave: (data: Partial<InvoiceClient>, isEdit: boolean) => void;
  onClose: () => void;
}> = ({ client, onSave, onClose }) => {
  // Parse existing address into components
  const parseAddress = (address: string | undefined) => {
    if (!address) return { line1: '', line2: '', poBox: '', city: '', country: 'UAE' };
    const lines = address.split('\n').filter(Boolean);
    
    let line1 = '';
    let line2 = '';
    let poBox = '';
    let city = '';
    let country = 'UAE';
    
    let lineIndex = 0;
    
    // Parse each line carefully
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^P\.?O\.?\s*Box\s+/i)) {
        // This is a PO Box line
        poBox = line.replace(/^P\.?O\.?\s*Box\s+/i, '').trim();
      } else if (line.includes(',') && i >= lines.length - 2) {
        // This looks like "City, Country" line (usually near the end)
        const parts = line.split(',').map(p => p.trim());
        city = parts[0];
        if (parts[1]) {
          country = parts[1];
        }
      } else if (i === lines.length - 1 && !city) {
        // Last line, might be city or country
        const countryList = ['UAE', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Jordan', 'Lebanon', 'India', 'Pakistan'];
        if (countryList.some(c => line.toLowerCase().includes(c.toLowerCase()))) {
          country = line;
        } else {
          city = line;
        }
      } else {
        // Regular address lines
        if (!line1) {
          line1 = line;
        } else if (!line2 && !line.match(/^P\.?O\.?\s*Box\s+/i)) {
          line2 = line;
        }
      }
    }
    
    return { line1, line2, poBox, city, country };
  };

  // Build full address from components
  const buildAddress = (data: any) => {
    const parts = [];
    if (data.addressLine1) parts.push(data.addressLine1);
    if (data.addressLine2) parts.push(data.addressLine2);
    if (data.poBox) parts.push(`P.O. Box ${data.poBox}`);
    if (data.city && data.country) {
      parts.push(`${data.city}, ${data.country}`);
    } else if (data.city) {
      parts.push(data.city);
    } else if (data.country) {
      parts.push(data.country);
    }
    return parts.join('\n');
  };

  const addressParts = parseAddress(client?.clientAddress);
  
  const [clientCodeError, setClientCodeError] = useState<string>('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeCheckTimeout, setCodeCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Check for duplicate client code with debouncing
  const checkDuplicateCode = async (code: string) => {
    if (!code || code.length !== 5) {
      setClientCodeError('');
      return;
    }
    
    // Don't check if it's the same as the original code
    if (client && client.clientCode === code) {
      setClientCodeError('');
      return;
    }
    
    setCheckingCode(true);
    try {
      const response = await fetch('/api/invoicing/clients?searchTerm=' + code, {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      const duplicate = data.clients?.find((c: InvoiceClient) => 
        c.clientCode === code && c.id !== client?.id
      );
      
      if (duplicate) {
        setClientCodeError(`Already used by ${duplicate.clientName}`);
      } else {
        setClientCodeError('');
      }
    } catch (error) {
      console.error('Error checking client code:', error);
      setClientCodeError('');
    } finally {
      setCheckingCode(false);
    }
  };
  
  const [formData, setFormData] = useState<Partial<InvoiceClient> & {
    addressLine1?: string;
    addressLine2?: string;
    poBox?: string;
    city?: string;
    country?: string;
  }>({
    clientCode: client?.clientCode || '',
    annualCode: client?.annualCode || '',
    clientName: client?.clientName || '',
    clientAddress: client?.clientAddress || '',
    addressLine1: addressParts.line1,
    addressLine2: addressParts.line2,
    poBox: addressParts.poBox,
    city: addressParts.city,
    country: addressParts.country,
    managerName: client?.managerName || '',
    managerEmail: client?.managerEmail || '',
    vatNumber: client?.vatNumber || '',
    issuingCompany: client?.issuingCompany || 'FZCO',
    isActive: client?.isActive ?? true,
    isRecurring: client?.isRecurring ?? false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if there's a known duplicate
    if (clientCodeError) {
      toast.error('Please fix the duplicate client code before submitting');
      return;
    }
    
    // Double-check for duplicate client code if it's a new client or the code was changed
    if (!client || (client && client.clientCode !== formData.clientCode)) {
      try {
        const response = await fetch('/api/invoicing/clients?searchTerm=' + formData.clientCode, {
          credentials: 'same-origin'
        });
        const data = await response.json();
        
        // Check if any client has this exact code
        const duplicate = data.clients?.find((c: InvoiceClient) => 
          c.clientCode === formData.clientCode && c.id !== client?.id
        );
        
        if (duplicate) {
          toast.error(`Client code ${formData.clientCode} is already in use by ${duplicate.clientName}`);
          return;
        }
      } catch (error) {
        console.error('Error checking for duplicate client code:', error);
      }
    }
    
    // Ensure the full address is built before saving
    const finalData = {
      ...formData,
      clientAddress: buildAddress(formData)
    };
    // Remove the temporary address fields
    delete finalData.addressLine1;
    delete finalData.addressLine2;
    delete finalData.poBox;
    delete finalData.city;
    delete finalData.country;
    onSave(finalData, !!client);
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
          {/* Client Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Code */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Client Code (5 digits) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  value={formData.clientCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, clientCode: value });
                    
                    // Clear existing timeout
                    if (codeCheckTimeout) {
                      clearTimeout(codeCheckTimeout);
                    }
                    
                    // Set new timeout for debounced check
                    if (value.length === 5) {
                      const timeout = setTimeout(() => {
                        checkDuplicateCode(value);
                      }, 500);
                      setCodeCheckTimeout(timeout);
                    } else {
                      setClientCodeError('');
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] font-mono ${
                    clientCodeError ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="00000"
                  onFocus={(e) => !clientCodeError && (e.target.style.borderColor = '#243F7B')}
                  onBlur={(e) => !clientCodeError && (e.target.style.borderColor = '#e5e7eb')}
                />
                {checkingCode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                  </div>
                )}
              </div>
              {clientCodeError ? (
                <p className="text-xs text-red-500 mt-1">{clientCodeError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Permanent 5-digit code (e.g., 10001)</p>
              )}
            </div>

            {/* Annual Invoice Code */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Annual Invoice Code (3 digits) *
              </label>
              <input
                type="text"
                required
                pattern="[0-9]{3}"
                maxLength={3}
                value={formData.annualCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, annualCode: value });
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] font-mono"
                placeholder="001"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p className="text-xs text-gray-500 mt-1">3-digit annual invoice code (001-999, resets yearly)</p>
            </div>
          </div>

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
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Address Line 1"
                value={formData.addressLine1 || ''}
                onChange={(e) => {
                  const addressParts = formData.clientAddress?.split('\n') || [];
                  addressParts[0] = e.target.value;
                  setFormData({ 
                    ...formData, 
                    addressLine1: e.target.value,
                    clientAddress: addressParts.filter(Boolean).join('\n')
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={formData.addressLine2 || ''}
                onChange={(e) => {
                  const addressParts = formData.clientAddress?.split('\n') || [];
                  addressParts[1] = e.target.value;
                  setFormData({ 
                    ...formData, 
                    addressLine2: e.target.value,
                    clientAddress: addressParts.filter(Boolean).join('\n')
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="P.O. Box (Optional)"
                  value={formData.poBox || ''}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      poBox: e.target.value,
                      clientAddress: buildAddress({
                        ...formData,
                        poBox: e.target.value
                      })
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      city: e.target.value,
                      clientAddress: buildAddress({
                        ...formData,
                        city: e.target.value
                      })
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>
              <select
                value={formData.country || 'UAE'}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    country: e.target.value,
                    clientAddress: buildAddress({
                      ...formData,
                      country: e.target.value
                    })
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              >
                <option value="UAE">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Qatar">Qatar</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Oman">Oman</option>
                <option value="Egypt">Egypt</option>
                <option value="Jordan">Jordan</option>
                <option value="Lebanon">Lebanon</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
          <div className="flex items-center justify-between pt-4">
            {/* Delete button - only show when editing */}
            {client && (
              <motion.button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete ${client.clientName}? This action cannot be undone.`)) {
                    try {
                      const response = await fetch(`/api/invoicing/clients/${client.id}`, {
                        method: 'DELETE',
                        credentials: 'same-origin'
                      });
                      if (response.ok) {
                        toast.success('Client deleted successfully');
                        onClose();
                        // Refresh the client list
                        window.location.reload();
                      } else {
                        toast.error('Failed to delete client');
                      }
                    } catch (error) {
                      console.error('Error deleting client:', error);
                      toast.error('Failed to delete client');
                    }
                  }
                }}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
            
            <div className="flex items-center space-x-4 ml-auto">
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
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};