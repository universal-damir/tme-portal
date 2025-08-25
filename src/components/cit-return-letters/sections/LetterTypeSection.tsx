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

        {/* Letter Type Description */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-lg border transition-all duration-200 ${
            selectedLetterType 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                  selectedLetterType ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <FileText className="h-3 w-3" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {selectedLetterType ? `${selectedLetterType} Letter` : 'Letter Type Description'}
              </h4>
              <p className="text-sm text-gray-600">
                {getLetterTypeDescription(selectedLetterType)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Selected Letter Summary */}
        {selectedLetterType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 p-3 rounded-lg border border-green-200"
          >
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-green-800">
                  Selected: {selectedLetterType}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LetterTypeSection;