'use client';

import React from 'react';
import { CheckSquare } from 'lucide-react';
import { ConfAccDocsSelections } from '@/types/cit-return-letters';

interface ConfAccDocsSelectionSectionProps {
  selections: ConfAccDocsSelections;
  onSelectionsChange: (selections: ConfAccDocsSelections) => void;
}

const ConfAccDocsSelectionSection: React.FC<ConfAccDocsSelectionSectionProps> = ({
  selections,
  onSelectionsChange,
}) => {

  const handleCheckboxChange = (field: keyof ConfAccDocsSelections, value: boolean | string) => {
    onSelectionsChange({
      ...selections,
      [field]: value,
    });
  };

  const CheckboxItem = ({ 
    checked, 
    onChange, 
    label 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
  }) => (
    <div className="flex items-center gap-2 py-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(!checked);
        }}
        className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0"
        style={{ 
          borderColor: checked ? '#243F7B' : '#d1d5db', 
          backgroundColor: checked ? '#243F7B' : 'white' 
        }}
      >
        {checked && <CheckSquare className="w-2.5 h-2.5 text-white" />}
      </button>
      <label 
        className="text-sm font-medium cursor-pointer flex-1"
        style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(!checked);
        }}
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        <CheckboxItem
          checked={selections.revenuesAndExpenses}
          onChange={(checked) => handleCheckboxChange('revenuesAndExpenses', checked)}
          label="Revenues and expenses"
        />

        <CheckboxItem
          checked={selections.nonDeductibleExpenses}
          onChange={(checked) => handleCheckboxChange('nonDeductibleExpenses', checked)}
          label="Non-deductible expenses"
        />

        <CheckboxItem
          checked={selections.waiverSalaryGratuity}
          onChange={(checked) => handleCheckboxChange('waiverSalaryGratuity', checked)}
          label="Waiver of salary and gratuity expenses"
        />

        <CheckboxItem
          checked={selections.assetsAndLiabilities}
          onChange={(checked) => handleCheckboxChange('assetsAndLiabilities', checked)}
          label="Assets and liabilities"
        />

        <CheckboxItem
          checked={selections.ifrs9FinancialInstruments}
          onChange={(checked) => handleCheckboxChange('ifrs9FinancialInstruments', checked)}
          label="IFRS 9 Financial instruments"
        />

        <CheckboxItem
          checked={selections.ifrs16Leases}
          onChange={(checked) => handleCheckboxChange('ifrs16Leases', checked)}
          label="IFRS 16 Leases"
        />

        {/* Other Point Section */}
        <div className="border-t border-gray-200 pt-4">
          <CheckboxItem
            checked={selections.otherPointSelected}
            onChange={(checked) => {
              // Update all related fields in one call
              if (!checked) {
                // When unchecking, clear everything
                onSelectionsChange({
                  ...selections,
                  otherPointSelected: false,
                  otherPointName: '',
                  otherPointText: '',
                });
              } else {
                // When checking, just set the checkbox
                handleCheckboxChange('otherPointSelected', true);
              }
            }}
            label="Other point"
          />
          
          {selections.otherPointSelected && (
            <div
              className="mt-3 space-y-3 pl-8"
            >
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Point Name
                </label>
                <input
                  type="text"
                  value={selections.otherPointName}
                  onChange={(e) => handleCheckboxChange('otherPointName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="Enter point name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Point Description
                </label>
                <textarea
                  value={selections.otherPointText}
                  onChange={(e) => handleCheckboxChange('otherPointText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 min-h-[84px]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="Enter point description..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div
          className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6"
        >
          <h4 className="text-sm font-medium text-blue-900 mb-2">Selection Summary</h4>
          <div className="text-xs text-blue-700">
            {[
              selections.revenuesAndExpenses && 'Revenues and expenses',
              selections.nonDeductibleExpenses && 'Non-deductible expenses',
              selections.waiverSalaryGratuity && 'Waiver of salary and gratuity expenses',
              selections.assetsAndLiabilities && 'Assets and liabilities',
              selections.ifrs9FinancialInstruments && 'IFRS 9 Financial instruments',
              selections.ifrs16Leases && 'IFRS 16 Leases',
              selections.otherPointSelected && `${selections.otherPointName || 'Other point'}`
            ].filter(Boolean).join(', ') || 'No points selected'}
          </div>
        </div>
    </div>
  );
};

export default ConfAccDocsSelectionSection;