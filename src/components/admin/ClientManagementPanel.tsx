'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import ClientModal from './ClientModal';
import BulkActionModal from './BulkActionModal';

interface Client {
  id: number;
  company_code: string;
  company_name: string;
  company_name_short: string;
  registered_authority: string;
  management_name: string;
  management_email: string;
  city: string;
  po_box?: string;
  vat_trn?: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClientManagementPanelProps {
  onRefresh: () => void;
}

export default function ClientManagementPanel({ onRefresh }: ClientManagementPanelProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, selectedAuthority, selectedCity, selectedStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      setClients(data.clients || []);
      setAuthorities(data.authorities || []);
      setCities(data.cities || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_name_short.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.management_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.management_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAuthority !== 'all') {
      filtered = filtered.filter(client => client.registered_authority === selectedAuthority);
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(client => client.city === selectedCity);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === selectedStatus);
    }

    // Sort clients by company code
    filtered.sort((a, b) => {
      return a.company_code.localeCompare(b.company_code, undefined, { numeric: true });
    });

    setFilteredClients(filtered);
  };

  const handleClientAction = async (clientId: number, action: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined
      });

      if (response.ok) {
        await fetchClients();
        onRefresh();
      } else {
        console.error('Failed to perform client action:', await response.text());
      }
    } catch (error) {
      console.error('Failed to perform client action:', error);
    }
  };

  const handleBulkAction = async (action: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: selectedClients,
          action,
          ...data
        })
      });

      if (response.ok) {
        await fetchClients();
        onRefresh();
        setSelectedClients([]);
        setShowBulkModal(false);
      } else {
        console.error('Failed to perform bulk action:', await response.text());
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length
        ? []
        : filteredClients.map(client => client.id)
    );
  };

  const exportClientsCSV = () => {
    const csv = [
      ['Company Code', 'Company Name', 'Short Name', 'Authority', 'Management Name', 'Email', 'City', 'P.O. Box', 'VAT TRN', 'Status'],
      ...filteredClients.map(client => [
        client.company_code,
        client.company_name,
        client.company_name_short,
        client.registered_authority,
        client.management_name,
        client.management_email,
        client.city,
        client.po_box || '',
        client.vat_trn || '',
        client.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportClientsExcel = () => {
    // Create Excel data structure
    const headers = ['Company Code', 'Company Name', 'Short Name', 'Authority', 'Management Name', 'Email', 'City', 'P.O. Box', 'VAT TRN', 'Status'];
    const data = filteredClients.map(client => [
      client.company_code,
      client.company_name,
      client.company_name_short,
      client.registered_authority,
      client.management_name,
      client.management_email,
      client.city,
      client.po_box || '',
      client.vat_trn || '',
      client.status
    ]);

    // Create simple Excel XML format
    let excel = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Clients">
  <Table>
   <Row>`;

    // Add headers
    headers.forEach(header => {
      excel += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excel += `</Row>`;

    // Add data rows
    data.forEach(row => {
      excel += `<Row>`;
      row.forEach(cell => {
        excel += `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
      });
      excel += `</Row>`;
    });

    excel += `</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excel], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.xls';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
      case 'archived':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Archived</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
        <p className="mt-2 text-gray-600">
          Manage client database with {clients.length} total clients.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedAuthority}
            onChange={(e) => setSelectedAuthority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Authorities</option>
            {authorities.map(authority => (
              <option key={authority} value={authority}>{authority}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setEditingClient(null);
              setShowClientModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Client
          </button>
          {selectedClients.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="mr-2 h-4 w-4" />
              Bulk Actions ({selectedClients.length})
            </button>
          )}
        </div>
        <div className="relative export-dropdown">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Export
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </button>
          {showExportDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={() => {
                    exportClientsCSV();
                    setShowExportDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ArrowDownTrayIcon className="mr-3 h-4 w-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    exportClientsExcel();
                    setShowExportDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ArrowDownTrayIcon className="mr-3 h-4 w-4" />
                  Export as Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center">
          <input
            type="checkbox"
            checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm font-medium text-gray-700">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredClients.map((client) => (
            <li key={client.id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => handleSelectClient(client.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-4">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{client.company_code}</span>
                      <h4 className="text-lg font-medium text-gray-900">{client.company_name}</h4>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="mr-4">{client.company_name_short}</span>
                      <span className="mr-4">{client.registered_authority}</span>
                      <span className="mr-4">{client.city}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="mr-4">Manager: {client.management_name}</span>
                      <span className="mr-4 flex items-center">
                        Email: {client.management_email}
                        {client.management_email === 'placeholder@tme-services.com' && (
                          <span className="ml-1 text-red-500 font-bold" title="Missing valid email address">!</span>
                        )}
                      </span>
                      {client.vat_trn && <span className="mr-4">VAT: {client.vat_trn}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setShowClientModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Edit client"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleClientAction(client.id, 'delete')}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete client"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSave={() => {
          fetchClients();
          onRefresh();
        }}
        authorities={authorities}
        cities={cities}
      />

      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedCount={selectedClients.length}
        onAction={handleBulkAction}
        entityType="clients"
      />
    </div>
  );
}