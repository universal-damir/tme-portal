'use client';

import React from 'react';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { VisaCancelationField } from './VisaCancelationField';

/**
 * Configuration for dependent visa types
 */
interface DependentVisaConfig {
  title: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    ring: string;
  };
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
  }>;
  visaCancelationLabel: string;
}

/**
 * Configurations for different dependent types
 */
const DEPENDENT_CONFIGS: Record<'spouse' | 'children', DependentVisaConfig> = {
  spouse: {
    title: 'Spouse Authority Costs Breakdown',
    colorScheme: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-800',
      ring: 'focus:ring-pink-500',
    },
    fields: [
      { key: 'professionalPassportPicture', label: 'Professional Passport Picture', placeholder: '25.00' },
      { key: 'dependentFileOpening', label: 'Dependent File Opening', placeholder: '320.00' },
      { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test', placeholder: '700.00' },
      { key: 'emiratesIdFee', label: 'Emirates ID Fee', placeholder: '1,155.00' },
      { key: 'immigrationResidencyFeeSpouse', label: 'Immigration - Residency Fee (Spouse)', placeholder: '2,860.00' },
      { key: 'thirdPartyCosts', label: 'Third Party Costs', placeholder: '1,460.00' },
    ],
    visaCancelationLabel: 'Visa Cancelation (AED 185)',
  },
  children: {
    title: 'Children Authority Costs Breakdown (per child)',
    colorScheme: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      ring: 'focus:ring-purple-500',
    },
    fields: [
      { key: 'professionalPassportPicture', label: 'Professional Passport Picture', placeholder: '25.00' },
      { key: 'dependentFileOpening', label: 'Dependent File Opening (if spouse not selected)', placeholder: '320.00' },
      { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test', placeholder: '700.00' },
      { key: 'emiratesIdFee', label: 'Emirates ID Fee', placeholder: '1,155.00' },
      { key: 'immigrationResidencyFeeChild', label: 'Immigration - Residency Fee (Child)', placeholder: '2,750.00' },
      { key: 'thirdPartyCosts', label: 'Third Party Costs', placeholder: '1,460.00' },
    ],
    visaCancelationLabel: 'Visa Cancelation (AED 185 per child)',
  },
};

interface DependentVisaCardProps {
  /**
   * Type of dependent (spouse or children)
   */
  type: 'spouse' | 'children';
  
  /**
   * Current authority fee data
   */
  authorityFees: Record<string, number | undefined>;
  
  /**
   * Current visa cancelation state
   */
  visaCancelation: boolean;
  
  /**
   * Current visa cancelation fee
   */
  visaCancelationFee?: number;
  
  /**
   * Handler for authority fee field changes
   */
  onAuthorityFeeChange: (field: string, value: number) => void;
  
  /**
   * Handler for visa cancelation checkbox changes
   */
  onVisaCancelationChange: (checked: boolean) => void;
  
  /**
   * Handler for visa cancelation fee changes
   */
  onVisaCancelationFeeChange: (fee: number) => void;
}

export const DependentVisaCard: React.FC<DependentVisaCardProps> = ({
  type,
  authorityFees,
  visaCancelation,
  visaCancelationFee,
  onAuthorityFeeChange,
  onVisaCancelationChange,
  onVisaCancelationFeeChange,
}) => {
  const config = DEPENDENT_CONFIGS[type];

  return (
    <div className={`${config.colorScheme.bg} ${config.colorScheme.border} rounded-lg p-4`}>
      <h4 className={`text-sm font-semibold ${config.colorScheme.text} mb-3`}>
        {config.title}
      </h4>
      
      {/* Authority Fee Fields */}
      <div className="grid grid-cols-1 gap-4">
        {config.fields.map((field) => (
          <NumberInputField
            key={field.key}
            label={field.label}
            value={authorityFees[field.key]}
            onChange={(value) => onAuthorityFeeChange(field.key, value)}
            placeholder={field.placeholder}
            className={config.colorScheme.ring}
          />
        ))}
      </div>
      
      {/* Visa Cancelation Section */}
      <div className="mt-4">
        <VisaCancelationField
          checked={visaCancelation}
          onCheckedChange={onVisaCancelationChange}
          fee={visaCancelationFee}
          onFeeChange={onVisaCancelationFeeChange}
          label={config.visaCancelationLabel}
        />
      </div>
    </div>
  );
}; 