'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown } from 'lucide-react';
import { LetterType, LETTER_TYPE_OPTIONS } from '@/types/cit-return-letters';

interface LetterTypeSectionProps {
  selectedLetterType: LetterType | '';
  onLetterTypeChange: (letterType: LetterType | '') => void;
}

const LetterTypeSection: React.FC<LetterTypeSectionProps> = ({
  selectedLetterType,
  onLetterTypeChange,
}) => {

  const handleLetterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLetterTypeChange(e.target.value as LetterType | '');
  };

  const getLetterTypeDescription = (letterType: LetterType | '') => {
    switch (letterType) {
      case 'CIT TP':
        return 'Corporate Income Tax Transfer Pricing documentation letter';
      case 'Conf acc docs + FS':
        return 'Confirmation of accounting documents and Financial Statements letter';
      case 'CIT assess+concl, non deduct, elect':
        return 'CIT assessment and conclusion, non-deductible, election letter';
      default:
        return 'Please select a letter type to see description';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
        Select Letter
      </h3>

      <div className="space-y-4">
        {/* Letter Type Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            Letter Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedLetterType}
              onChange={handleLetterTypeChange}
              className="w-full pl-10 pr-10 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] appearance-none bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Select a letter type...</option>
              {LETTER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default LetterTypeSection;