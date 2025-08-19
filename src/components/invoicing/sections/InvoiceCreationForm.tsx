'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Minus,
  Save,
  Send,
  X,
  Calendar,
  User,
  Building,
  Hash,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye
} from 'lucide-react';
import { InvoiceClient, Invoice, InvoiceFormData, ServiceCategory } from '@/types/invoicing';
import { InvoiceNumberGenerator } from '@/lib/invoicing/invoice-number-generator';
import { toast } from 'sonner';
import { InvoicePreviewModal } from './InvoicePreviewModal';

interface InvoiceCreationFormProps {
  preselectedClient?: InvoiceClient | null;
  onInvoiceCreated: (invoice: Invoice) => void;
  onCancel: () => void;
}

// Service catalog - based on your requirements
const SERVICE_CATALOG = {
  'Consulting/PRO/Commercial services': [
    { name: 'PRO/Commercial services', unit: 'month', defaultPrice: 0 },
    { name: 'Company setup / restructuring service', unit: null, defaultPrice: 0 },
    { name: 'Bank periodic review service', unit: null, defaultPrice: 0, description: 'prepare and provide the requested legal and transaction documents and information to the RM and Compliance Department and follow up' },
    { name: 'VAT consulting / reg / exception / dereg', unit: 'hours', defaultPrice: 0 },
    { name: 'FTA portal update', unit: null, defaultPrice: 0, customDescription: true },
    { name: 'Compliance consulting (ESR / UBO)', unit: 'hours', defaultPrice: 0 },
    { name: 'IT AMC service fee', unit: 'month', defaultPrice: 0 },
    { name: 'IT consulting', unit: 'hours', defaultPrice: 0 }
  ],
  'Accounting service': [
    { name: 'Accounting service', unit: 'month', defaultPrice: 0 },
    { name: 'VAT booking fee', unit: '%', defaultPrice: 20 },
    { name: 'VAT return filing', unit: 'quarter', defaultPrice: 0 },
    { name: 'VAT figures for tax group return filing', unit: 'quarter', defaultPrice: 0 },
    { name: 'Cost center booking', unit: 'month', defaultPrice: 0 }
  ],
  'Salary preparation': [
    { name: 'Salary preparation', unit: 'salaries', defaultPrice: 0 }
  ],
  'Others': [
    { name: 'Writing and receiving of emails', unit: 'hours', defaultPrice: 0, customDescription: true },
    { name: 'Admin fee', unit: '%', defaultPrice: 2 }
  ]
};

interface ServiceLine {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  netAmount: number;
}

