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
  Banknote,
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
import { TMEDatePicker } from '@/components/common/TMEDatePicker';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';

interface InvoiceCreationFormProps {
  preselectedClient?: InvoiceClient | null;
  onInvoiceCreated: (invoice: Invoice) => void;
  onCancel: () => void;
}

// Service catalog - based on your requirements
const SERVICE_CATALOG = {
  'Consulting/PRO/Commercial services': [
    { name: 'PRO/Commercial services', unit: 'month', defaultPrice: 1000 },
    { name: 'Company setup / restructuring service', unit: null, defaultPrice: 1000 },
    { name: 'Bank periodic review service', unit: null, defaultPrice: 1000, description: 'prepare and provide the requested legal and transaction documents and information to the RM and Compliance Department and follow up' },
    { name: 'VAT consulting / reg / exception / dereg', unit: 'hours', defaultPrice: 1000 },
    { name: 'FTA portal update', unit: null, defaultPrice: 1000, customDescription: true },
    { name: 'Compliance consulting (ESR / UBO)', unit: 'hours', defaultPrice: 1000 },
    { name: 'IT AMC service fee', unit: 'month', defaultPrice: 1000 },
    { name: 'IT consulting', unit: 'hours', defaultPrice: 1000 }
  ],
  'Accounting service': [
    { name: 'Accounting service', unit: 'month', defaultPrice: 1000 },
    { name: 'VAT booking fee', unit: '%', defaultPrice: 20 },
    { name: 'VAT return filing', unit: 'quarter', defaultPrice: 1000 },
    { name: 'VAT figures for tax group return filing', unit: 'quarter', defaultPrice: 1000 },
    { name: 'Cost center booking', unit: 'month', defaultPrice: 1000 }
  ],
  'Salary preparation': [
    { name: 'Salary preparation', unit: 'salaries', defaultPrice: 1000 }
  ],
  'Others': [
    { name: 'Writing and receiving of emails', unit: 'hours', defaultPrice: 1000, customDescription: true },
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchClients();
    // Set default due date to 7 days from invoice date
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + 7);
    setDueDate(date.toISOString().split('T')[0]);
  }, []);

  // Auto-update due date when invoice date changes
  useEffect(() => {
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + 7);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [invoiceDate]);

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
    const unitPrice = Math.max(0, Number(service.defaultPrice) || 0);
    const newLine: ServiceLine = {
      id: `${Date.now()}-${Math.random()}`,
      category: category.trim(),
      description: service.customDescription ? '' : (service.description || service.name || '').trim(),
      quantity: 1,
      unit: service.unit || '',
      unitPrice,
      netAmount: unitPrice
    };
    setServiceLines([...serviceLines, newLine]);
  };

  const updateServiceLine = (id: string, updates: Partial<ServiceLine>) => {
    setServiceLines(lines =>
      lines.map(line => {
        if (line.id === id) {
          const updated = { ...line, ...updates };
          
          // Ensure numeric values are valid
          if ('quantity' in updates) {
            updated.quantity = Math.max(0, Number(updated.quantity) || 0);
          }
          if ('unitPrice' in updates) {
            updated.unitPrice = Math.max(0, Number(updated.unitPrice) || 0);
          }
          
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

  const handleSubmit = async () => {
    setFormErrors([]);
    const errors: string[] = [];
    
    // Validation
    if (!selectedClient || !selectedClient.id) {
      errors.push('Please select a client');
    }

    if (serviceLines.length === 0) {
      errors.push('Please add at least one service item');
    }

    // Validate service lines
    serviceLines.forEach((line, index) => {
      if (!line.description?.trim()) {
        errors.push(`Service item ${index + 1}: Please add a description`);
      }
      if (line.quantity <= 0) {
        errors.push(`Service item ${index + 1}: Quantity must be greater than 0`);
      }
      if (line.unitPrice < 0) {
        errors.push(`Service item ${index + 1}: Unit price cannot be negative`);
      }
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      toast.error(`Please fix ${errors.length} validation error(s)`);
      return;
    }

    // Create invoice and show reviewer selection modal
    const invoice = await createInvoice();
    if (invoice) {
      setCreatedInvoice(invoice);
      setShowReviewModal(true);
    }
  };

  const createInvoice = async (): Promise<Invoice | null> => {
    if (!selectedClient?.id) {
      toast.error('Please select a client');
      return null;
    }

    setIsSubmitting(true);

    try {
      // Group service lines by category and validate
      const sections = serviceLines.reduce((acc, line) => {
        if (!acc[line.category]) {
          acc[line.category] = [];
        }
        
        // Ensure data is clean and valid
        acc[line.category].push({
          description: line.description?.trim() || '',
          quantity: Math.max(0, Number(line.quantity) || 0),
          unit: line.unit?.trim() || '',
          unitPrice: Math.max(0, Number(line.unitPrice) || 0)
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Convert to API format
      const sectionsArray = Object.entries(sections).map(([name, items]) => ({
        name: name.trim(),
        items: items.filter(item => item.description && item.quantity > 0) // Remove invalid items
      })).filter(section => section.items.length > 0); // Remove empty sections

      if (sectionsArray.length === 0) {
        toast.error('No valid service items found');
        return null;
      }

      const invoiceData = {
        clientId: selectedClient.id,
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || undefined,
        notes: notes?.trim() || undefined,
        internalNotes: internalNotes?.trim() || undefined,
        status: 'pending_approval' as const,
        sections: sectionsArray
      };

      console.log('Sending invoice data:', invoiceData);

      const response = await fetch('/api/invoicing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const invoice = await response.json();
        
        // Create application record for review system
        if (invoice?.id) {
          try {
            const appResponse = await fetch('/api/applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({
                type: 'golden-visa', // Use existing allowed type temporarily
                title: `Invoice ${invoice.invoiceNumber}`,
                form_data: {
                  invoice_id: invoice.id,
                  invoice_number: invoice.invoiceNumber,
                  client_name: selectedClient.clientName,
                  total_amount: invoice.totalAmount
                }
              })
            });
            
            if (appResponse.ok) {
              const app = await appResponse.json();
              console.log('Application created for review:', app.id);
              invoice.application_id = app.id;
            } else {
              console.warn('Failed to create application for review - this is not critical');
            }
          } catch (appError) {
            console.warn('Application creation failed - this is not critical:', appError);
          }
        }
        
        toast.success(`Invoice ${invoice.invoiceNumber} created successfully`);
        return invoice;
      } else {
        // Handle API errors
        let errorMessage = 'Failed to create invoice';
        
        try {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          
          if (errorData.details && Array.isArray(errorData.details)) {
            // Validation errors
            const validationErrors = errorData.details.map((err: any) => 
              `${err.path?.join('.')} ${err.message}`
            ).join(', ');
            errorMessage = `Validation error: ${validationErrors}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Can't parse error response
          console.error('Failed to parse error response:', e);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        toast.error(errorMessage);
        return null;
      }
    } catch (error) {
      console.error('Network/unexpected error creating invoice:', error);
      toast.error('Network error - please check your connection and try again');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (submission: {
    reviewer_id: number;
    urgency: 'standard' | 'urgent';
    comments?: string;
  }) => {
    if (!createdInvoice) return false;

    try {
      // EXACT COPY of Golden Visa - call /api/applications/{id}/submit-review
      const applicationId = (createdInvoice as any).application_id || createdInvoice.id;
      const response = await fetch(`/api/applications/${applicationId}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Submit review failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          applicationId,
          submission
        });
        throw new Error(`Failed to submit for review: ${response.statusText}`);
      }

      toast.success(`Invoice ${createdInvoice.invoiceNumber} submitted for review`);
      onInvoiceCreated(createdInvoice);
      return true;
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error('Failed to submit for review');
      return false;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePreview = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (serviceLines.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }

    try {
      // Create preview invoice object
      const previewData: Invoice = {
        invoiceNumber: generateInvoiceNumber(),
        clientId: selectedClient.id!,
        client: selectedClient,
        invoiceDate,
        dueDate,
        status: 'pending_approval' as const,
        subtotal,
        vatRate: 5,
        vatAmount,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        isRecurring: false,
        notes,
        internalNotes,
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

      // Generate PDF and open in new window (like Golden Visa)
      const { InvoicePDFGenerator } = await import('@/lib/invoicing/invoice-pdf-generator');
      const { blob } = await InvoicePDFGenerator.generatePDFWithFilename(previewData);
      
      // Open PDF in new tab for preview
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success('Invoice Preview Generated', {
        description: 'PDF preview opened in new tab'
      });
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      toast.error('Failed to generate preview - please try again');
    }
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
            <TMEDatePicker
              label="Invoice Date"
              value={invoiceDate}
              onChange={setInvoiceDate}
              required
            />
            <TMEDatePicker
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
            />
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
                    <th className="text-left py-2 w-auto">Description</th>
                    <th className="text-center py-2 w-20">Quantity</th>
                    <th className="text-center py-2 w-20">Unit</th>
                    <th className="text-right py-2 w-24">AED Unit</th>
                    <th className="text-right py-2 w-28">AED Net</th>
                    <th className="text-right py-2 w-28">AED 5%</th>
                    <th className="text-right py-2 w-32">AED Gross</th>
                    <th className="text-center py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLines.map((line) => (
                    <tr key={line.id} className="border-b">
                      <td className="py-2 w-auto">
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
                      <td className="py-2 w-20">
                        <input
                          type="text"
                          value={line.quantity}
                          onChange={(e) => {
                            const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                            const value = Math.max(0, parseFloat(cleanValue) || 0);
                            updateServiceLine(line.id, { quantity: value });
                          }}
                          className="w-full px-2 py-1 rounded border text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="1"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </td>
                      <td className="py-2 w-20 text-center text-sm">
                        {line.unit || '-'}
                      </td>
                      <td className="py-2 w-24">
                        <input
                          type="text"
                          value={line.unitPrice.toLocaleString('en-US')}
                          onChange={(e) => {
                            const cleanValue = e.target.value.replace(/[^\d.]/g, '');
                            const value = Math.max(0, parseFloat(cleanValue) || 0);
                            updateServiceLine(line.id, { unitPrice: value });
                          }}
                          className="w-full px-2 py-1 rounded border text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="1,000"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </td>
                      <td className="py-2 w-28 text-right text-sm px-2">
                        {formatCurrency(line.netAmount)}
                      </td>
                      <td className="py-2 w-28 text-right text-sm px-2">
                        {formatCurrency(line.netAmount * 0.05)}
                      </td>
                      <td className="py-2 w-32 text-right text-sm font-medium px-2">
                        {formatCurrency(line.netAmount * 1.05)}
                      </td>
                      <td className="py-2 w-12 text-center">
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
                    <td className="py-3 px-2 text-right w-28">{formatCurrency(subtotal)}</td>
                    <td className="py-3 px-2 text-right w-28">{formatCurrency(vatAmount)}</td>
                    <td className="py-3 px-2 text-right text-lg w-32" style={{ color: '#243F7B' }}>
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="w-12"></td>
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

      {/* Form Errors */}
      {formErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
        >
          <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {formErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

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
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedClient || serviceLines.length === 0}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: '#243F7B' }}
            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Invoice...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Create & Submit for Approval</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Review Submission Modal */}
      {createdInvoice && (
        <ReviewSubmissionModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setCreatedInvoice(null);
          }}
          applicationId={createdInvoice.id?.toString() || ''}
          applicationTitle={`Invoice ${createdInvoice.invoiceNumber} - ${formatCurrency(createdInvoice.totalAmount)}`}
          documentType="invoice"
          onSubmit={handleReviewSubmit}
        />
      )}

    </div>
  );
};