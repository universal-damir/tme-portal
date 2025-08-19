'use client';

import React from 'react';
import { InvoiceClient, Invoice } from '@/types/invoicing';

interface InvoiceCreationFormProps {
  preselectedClient?: InvoiceClient | null;
  onInvoiceCreated: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceCreationForm: React.FC<InvoiceCreationFormProps> = ({
  preselectedClient,
  onInvoiceCreated,
  onCancel
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2" style={{ borderColor: '#243F7B20' }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#243F7B' }}>
        Create New Invoice
      </h2>
      <p className="text-gray-600">Invoice creation form will be implemented in Phase 2 continuation.</p>
      <div className="mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border-2 font-medium"
          style={{ borderColor: '#243F7B', color: '#243F7B' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};