export const InvoiceCreationForm: React.FC<InvoiceCreationFormProps> = ({
  preselectedClient,
  onInvoiceCreated,
  onCancel
}) => {
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(preselectedClient || null);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<InvoiceClient[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Invoice details
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  
  // Service lines
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Consulting/PRO/Commercial services']));
  
  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);

  useEffect(() => {
    fetchClients();
    // Set default due date to 30 days from invoice date
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + 30);
    setDueDate(date.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [serviceLines]);

  useEffect(() => {
    // Filter clients based on search term
    if (!clientSearchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const searchLower = clientSearchTerm.toLowerCase();
      const filtered = clients.filter(client => 
        client.clientCode.toLowerCase().includes(searchLower) ||
        client.clientName.toLowerCase().includes(searchLower) ||
        `${client.clientCode} ${client.clientName}`.toLowerCase().includes(searchLower)
      );
      setFilteredClients(filtered);
    }
  }, [clientSearchTerm, clients]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/invoicing/clients?isActive=true', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      // Sort clients by code
      const sortedClients = (data.clients || []).sort((a: InvoiceClient, b: InvoiceClient) => 
        a.clientCode.localeCompare(b.clientCode)
      );
      setClients(sortedClients);
      setFilteredClients(sortedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const calculateTotals = () => {
    const sub = serviceLines.reduce((sum, line) => sum + line.netAmount, 0);
    const vat = sub * 0.05; // 5% VAT
    setSubtotal(sub);
    setVatAmount(vat);
    setTotalAmount(sub + vat);
  };

  const addServiceLine = (category: string, service: any) => {
    const newLine: ServiceLine = {
      id: `${Date.now()}-${Math.random()}`,
      category,
      description: service.customDescription ? '' : (service.description || service.name),
      quantity: 1,
      unit: service.unit,
      unitPrice: service.defaultPrice || 0,
      netAmount: service.defaultPrice || 0
    };
    setServiceLines([...serviceLines, newLine]);
  };

  const updateServiceLine = (id: string, updates: Partial<ServiceLine>) => {
    setServiceLines(lines =>
      lines.map(line => {
        if (line.id === id) {
          const updated = { ...line, ...updates };
          // Recalculate net amount
          if ('quantity' in updates || 'unitPrice' in updates) {
            updated.netAmount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return line;
      })
    );
  };

  const removeServiceLine = (id: string) => {
    setServiceLines(lines => lines.filter(line => line.id !== id));
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const generateInvoiceNumber = () => {
    if (!selectedClient) return 'Select client first';
    
    try {
      return InvoiceNumberGenerator.generate(
        selectedClient.clientCode,
        selectedClient.annualCode || '001',
        selectedClient.issuingCompany,
        new Date(invoiceDate)
      );
    } catch (error) {
      return 'Invalid client data';
    }
  };

  const handleSubmit = async (sendForApproval: boolean = false) => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (serviceLines.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }

    setIsSubmitting(true);

    try {
      // Group service lines by category
      const sections = serviceLines.reduce((acc, line) => {
        if (!acc[line.category]) {
          acc[line.category] = [];
        }
        acc[line.category].push({
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || '',
          unitPrice: line.unitPrice
        });
        return acc;
      }, {} as Record<string, any[]>);

      const invoiceData = {
        clientId: selectedClient.id,
        invoiceDate,
        dueDate,
        notes,
        internalNotes,
        sections: Object.entries(sections).map(([name, items]) => ({
          name,
          items
        })),
        status: sendForApproval ? 'pending_approval' : 'draft'
      };

      const response = await fetch('/api/invoicing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const invoice = await response.json();
        toast.success(`Invoice ${invoice.invoiceNumber} created successfully`);
        onInvoiceCreated(invoice);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePreview = () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (serviceLines.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }

    // Create preview invoice object
    const previewData = {
      invoiceNumber: generateInvoiceNumber(),
      client: selectedClient,
      invoiceDate,
      dueDate,
      notes,
      internalNotes,
      subtotal,
      vatRate: 5,
      vatAmount,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      status: 'draft',
      sections: serviceLines.reduce((acc: any[], line) => {
        let section = acc.find(s => s.name === line.category);
        if (!section) {
          section = {
            name: line.category,
            items: []
          };
          acc.push(section);
        }
        section.items.push({
          description: line.description,
          quantity: line.quantity,
          unit: line.unit || '',
          unit_price: line.unitPrice,
          net_amount: line.netAmount
        });
        return acc;
      }, [])
    };

    setPreviewInvoice(previewData);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2"
        style={{ borderColor: '#243F7B20' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
              Create New Invoice
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Invoice Number: <span className="font-mono font-bold">{generateInvoiceNumber()}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Selection and Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Client *
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedClient ? `${selectedClient.clientCode} ${selectedClient.clientName}` : clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  setSelectedClient(null);
                  setShowClientDropdown(true);
                }}
                placeholder="Search by code or name..."
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => {
                  e.target.style.borderColor = '#243F7B';
                  setShowClientDropdown(true);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  // Delay to allow click on dropdown items
                  setTimeout(() => setShowClientDropdown(false), 200);
                }}
                disabled={loadingClients}
              />
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 max-h-60 overflow-y-auto">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClient(client);
                        setClientSearchTerm('');
                        setShowClientDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-semibold" style={{ color: '#243F7B' }}>
                          {client.clientCode} {client.clientName}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({client.issuingCompany})
                        </span>
                      </div>
                      {client.isRecurring && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Recurring
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                <p><strong>Company:</strong> {selectedClient.issuingCompany}</p>
                <p><strong>Annual Invoice Code:</strong> {selectedClient.annualCode}</p>
                <p><strong>VAT:</strong> {selectedClient.vatNumber || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Invoice Dates */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Service Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2"
        style={{ borderColor: '#243F7B20' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
          Service Items
        </h3>

        {/* Service Categories */}
        <div className="space-y-4">
          {Object.entries(SERVICE_CATALOG).map(([category, services]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleSection(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: expandedSections.has(category) ? '#243F7B10' : 'white' }}
              >
                <span className="font-medium" style={{ color: '#243F7B' }}>
                  {category}
                </span>
                {expandedSections.has(category) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Category Services */}
              <AnimatePresence>
                {expandedSections.has(category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t"
                  >
                    <div className="p-4 space-y-2">
                      {services.map((service, index) => (
                        <motion.button
                          key={index}
                          onClick={() => addServiceLine(category, service)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between group"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div>
                            <span className="text-sm">{service.name}</span>
                            {service.unit && (
                              <span className="text-xs text-gray-500 ml-2">({service.unit})</span>
                            )}
                          </div>
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Added Service Lines */}
        {serviceLines.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
              Invoice Items
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-600">
                    <th className="text-left py-2">Description</th>
                    <th className="text-center py-2">Quantity</th>
                    <th className="text-center py-2">Unit</th>
                    <th className="text-right py-2">AED Unit</th>
                    <th className="text-right py-2">AED Net</th>
                    <th className="text-right py-2">AED 5%</th>
                    <th className="text-right py-2">AED Gross</th>
                    <th className="text-center py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLines.map((line) => (
                    <tr key={line.id} className="border-b">
                      <td className="py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateServiceLine(line.id, { description: e.target.value })}
                          className="w-full px-2 py-1 rounded border focus:outline-none"
                          placeholder="Enter description"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateServiceLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 rounded border text-center focus:outline-none"
                          min="0"
                          step="0.01"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-sm">
                        {line.unit || '-'}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => updateServiceLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 rounded border text-right focus:outline-none"
                          min="0"
                          step="0.01"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-sm">
                        {formatCurrency(line.netAmount)}
                      </td>
                      <td className="py-2 px-2 text-right text-sm">
                        {formatCurrency(line.netAmount * 0.05)}
                      </td>
                      <td className="py-2 px-2 text-right text-sm font-medium">
                        {formatCurrency(line.netAmount * 1.05)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeServiceLine(line.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-medium">
                    <td colSpan={4} className="py-3 text-right">Subtotal:</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(subtotal)}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(vatAmount)}</td>
                    <td className="py-3 px-2 text-right text-lg" style={{ color: '#243F7B' }}>
                      {formatCurrency(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2"
        style={{ borderColor: '#243F7B20' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
          Additional Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Invoice Notes (visible to client)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
              rows={3}
              placeholder="Enter any notes for the client..."
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Internal Notes (not visible to client)
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
              rows={3}
              placeholder="Enter internal notes..."
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border-2 font-medium"
          style={{ borderColor: '#243F7B', color: '#243F7B' }}
        >
          Cancel
        </button>
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={handlePreview}
            disabled={!selectedClient || serviceLines.length === 0}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg border-2 font-medium disabled:opacity-50"
            style={{ borderColor: '#D2BC99', color: '#D2BC99' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </motion.button>
          <motion.button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !selectedClient || serviceLines.length === 0}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg border-2 font-medium disabled:opacity-50"
            style={{ borderColor: '#243F7B', color: '#243F7B' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </motion.button>
          <motion.button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !selectedClient || serviceLines.length === 0}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: '#243F7B' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className="w-4 h-4" />
            <span>Submit for Approval</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        invoice={previewInvoice}
      />
    </div>
  );
};