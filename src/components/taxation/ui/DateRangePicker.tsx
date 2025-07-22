'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TaxPeriodDateRange } from '@/types/taxation';

interface DateRangePickerProps {
  /**
   * Current date range values
   */
  value: TaxPeriodDateRange;
  
  /**
   * Handler for date range changes
   */
  onChange: (range: TaxPeriodDateRange) => void;
  
  /**
   * Label for the date range picker
   */
  label: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Whether the fields are required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Color theme for focus rings
   */
  focusColor?: string;
  
  /**
   * Error message
   */
  error?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  description,
  required = false,
  className = '',
  focusColor = 'focus:ring-blue-500',
  error,
}) => {
  const handleFromDateChange = (fromDate: string) => {
    const newRange = {
      ...value,
      fromDate,
    };
    
    onChange(newRange);
  };

  const handleToDateChange = (toDate: string) => {
    onChange({
      ...value,
      toDate,
    });
  };

  // Display only the provided error (removed validation error)
  const displayError = error;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label} {required && '*'}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-3">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">
            From Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={value.fromDate || ''}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 ${focusColor} focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
              max={value.toDate || undefined} // Prevent from date being after to date
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">
            To Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={value.toDate || ''}
              onChange={(e) => handleToDateChange(e.target.value)}
              className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 ${focusColor} focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
              min={value.fromDate || undefined} // Only ensure to date is not before from date
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Summary */}
      {value.fromDate || value.toDate ? (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Selected Period:</span>{' '}
            {value.fromDate ? new Date(value.fromDate).toLocaleDateString('en-GB').replace(/\//g, '.') : 'Not set'} -{' '}
            {value.toDate ? new Date(value.toDate).toLocaleDateString('en-GB').replace(/\//g, '.') : 'Not set'}
          </p>
        </div>
      ) : null}

      {/* Error Message */}
      {displayError && (
        <p className="text-red-500 text-sm mt-1">{displayError}</p>
      )}
    </div>
  );
}; 