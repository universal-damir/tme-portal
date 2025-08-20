'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface FileOpeningFieldProps {
  /**
   * Whether this file opening checkbox is checked
   */
  checked: boolean;
  
  /**
   * Whether this checkbox is disabled (e.g., when the other one is checked)
   */
  disabled?: boolean;
  
  /**
   * Handler for checkbox changes
   */
  onCheckedChange: (checked: boolean) => void;
  
  /**
   * Label for the checkbox
   */
  label: string;
  
  /**
   * Description text
   */
  description: string;
}

export const FileOpeningField: React.FC<FileOpeningFieldProps> = ({
  checked,
  disabled = false,
  onCheckedChange,
  label,
  description,
}) => {
  return (
    <div className="space-y-2">
      <motion.label 
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        className={`flex items-start gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
            className="sr-only"
          />
          <div 
            className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mt-0.5"
            style={{ 
              borderColor: checked ? '#243F7B' : '#d1d5db',
              backgroundColor: checked ? '#243F7B' : 'white',
              opacity: disabled ? 0.5 : 1
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
        <div className="flex-1">
          <div className="text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            {label}
          </div>
          <div className="text-xs text-gray-600">
            {description}
          </div>
        </div>
      </motion.label>
    </div>
  );
};