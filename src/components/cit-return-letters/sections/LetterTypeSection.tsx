'use client';

import React, { useState } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLetterTypeSelect = (letterType: LetterType | '') => {
    onLetterTypeChange(letterType);
    setIsDropdownOpen(false);
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
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
        Select Letter
      </h3>

      <div className="space-y-4">
        {/* Letter Type Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
            Letter Type
          </label>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className={selectedLetterType ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedLetterType 
                    ? LETTER_TYPE_OPTIONS.find(option => option.value === selectedLetterType)?.label 
                    : 'Select a letter type...'
                  }
                </span>
              </div>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.button>
            
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {LETTER_TYPE_OPTIONS.map((option, index) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleLetterTypeSelect(option.value)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors duration-150 text-gray-900 ${
                      index === 0 ? 'rounded-t-lg' : ''
                    } ${
                      index === LETTER_TYPE_OPTIONS.length - 1 ? 'rounded-b-lg' : ''
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default LetterTypeSection;