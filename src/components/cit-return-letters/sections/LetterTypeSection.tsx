'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, CheckSquare, Square } from 'lucide-react';
import { LetterType, LETTER_TYPE_OPTIONS, ConfAccDocsSelections, CITAssessmentConclusionData, Client } from '@/types/cit-return-letters';
import ConfAccDocsSelectionSection from './ConfAccDocsSelectionSection';
import CITAssessmentConclusionSection from './CITAssessmentConclusionSection';

interface LetterTypeSectionProps {
  selectedLetterTypes: LetterType[];
  onLetterTypesChange: (letterTypes: LetterType[]) => void;
  confAccDocsSelections: ConfAccDocsSelections;
  onConfAccDocsSelectionsChange: (selections: ConfAccDocsSelections) => void;
  citAssessmentConclusion: CITAssessmentConclusionData;
  onCITAssessmentConclusionChange: (data: CITAssessmentConclusionData) => void;
  selectedClient: Client | null;
}

const LetterTypeSection: React.FC<LetterTypeSectionProps> = ({
  selectedLetterTypes,
  onLetterTypesChange,
  confAccDocsSelections,
  onConfAccDocsSelectionsChange,
  citAssessmentConclusion,
  onCITAssessmentConclusionChange,
  selectedClient,
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
            className="w-1/2 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-start focus:outline-none transition-all duration-200 h-[60px]"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              borderColor: isPartiallySelected || isAllSelected ? '#243F7B' : '#e5e7eb'
            }}
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = isPartiallySelected || isAllSelected ? '#243F7B' : '#e5e7eb'}
          >
            <div className="flex items-start space-x-3 w-full">
              <div 
                className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ 
                  borderColor: isPartiallySelected || isAllSelected ? '#243F7B' : '#d1d5db',
                  backgroundColor: isAllSelected ? '#243F7B' : (isPartiallySelected ? '#243F7B' : 'white')
                }}
              >
                {isAllSelected ? (
                  <Check className="w-2.5 h-2.5 text-white" />
                ) : isPartiallySelected ? (
                  <div className="w-1.5 h-0.5 bg-white rounded"></div>
                ) : null}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 text-sm">
                  {isAllSelected ? 'Deselect all' : 'Select all letters'}
                </span>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Individual Letter Options */}
        <div className="space-y-6">
          {LETTER_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedLetterTypes.includes(option.value);
            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Letter Type Checkbox - Standardized size and text */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleLetterTypeToggle(option.value)}
                  className="w-1/2 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-start focus:outline-none transition-all duration-200 h-[60px]"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    borderColor: isSelected ? '#243F7B' : '#e5e7eb',
                    backgroundColor: isSelected ? '#f8fafc' : 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = isSelected ? '#243F7B' : '#e5e7eb'}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div 
                      className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ 
                        borderColor: isSelected ? '#243F7B' : '#d1d5db',
                        backgroundColor: isSelected ? '#243F7B' : 'white'
                      }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        ({option.label.split(' ')[0]}) {option.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {getLetterTypeDescription(option.value)}
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Dynamic Content Under Each Letter Type */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pl-8"
                    >
                      {option.value === 'CIT TP' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 p-4 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center">
                            <Check className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Details have been filled accordingly for CIT TP letter
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mt-2">
                            No additional configuration required for this letter type.
                          </p>
                        </motion.div>
                      )}

                      {option.value === 'Conf acc docs + FS' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <ConfAccDocsSelectionSection
                            selections={confAccDocsSelections}
                            onSelectionsChange={onConfAccDocsSelectionsChange}
                          />
                        </motion.div>
                      )}

                      {option.value === 'CIT assess+concl, non deduct, elect' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <CITAssessmentConclusionSection
                            data={citAssessmentConclusion}
                            onDataChange={onCITAssessmentConclusionChange}
                            selectedClient={selectedClient}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default LetterTypeSection;