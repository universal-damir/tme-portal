'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Plus, Trash2, X } from 'lucide-react';
import CustomDatePicker from '../ui/CustomDatePicker';
import { CITAssessmentConclusionData, QFZPBenefitSelections, NonDeductibleExpense, Client, ElectionsSelections } from '@/types/cit-return-letters';
import { getCompanyTypeByAuthority } from '@/lib/pdf-generator/utils/citAuthorityMapping';

interface CITAssessmentConclusionSectionProps {
  data: CITAssessmentConclusionData;
  onDataChange: (data: CITAssessmentConclusionData) => void;
  selectedClient: Client | null;
}

// Helper functions for number formatting (updated to support decimals)
const formatNumberWithSeparators = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  if (!cleaned) return '';
  
  // Split by decimal point to handle integer and decimal parts separately
  const parts = cleaned.split('.');
  
  // If there are more than 2 parts (multiple decimal points), keep only the first two
  if (parts.length > 2) {
    parts.splice(2);
  }
  
  // Add thousands separators to the integer part
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  // Handle decimal part
  if (parts.length === 2) {
    // Limit decimal part to 2 digits but don't auto-add .00
    parts[1] = parts[1].slice(0, 2);
    return parts.join('.');
  }
  
  return parts[0] || '';
};

const parseFormattedNumber = (formattedValue: string): number => {
  if (!formattedValue || formattedValue.trim() === '') return 0;
  
  // Remove commas and parse as float to preserve decimals
  const cleaned = formattedValue.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  
  // Round to 2 decimal places to avoid floating point precision issues
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

const CITAssessmentConclusionSection: React.FC<CITAssessmentConclusionSectionProps> = ({
  data,
  onDataChange,
  selectedClient,
}) => {
  const [formattedSBRAmount, setFormattedSBRAmount] = React.useState<string>('');

  // Update formatted SBR amount when prop value changes
  React.useEffect(() => {
    const amount = data.smallBusinessReliefAmount;
    if (amount && amount > 0) {
      // Format without forcing decimal places unless they exist
      const hasDecimals = amount % 1 !== 0;
      const formatted = hasDecimals ? amount.toFixed(2) : amount.toString();
      setFormattedSBRAmount(formatNumberWithSeparators(formatted));
    } else {
      setFormattedSBRAmount('');
    }
  }, [data.smallBusinessReliefAmount]);

  const handleCITImpactAssessmentChange = useCallback((checked: boolean) => {
    onDataChange({
      ...data,
      citImpactAssessmentPerformed: checked,
      citImpactAssessmentDate: checked ? data.citImpactAssessmentDate : '',
    });
  }, [data, onDataChange]);

  const handleDateChange = useCallback((date: string) => {
    onDataChange({
      ...data,
      citImpactAssessmentDate: date,
    });
  }, [data, onDataChange]);

  const handleQFZPChange = useCallback((key: keyof QFZPBenefitSelections, value: boolean) => {
    onDataChange({
      ...data,
      qfzpBenefitSelections: {
        ...data.qfzpBenefitSelections,
        [key]: value,
      },
    });
  }, [data, onDataChange]);

  const handleSBRAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSeparators(value);
    const parsed = parseFormattedNumber(formatted);
    
    setFormattedSBRAmount(formatted);
    onDataChange({
      ...data,
      smallBusinessReliefAmount: parsed,
    });
  }, [data, onDataChange]);

  const handleNonDeductibleParticularsChange = useCallback((index: number, value: string) => {
    const updatedExpenses = [...data.nonDeductibleExpenses];
    updatedExpenses[index] = {
      ...updatedExpenses[index],
      particulars: value,
    };
    
    onDataChange({
      ...data,
      nonDeductibleExpenses: updatedExpenses,
    });
  }, [data, onDataChange]);

  const handleNonDeductiblePercentageChange = useCallback((index: number, value: string) => {
    // Allow only numbers and decimal point, limit to 3 digits before decimal and 2 after
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    const parts = sanitizedValue.split('.');
    
    let formattedValue = parts[0];
    if (parts.length > 1) {
      formattedValue += '.' + parts[1].slice(0, 2); // Limit to 2 decimal places
    }
    
    // Limit percentage to 100
    const numericValue = parseFloat(formattedValue);
    const finalValue = isNaN(numericValue) ? 0 : Math.min(numericValue, 100);
    
    const updatedExpenses = [...data.nonDeductibleExpenses];
    updatedExpenses[index] = {
      ...updatedExpenses[index],
      nonDeductiblePercentage: finalValue,
    };
    
    onDataChange({
      ...data,
      nonDeductibleExpenses: updatedExpenses,
    });
  }, [data, onDataChange]);

  const handleAddNonDeductibleExpense = useCallback(() => {
    const newExpense: NonDeductibleExpense = {
      particulars: '',
      nonDeductiblePercentage: 0,
    };
    
    onDataChange({
      ...data,
      nonDeductibleExpenses: [...data.nonDeductibleExpenses, newExpense],
    });
  }, [data, onDataChange]);

  const handleRemoveNonDeductibleExpense = useCallback((index: number) => {
    if (data.nonDeductibleExpenses.length > 1) {
      const updatedExpenses = data.nonDeductibleExpenses.filter((_, i) => i !== index);
      onDataChange({
        ...data,
        nonDeductibleExpenses: updatedExpenses,
      });
    }
  }, [data, onDataChange]);

  const handleElectionsChange = useCallback((key: keyof ElectionsSelections, value: boolean) => {
    if (key === 'electionsSelected' && !value) {
      // When unchecking the main checkbox, reset all sub-selections to default
      onDataChange({
        ...data,
        elections: {
          electionsSelected: false,
          realizationBasisOfAccounting: true,
          transitionalRules: true,
          carryForwardOfLosses: true,
        },
      });
    } else {
      onDataChange({
        ...data,
        elections: {
          ...data.elections,
          [key]: value,
        },
      });
    }
  }, [data, onDataChange]);

  // Check if client is managed by FZCO (check registered_authority mapping)
  const isFZCOManaged = selectedClient && getCompanyTypeByAuthority(selectedClient.registered_authority) === 'FZCO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
        <FileCheck className="inline-block w-5 h-5 mr-2" />
        CIT Assessment and Conclusion
      </h3>

      <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* CIT Impact Assessment Performed */}
        <div>
          <motion.label 
            whileHover={{ scale: 1.01 }}
            className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={data.citImpactAssessmentPerformed}
                onChange={(e) => handleCITImpactAssessmentChange(e.target.checked)}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: data.citImpactAssessmentPerformed ? '#243F7B' : '#d1d5db',
                  backgroundColor: data.citImpactAssessmentPerformed ? '#243F7B' : 'white'
                }}
              >
                {data.citImpactAssessmentPerformed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </div>
            <span className="ml-3 text-sm font-medium" style={{ color: '#243F7B' }}>
              CIT impact assessment performed
            </span>
          </motion.label>
          
          {/* Date Picker - Show only if CIT assessment is checked */}
          {data.citImpactAssessmentPerformed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 ml-8"
            >
              <div className="w-full lg:w-1/3">
                <CustomDatePicker
                  value={data.citImpactAssessmentDate}
                  onChange={handleDateChange}
                  label="Assessment Date"
                  placeholder="dd.mm.yyyy"
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Option 1: QFZP Section - Only show if FZCO manages the client */}
        {isFZCOManaged && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t pt-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <h4 className="text-md font-semibold" style={{ color: '#243F7B' }}>
                  Option 1: QFZP (Qualified Free Zone Person) benefit
                </h4>
              </div>
              <div className="flex justify-start">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const allSelected = Object.values(data.qfzpBenefitSelections).every(value => value === true);
                    const newSelections = Object.keys(data.qfzpBenefitSelections).reduce((acc, key) => {
                      acc[key as keyof QFZPBenefitSelections] = !allSelected;
                      return acc;
                    }, {} as QFZPBenefitSelections);
                    onDataChange({
                      ...data,
                      qfzpBenefitSelections: newSelections,
                    });
                  }}
                  className="px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md h-[42px]"
                  style={{ 
                    backgroundColor: Object.values(data.qfzpBenefitSelections).every(value => value === true) ? '#D2BC99' : '#243F7B',
                    color: Object.values(data.qfzpBenefitSelections).every(value => value === true) ? '#243F7B' : 'white'
                  }}
                >
                  {Object.values(data.qfzpBenefitSelections).every(value => value === true) ? 'Uncheck All' : 'Check All'}
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'adequateSubstance' as keyof QFZPBenefitSelections, label: 'Adequate substance' },
                { key: 'derivesQualifyingIncome' as keyof QFZPBenefitSelections, label: 'Derives qualifying income' },
                { key: 'withinDeMinimis' as keyof QFZPBenefitSelections, label: 'Within de minimis' },
                { key: 'preparesTPDocumentation' as keyof QFZPBenefitSelections, label: 'Prepares and maintains TP documentation' },
                { key: 'performsAuditFinancialStatements' as keyof QFZPBenefitSelections, label: 'Performs audit of financial statements' },
                { key: 'doesNotElectStandardRules' as keyof QFZPBenefitSelections, label: 'Does not elect standard rules' },
              ].map(({ key, label }) => (
                <div key={key} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="lg:col-span-2">
                    <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                      {label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Fulfilled */}
                    <motion.label 
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={data.qfzpBenefitSelections[key]}
                          onChange={(e) => handleQFZPChange(key, e.target.checked)}
                          className="sr-only"
                        />
                        <div 
                          className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                          style={{ 
                            borderColor: data.qfzpBenefitSelections[key] ? '#243F7B' : '#d1d5db',
                            backgroundColor: data.qfzpBenefitSelections[key] ? '#243F7B' : 'white'
                          }}
                        >
                          {data.qfzpBenefitSelections[key] && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">
                        {data.qfzpBenefitSelections[key] ? 'Fulfilled' : 'Not fulfilled'}
                      </span>
                    </motion.label>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Small Business Relief (SBR) */}
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4" style={{ color: '#243F7B' }}>
            Small Business Relief (SBR)
          </h4>
          
          <div className="w-full lg:w-1/2">
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Enter amount
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-sm text-gray-500">AED</span>
              </div>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={formattedSBRAmount}
                onChange={handleSBRAmountChange}
                className="w-full pl-12 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter amount (e.g., 1,000.00)"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Thousand separated values including two decimals
            </p>
          </div>
        </div>

        {/* Non-deductible Expenses */}
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold mb-4" style={{ color: '#243F7B' }}>
            Non-deductible Expenses
          </h4>
          
          <div className="space-y-2">
            {/* Header Row */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1" style={{ flexBasis: '75%' }}>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Particulars
                </label>
              </div>
              <div className="w-1/4 min-w-0">
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Non deductible percentage
                </label>
              </div>
              <div className="w-16"></div> {/* Space for buttons */}
            </div>
            
            {/* Entries */}
            {data.nonDeductibleExpenses.map((expense, index) => {
              const hasContent = expense.particulars.trim() || expense.nonDeductiblePercentage > 0;
              const isLastEntry = index === data.nonDeductibleExpenses.length - 1;
              
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-4"
                >
                  {/* Particulars - 75% width */}
                  <div className="flex-1" style={{ flexBasis: '75%' }}>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={expense.particulars}
                      onChange={(e) => handleNonDeductibleParticularsChange(index, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                      placeholder="Enter particulars"
                      onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  
                  {/* Non-deductible Percentage - 25% width */}
                  <div className="w-1/4 min-w-0">
                    <div className="relative">
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        value={expense.nonDeductiblePercentage || ''}
                        onChange={(e) => handleNonDeductiblePercentageChange(index, e.target.value)}
                        className="w-full pr-8 pl-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                        placeholder="Enter percentage"
                        onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 w-16">
                    {/* Add Button - Show on last entry if it has content */}
                    {isLastEntry && hasContent && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAddNonDeductibleExpense}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-150"
                        title="Add new entry"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    )}
                    
                    {/* Cancel Button - Show for empty entries that are not the first one */}
                    {!hasContent && index > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveNonDeductibleExpense(index)}
                        className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-all duration-150"
                        title="Cancel this entry"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                    
                    {/* Remove Button - Show only if has content and more than 1 entry */}
                    {hasContent && data.nonDeductibleExpenses.length > 1 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveNonDeductibleExpense(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                        title="Remove entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Progressive disclosure text */}
            {(() => {
              const lastEntry = data.nonDeductibleExpenses[data.nonDeductibleExpenses.length - 1];
              const lastHasContent = lastEntry?.particulars.trim() || lastEntry?.nonDeductiblePercentage > 0;
              const hasEmptyEntries = data.nonDeductibleExpenses.some((expense, index) => 
                index > 0 && !expense.particulars.trim() && !expense.nonDeductiblePercentage
              );
              
              if (hasEmptyEntries) {
                return (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 mt-2 ml-1"
                  >
                    Use <X className="w-3 h-3 inline mx-1 text-gray-500" /> to cancel empty entries
                  </motion.p>
                );
              }
              
              if (lastHasContent && data.nonDeductibleExpenses.length < 10) {
                return (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 mt-2 ml-1"
                  >
                    Click the <Plus className="w-3 h-3 inline mx-1 text-green-600" /> to add another entry
                  </motion.p>
                );
              }
              
              return (
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  Enter percentage (0-100) for non-deductible portion
                </p>
              );
            })()}
          </div>
        </div>

        {/* Elections Section */}
        <div className="border-t pt-6">
          <motion.label 
            whileHover={{ scale: 1.01 }}
            className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={data.elections.electionsSelected}
                onChange={(e) => handleElectionsChange('electionsSelected', e.target.checked)}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: data.elections.electionsSelected ? '#243F7B' : '#d1d5db',
                  backgroundColor: data.elections.electionsSelected ? '#243F7B' : 'white'
                }}
              >
                {data.elections.electionsSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </div>
            <span className="ml-3 text-md font-semibold" style={{ color: '#243F7B' }}>
              Elections
            </span>
          </motion.label>
          
          {/* Elections Options - Show only if Elections is checked */}
          {data.elections.electionsSelected && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 ml-8 space-y-3"
            >
              {[
                { key: 'realizationBasisOfAccounting' as keyof ElectionsSelections, label: 'Realization basis of accounting' },
                { key: 'transitionalRules' as keyof ElectionsSelections, label: 'Transitional rules' },
                { key: 'carryForwardOfLosses' as keyof ElectionsSelections, label: 'Carry forward of losses' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer flex-1"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={data.elections[key]}
                        onChange={(e) => handleElectionsChange(key, e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.elections[key] ? '#243F7B' : '#d1d5db',
                          backgroundColor: data.elections[key] ? '#243F7B' : 'white'
                        }}
                      >
                        {data.elections[key] && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="ml-3 text-sm font-medium" style={{ color: '#243F7B' }}>
                      {label}
                    </span>
                  </motion.label>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CITAssessmentConclusionSection;