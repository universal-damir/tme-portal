'use client';

import React from 'react';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { VisaCancellationField } from './VisaCancellationField';
import { VISA_TYPE_COLORS, getFieldPlaceholder } from '../utils/goldenVisaConfig';
import { GoldenVisaType } from '@/types/golden-visa';

/**
 * Configuration for authority fee fields
 */
interface AuthorityFeeField {
  key: string;
  label: string;
  placeholder: string;
}

/**
 * Field configurations for different visa types - simplified structure
 */
const FIELD_CONFIGS: Record<GoldenVisaType, AuthorityFeeField[]> = {
  'property-investment': [
    {
      key: 'dldApprovalFee',
      label: 'DLD (Dubai Land Department) Approval Cost',
      placeholder: '4,020.00',
    },
    {
      key: 'standardAuthorityCosts',
      label: 'Standard Authority Costs',
      placeholder: '5,010',
    },
    {
      key: 'thirdPartyCosts',
      label: 'Third Party Costs',
      placeholder: '1,385.00',
    },
  ],
  'time-deposit': [
    {
      key: 'standardAuthorityCosts',
      label: 'Standard Authority Costs',
      placeholder: '5,010',
    },
  ],
  'skilled-employee': [
    {
      key: 'standardAuthorityCosts',
      label: 'Standard Authority Costs',
      placeholder: '5,010',
    },
  ],
};

interface AuthorityFeeBreakdownProps {
  /**
   * The visa type to determine field configuration and colors
   */
  visaType: GoldenVisaType;
  
  /**
   * Current authority fee data
   */
  data: Record<string, number | boolean | undefined>;
  
  /**
   * Handler for field value changes
   * @param field - The field key that changed
   * @param value - The new value
   */
  onFieldChange: (field: string, value: number) => void;
  
  /**
   * Handler for visa cancellation checkbox changes
   */
  onVisaCancellationChange: (checked: boolean) => void;
  
  /**
   * Handler for visa cancellation fee changes
   */
  onVisaCancellationFeeChange?: (fee: number) => void;
}

export const AuthorityFeeBreakdown: React.FC<AuthorityFeeBreakdownProps> = ({
  visaType,
  data,
  onFieldChange,
  onVisaCancellationChange,
  onVisaCancellationFeeChange,
}) => {
  const colors = VISA_TYPE_COLORS[visaType];
  const fields = FIELD_CONFIGS[visaType];
  const ringClass = colors.ring;

  return (
    <div className="space-y-6">
      {/* Authority Fee Fields with Visa Cancellation in same row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="max-w-sm">
            <NumberInputField
              label={field.label}
              value={data[field.key] as number}
              onChange={(value) => onFieldChange(field.key, value)}
              placeholder={field.placeholder}
              className={ringClass}
            />
          </div>
        ))}
        
        {/* Visa Cancellation Field - Now in the same grid */}
        <div className="max-w-sm">
          <VisaCancellationField
            checked={data.visaCancellation as boolean || false}
            onCheckedChange={onVisaCancellationChange}
            fee={data.visaCancellationFee as number}
            onFeeChange={onVisaCancellationFeeChange}
            label="Visa Cancellation (AED 186)"
            description="Check the box if visa cancellation is required"
          />
        </div>
      </div>
    </div>
  );
};