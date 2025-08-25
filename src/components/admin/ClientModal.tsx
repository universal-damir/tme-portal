'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Client {
  id?: number;
  company_code: string;
  company_name: string;
  company_name_short: string;
  registered_authority: string;
  management_name: string; // Keep for backward compatibility
  management_first_name: string;
  management_last_name: string;
  management_email: string;
  city: string;
  po_box?: string;
  vat_trn?: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: () => void;
  authorities: string[];
  cities: string[];
}

const AUTHORITIES = [
  'AJM Ajman FZ',
  'AUH DED',
  'AUH Masdar FZ',
  'DXB DACC',
  'DXB DAC',
  'DXB DAFZ FZ',
  'DXB DDA FZ',
  'DXB DET',
  'DXB DHCC FZ',
  'DXB DIFC FZ',
  'DXB DMCC FZ',
  'DXB DSO FZ',
  'DXB DWC FZ',
  'DXB DWTC FZ',
  'DXB ECDA FZ',
  'DXB IFZA FZ',
  'DXB JAFZA FZ',
  'DXB JAFZA Offshore',
  'DXB Meydan FZ',
  'FUJ FM FZ',
  'FUJ Fujairah FZ',
  'RAK RAKEZ FZ',
  'RAK RAKICC Offshore',
  'RAK RAKMC FZ',
  'SHJ Hamriyah FZ',
  'SHJ SAIF FZ',
  'SHJ Shams FZ',
  'SHJ SPC FZ',
  'UMM Umm Al Quwain FZ',
  'X Not registered',
  'X Outside UAE'
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export default function ClientModal({ isOpen, onClose, client, onSave, authorities, cities }: ClientModalProps) {
  const [formData, setFormData] = useState({
    company_code: '',
    company_name: '',
    company_name_short: '',
    registered_authority: '',
    management_first_name: '',
    management_last_name: '',
    management_email: '',
    city: '',
    po_box: '',
    vat_trn: '',
    status: 'active' as const,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        company_code: client.company_code || '',
        company_name: client.company_name || '',
        company_name_short: client.company_name_short || '',
        registered_authority: client.registered_authority || '',
        management_first_name: client.management_first_name || '',
        management_last_name: client.management_last_name || '',
        management_email: client.management_email || '',
        city: client.city || '',
        po_box: client.po_box || '',
        vat_trn: client.vat_trn || '',
        status: client.status || 'active',
        notes: client.notes || ''
      });
    } else {
      setFormData({
        company_code: '',
        company_name: '',
        company_name_short: '',
        registered_authority: '',
        management_first_name: '',
        management_last_name: '',
        management_email: '',
        city: '',
        po_box: '',
        vat_trn: '',
        status: 'active',
        notes: ''
      });
    }
    setErrors({});
  }, [client, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_code.trim()) {
      newErrors.company_code = 'Company code is required';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.company_name_short.trim()) {
      newErrors.company_name_short = 'Short name is required';
    }

    if (!formData.registered_authority) {
      newErrors.registered_authority = 'Registered authority is required';
    }

    if (!formData.management_first_name.trim() && !formData.management_last_name.trim()) {
      newErrors.management_first_name = 'At least first or last name is required';
    }

    if (!formData.management_email.trim()) {
      newErrors.management_email = 'Management email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.management_email)) {
        newErrors.management_email = 'Invalid email format';
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = client ? `/api/admin/clients/${client.id}` : '/api/admin/clients';
      const method = client ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSave();
        onClose();
      } else {
        setErrors({ submit: data.error || 'Failed to save client' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {client ? 'Edit Client' : 'Add New Client'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Company Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
                      Company Information
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Company Code *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.company_code}
                          onChange={(e) => handleInputChange('company_code', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="e.g., 10015"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.company_code && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_code}</p>
                        )}
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Company Name *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Full company name"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.company_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Short Name *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.company_name_short}
                          onChange={(e) => handleInputChange('company_name_short', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Short name"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.company_name_short && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_name_short}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Registered Authority *
                        </label>
                        <select
                          value={formData.registered_authority}
                          onChange={(e) => handleInputChange('registered_authority', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        >
                          <option value="">Select Authority</option>
                          {AUTHORITIES.map(authority => (
                            <option key={authority} value={authority}>{authority}</option>
                          ))}
                        </select>
                        {errors.registered_authority && (
                          <p className="text-red-500 text-xs mt-1">{errors.registered_authority}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Management Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
                      Management Information
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          First Name *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.management_first_name}
                          onChange={(e) => handleInputChange('management_first_name', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Dr. John"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.management_first_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.management_first_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Last Name
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.management_last_name}
                          onChange={(e) => handleInputChange('management_last_name', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Smith Wilson"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Management Email *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="email"
                          value={formData.management_email}
                          onChange={(e) => handleInputChange('management_email', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="manager@company.com"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.management_email && (
                          <p className="text-red-500 text-xs mt-1">{errors.management_email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
                      Location & Details
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          City *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="City name"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          P.O. Box
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.po_box}
                          onChange={(e) => handleInputChange('po_box', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="P.O. Box number"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          VAT TRN
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="text"
                          value={formData.vat_trn}
                          onChange={(e) => handleInputChange('vat_trn', e.target.value)}
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="XXX XXXX XXXX XXXX"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      Notes
                    </label>
                    <motion.textarea
                      whileFocus={{ scale: 1.01 }}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                      placeholder="Additional notes..."
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>

                  {errors.submit && (
                    <div className="text-red-500 text-sm">{errors.submit}</div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                      style={{ backgroundColor: '#f3f4f6', color: '#374151', fontFamily: 'Inter, sans-serif' }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: '#243F7B', fontFamily: 'Inter, sans-serif' }}
                    >
                      {loading ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}