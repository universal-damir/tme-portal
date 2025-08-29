'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Building2, User, Mail, MapPin } from 'lucide-react';
import { Client } from '@/types/cit-return-letters';

interface ClientDetailsSectionProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  selectedClient,
  onClientSelect,
  searchTerm,
  onSearchTermChange,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients from API
  const fetchClients = async (query: string = '') => {
    setIsLoading(true);
    try {
      const url = query 
        ? `/api/admin/clients?search=${encodeURIComponent(query)}&status=active&limit=20`
        : '/api/admin/clients?status=active&limit=100';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.clients || []);
      
      // Filter clients based on search term if we have a local search
      if (query) {
        setFilteredClients(data.clients || []);
      } else {
        setFilteredClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of clients
  useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchClients(searchTerm);
      }, 300);
    } else if (searchTerm.trim().length === 0) {
      setFilteredClients([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    onSearchTermChange(`${client.company_code} ${client.company_name}`);
    setIsSearchFocused(false);
    setFilteredClients([]);
  };

  const handleClearSelection = () => {
    onClientSelect(null);
    onSearchTermChange('');
    setIsSearchFocused(false);
    setFilteredClients([]);
  };

  const showDropdown = isSearchFocused && (filteredClients.length > 0 || isLoading);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
        Client Details
      </h3>

      {/* Client Search Input */}
      <div className="space-y-4">
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            Search Client by Code or Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Type client code (e.g. 10015) or company name..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#243F7B';
                setIsSearchFocused(true);
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
            />
            {selectedClient && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                  <span className="mt-2 block">Searching clients...</span>
                </div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          <span style={{ color: '#243F7B' }} className="font-semibold">
                            {client.company_code}
                          </span>
                          {' '}
                          <span>
                            {client.company_name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.management_name} • {client.city}
                        </div>
                        <div className="text-xs text-gray-400">
                          {client.registered_authority}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No clients found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Client Display */}
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 p-4 rounded-lg border-2"
            style={{ borderColor: '#243F7B' }}
          >
            <h4 className="font-semibold mb-3" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
              Selected Client
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Company Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" style={{ color: '#243F7B' }} />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Company Name</div>
                    <div className="text-sm text-gray-900">{selectedClient.company_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div 
                      className="w-3 h-3 rounded-full text-white text-xs font-medium flex items-center justify-center"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      #
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Client Code</div>
                    <div className="text-sm text-gray-900">{selectedClient.company_code}</div>
                  </div>
                </div>
              </div>

              {/* Management Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" style={{ color: '#243F7B' }} />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Manager</div>
                    <div className="text-sm text-gray-900">{selectedClient.management_name}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" style={{ color: '#243F7B' }} />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Email</div>
                    <div className="text-sm text-gray-900">{selectedClient.management_email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" style={{ color: '#243F7B' }} />
                  <span className="text-gray-700">
                    {selectedClient.city} • {selectedClient.registered_authority}
                  </span>
                </div>
                {selectedClient.vat_trn && (
                  <span className="text-gray-500">
                    VAT TRN: {selectedClient.vat_trn}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ClientDetailsSection;