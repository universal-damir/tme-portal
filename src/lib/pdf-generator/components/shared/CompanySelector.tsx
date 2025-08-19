'use client';

import React, { useState } from 'react';
import { getAllBrandingOptions } from '../../branding';

export interface CompanySelectorProps {
  value?: 'tme-fzco' | 'management-consultants';
  onChange: (brandingId: 'tme-fzco' | 'management-consultants') => void;
  authority?: string;
  disabled?: boolean;
  className?: string;
}

// CompanySelector - UI component for selecting company branding
// Used in forms to allow users to choose which company entity should be used
export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onChange,
  authority,
  disabled = false,
  className = ''
}) => {
  const brandingOptions = getAllBrandingOptions();
  
  // Filter options based on authority if provided
  const availableOptions = authority 
    ? brandingOptions.filter(option => option.authorities.includes(authority))
    : brandingOptions;

  // Auto-select if only one option is available
  React.useEffect(() => {
    if (availableOptions.length === 1 && !value) {
      onChange(availableOptions[0].id);
    }
  }, [availableOptions, value, onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Company Entity
      </label>
      
      <div className="space-y-2">
        {availableOptions.map((option) => (
          <label key={option.id} className="flex items-center space-x-3">
            <input
              type="radio"
              name="company-branding"
              value={option.id}
              checked={value === option.id}
              onChange={(e) => onChange(e.target.value as 'tme-fzco' | 'management-consultants')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {option.name}
              </div>
              <div className="text-xs text-gray-500">
                {option.legalName}
              </div>
              <div className="text-xs text-gray-400">
                For: {option.authorities.join(', ')}
              </div>
            </div>
          </label>
        ))}
      </div>
      
      {availableOptions.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          No company options available for the selected authority.
        </div>
      )}
      
      {authority && availableOptions.length === 1 && (
        <div className="text-xs text-blue-600">
          Automatically selected based on authority: {authority}
        </div>
      )}
    </div>
  );
};

// Hook for managing company selection state
export const useCompanySelection = (initialAuthority?: string) => {
  const [selectedCompany, setSelectedCompany] = useState<'tme-fzco' | 'management-consultants' | undefined>(undefined);
  
  // Auto-select based on authority
  React.useEffect(() => {
    if (initialAuthority) {
      const brandingOptions = getAllBrandingOptions();
      const matchingOption = brandingOptions.find(option => 
        option.authorities.includes(initialAuthority)
      );
      if (matchingOption) {
        setSelectedCompany(matchingOption.id);
      }
    }
  }, [initialAuthority]);

  return {
    selectedCompany,
    setSelectedCompany,
    isAutoSelected: Boolean(initialAuthority)
  };
}; 