'use client';

import React from 'react';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { VisaCancellationField } from './VisaCancellationField';
import { FileOpeningField } from './FileOpeningField';

/**
 * Configuration for dependent visa types - simplified structure
 */
interface DependentVisaConfig {
  title: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    ring: string;
  };
  authorityFields: Array<{
    key: string;
    label: string;
    placeholder: string;
  }>;
  visaCancellationLabel: string;
}

/**
 * Simplified configurations for different dependent types
 */
const DEPENDENT_CONFIGS: Record<'spouse' | 'children', DependentVisaConfig> = {
  spouse: {
    title: 'Spouse Authority Costs Breakdown',
    colorScheme: {
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      text: 'text-slate-800',
      ring: 'focus:ring-slate-500',
    },
    authorityFields: [
      { key: 'standardAuthorityCostsSpouse', label: 'Standard Authority Costs', placeholder: '4,710' },
      { key: 'thirdPartyCostsSpouse', label: 'Third Party Costs', placeholder: '1,086' },
    ],
    visaCancellationLabel: 'Visa cancellation (AED 186)',
  },
  children: {
    title: 'Children Authority Costs Breakdown (per child)',
    colorScheme: {
      bg: 'bg-slate-200',
      border: 'border-slate-400',
      text: 'text-slate-800',
      ring: 'focus:ring-slate-500',
    },
    authorityFields: [
      { key: 'standardAuthorityCostsChild', label: 'Standard Authority Costs', placeholder: '4,604' },
      { key: 'thirdPartyCostsChild', label: 'Third Party Costs', placeholder: '911' },
    ],
    visaCancellationLabel: 'Visa cancellation (AED 186 per child)',
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
   * Current visa cancellation state
   */
  visaCancellation?: boolean;
  
  /**
   * Current visa cancellation fee
   */
  visaCancellationFee?: number;
  
  /**
   * Current file opening state
   */
  fileOpening?: boolean;
  
  /**
   * Whether file opening checkbox is disabled
   */
  fileOpeningDisabled?: boolean;
  
  /**
   * Current selected visa type - used to conditionally show third party costs
   */
  visaType?: string;
  
  /**
   * Handler for authority fee field changes
   */
  onAuthorityFeeChange: (field: string, value: number) => void;
  
  /**
   * Handler for visa cancellation checkbox changes
   */
  onVisaCancellationChange: (checked: boolean) => void;
  
  /**
   * Handler for visa cancellation fee changes
   */
  onVisaCancellationFeeChange?: (fee: number) => void;
  
  /**
   * Handler for file opening checkbox changes
   */
  onFileOpeningChange?: (checked: boolean) => void;
}

export const DependentVisaCard: React.FC<DependentVisaCardProps> = ({
  type,
  authorityFees,
  visaCancellation = false,
  visaCancellationFee = 0,
  fileOpening = false,
  fileOpeningDisabled = false,
  visaType,
  onAuthorityFeeChange,
  onVisaCancellationChange,
  onVisaCancellationFeeChange,
  onFileOpeningChange,
}) => {
  const config = DEPENDENT_CONFIGS[type];
  const { colorScheme } = config;
  
  // Filter fields to only show third party costs for property investment visa
  const filteredFields = config.authorityFields.filter(field => {
    // Always show standard authority costs
    if (field.key.includes('standardAuthority')) {
      return true;
    }
    // Only show third party costs for property investment visa
    if (field.key.includes('thirdPartyCosts')) {
      return visaType === 'property-investment';
    }
    return true;
  });
  
  return (
    <div 
      className={`p-6 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border} space-y-6`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <h3 className={`text-lg font-semibold ${colorScheme.text}`}>
        {config.title}
      </h3>
      
      {/* File Opening Section */}
      {onFileOpeningChange && (
        <FileOpeningField
          checked={fileOpening}
          disabled={fileOpeningDisabled}
          onCheckedChange={onFileOpeningChange}
          label={`Dependent File Opening (AED 319) - ${type === 'spouse' ? 'Spouse' : 'First Child'}`}
          description="One-time fee for opening dependent visa file."
        />
      )}

      {/* Authority Fee Fields */}
      <div className="space-y-4">
        {filteredFields.map((field) => (
          <div key={field.key} className="max-w-sm">
            <NumberInputField
              label={field.label}
              value={authorityFees[field.key] as number}
              onChange={(value) => onAuthorityFeeChange(field.key, value)}
              placeholder={field.placeholder}
              className={colorScheme.ring}
            />
          </div>
        ))}
      </div>

      {/* Visa Cancellation Section */}
      <VisaCancellationField
        checked={visaCancellation}
        onCheckedChange={onVisaCancellationChange}
        fee={visaCancellationFee}
        onFeeChange={onVisaCancellationFeeChange}
        label={config.visaCancellationLabel}
        description="Check the box if visa cancellation is required"
      />

    </div>
  );
};