'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { VISA_CANCELLATION_COLORS, getFieldPlaceholder } from '../utils/goldenVisaConfig';

interface VisaCancellationFieldProps {
  /**
   * Whether the visa cancellation checkbox is checked
   */
  checked: boolean;
  
  /**
   * Handler for checkbox state changes
   */
  onCheckedChange: (checked: boolean) => void;
  
  /**
   * Current visa cancellation fee value
   */
  fee?: number;
  
  /**
   * Handler for fee value changes
   */
  onFeeChange?: (fee: number) => void;
  
  /**
   * Custom label for the checkbox (defaults to standard label)
   */
  label?: string;
  
  /**
   * Custom label for the fee input field (defaults to standard label)
   */
  feeLabel?: string;
  
  /**
   * Custom description text below the checkbox
   */
  description?: string;
  
  /**
   * Additional CSS classes for styling
   */
  className?: string;
  
  /**
   * Whether to show the fee input when checked (default: true)
   */
  showFeeInput?: boolean;
}

export const VisaCancellationField: React.FC<VisaCancellationFieldProps> = ({
  checked,
  onCheckedChange,
  fee,
  onFeeChange,
  label = 'Visa cancellation (AED 186)',
  feeLabel = 'Visa cancellation fee',
  description = 'Check the box if visa cancellation is required',
  className = '',
  showFeeInput = true,
}) => {
  const colors = VISA_CANCELLATION_COLORS;
  const placeholder = getFieldPlaceholder('visaCancellationFee');

  // Handle checkbox change with auto-population
  const handleCheckboxChange = (isChecked: boolean) => {
    onCheckedChange(isChecked);
    
    // Auto-populate fee when checked, clear when unchecked
    if (onFeeChange) {
      if (isChecked) {
        // Auto-populate with 186 (without decimals) if no fee is set
        if (!fee || fee === 0) {
          onFeeChange(186);
        }
      } else {
        // Clear the fee when unchecked
        onFeeChange(0);
      }
    }
  };

  return (
    <div className={`mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl ${className}`}>
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            className="sr-only"
          />
          <div 
            className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
            style={{ 
              borderColor: checked ? '#243F7B' : '#d1d5db',
              backgroundColor: checked ? '#243F7B' : 'white'
            }}
          >
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
        </div>
        <span className="ml-2 text-sm font-medium text-gray-700">
          {label}
        </span>
      </label>
      
      {description && (
        <p className="text-xs text-gray-500 mt-2 ml-6">
          {description}
        </p>
      )}
      
      {checked && showFeeInput && onFeeChange && (
        <div className="mt-3 max-w-sm">
          <NumberInputField
            label={feeLabel}
            value={fee}
            onChange={onFeeChange}
            placeholder={placeholder}
            className="focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}; 