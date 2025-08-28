'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Check, CheckSquare, Square } from 'lucide-react';
import { LetterType, LETTER_TYPE_OPTIONS } from '@/types/cit-return-letters';

interface LetterTypeSectionProps {
  selectedLetterTypes: LetterType[];
  onLetterTypesChange: (letterTypes: LetterType[]) => void;
}

const LetterTypeSection: React.FC<LetterTypeSectionProps> = ({
  selectedLetterTypes,
  onLetterTypesChange,
}) => {
  const handleLetterTypeToggle = (letterType: LetterType) => {
    if (selectedLetterTypes.includes(letterType)) {
      // Remove from selection
      onLetterTypesChange(selectedLetterTypes.filter(type => type !== letterType));
    } else {
      // Add to selection
      onLetterTypesChange([...selectedLetterTypes, letterType]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLetterTypes.length === LETTER_TYPE_OPTIONS.length) {
      // Deselect all
      onLetterTypesChange([]);
    } else {
      // Select all
      onLetterTypesChange(LETTER_TYPE_OPTIONS.map(option => option.value));
    }
  };

  const getLetterTypeDescription = (letterType: LetterType) => {
    switch (letterType) {
      case 'CIT TP':
        return 'Corporate Income Tax Transfer Pricing documentation letter';
      case 'Conf acc docs + FS':
        return 'Confirmation of accounting documents and Financial Statements letter';
      case 'CIT assess+concl, non deduct, elect':
        return 'CIT assessment and conclusion, non-deductible, election letter';
      default:
        return 'Letter type description';
    }
  };

  const isAllSelected = selectedLetterTypes.length === LETTER_TYPE_OPTIONS.length;
  const isPartiallySelected = selectedLetterTypes.length > 0 && selectedLetterTypes.length < LETTER_TYPE_OPTIONS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
          Select Letters
        </h3>
        <div className="text-sm text-gray-600">
          {selectedLetterTypes.length} of {LETTER_TYPE_OPTIONS.length} selected
        </div>
      </div>

      <div className="space-y-4">
        {/* Select All Option */}
        <div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSelectAll}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center focus:outline-none transition-all duration-200 h-[42px]"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              borderColor: isPartiallySelected || isAllSelected ? '#243F7B' : '#e5e7eb'
            }}
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = isPartiallySelected || isAllSelected ? '#243F7B' : '#e5e7eb'}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mr-3"
                  style={{ 
                    borderColor: isPartiallySelected || isAllSelected ? '#243F7B' : '#d1d5db',
                    backgroundColor: isAllSelected ? '#243F7B' : (isPartiallySelected ? '#243F7B' : 'white')
                  }}
                >
                  {isAllSelected ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : isPartiallySelected ? (
                    <div className="w-2 h-0.5 bg-white rounded"></div>
                  ) : null}
                </div>
                <span className="font-medium text-gray-900">
                  {isAllSelected ? 'Deselect All' : 'Select All Letters'}
                </span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Individual Letter Options */}
        <div className="space-y-3">
          {LETTER_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedLetterTypes.includes(option.value);
            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleLetterTypeToggle(option.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center focus:outline-none transition-all duration-200 h-[42px]"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    borderColor: isSelected ? '#243F7B' : '#e5e7eb',
                    backgroundColor: isSelected ? '#f8fafc' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = isSelected ? '#243F7B' : '#e5e7eb'}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mr-3"
                        style={{ 
                          borderColor: isSelected ? '#243F7B' : '#d1d5db',
                          backgroundColor: isSelected ? '#243F7B' : 'white'
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {getLetterTypeDescription(option.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default LetterTypeSection;