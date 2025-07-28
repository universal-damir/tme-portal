'use client';

import React from 'react';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { VisaCancelationField } from './VisaCancelationField';
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
 * Field configurations for different visa types
 */
const FIELD_CONFIGS: Record<GoldenVisaType, AuthorityFeeField[]> = {
  'property-investment': [
    {
      key: 'professionalPassportPicture',
      label: 'Professional Passport Picture',
      placeholder: '25.00',
    },
    {
      key: 'dldApprovalFee',
      label: 'DLD (Dubai Land Department) Approval Cost',
      placeholder: '4,020.00',
    },
    {
      key: 'mandatoryUaeMedicalTest',
      label: 'Mandatory UAE Medical Test',
      placeholder: '700.00',
    },
    {
      key: 'emiratesIdFee',
      label: 'Emirates ID Cost',
      placeholder: '1,155.00',
    },
    {
      key: 'immigrationResidencyFee',
      label: 'Immigration - Residency Cost',
      placeholder: '3,160.00',
    },
    {
      key: 'thirdPartyCosts',
      label: 'Third Party Costs',
      placeholder: '1,460.00',
    },
  ],
  'time-deposit': [
    {
      key: 'professionalPassportPicture',
      label: 'Professional Passport Picture',
      placeholder: '25.00',
    },
    {
      key: 'mandatoryUaeMedicalTest',
      label: 'Mandatory UAE Medical Test',
      placeholder: '700.00',
    },
    {
      key: 'emiratesIdFee',
      label: 'Emirates ID Cost',
      placeholder: '1,155.00',
    },
    {
      key: 'immigrationResidencyFee',
      label: 'Immigration - Residency Cost',
      placeholder: '3,160.00',
    },
    {
      key: 'thirdPartyCosts',
      label: 'Third Party Costs',
      placeholder: '1,460.00',
    },
  ],
  'skilled-employee': [
    {
      key: 'professionalPassportPicture',
      label: 'Professional Passport Picture',
      placeholder: '25.00',
    },
    {
      key: 'mandatoryUaeMedicalTest',
      label: 'Mandatory UAE Medical Test',
      placeholder: '700.00',
    },
    {
      key: 'emiratesIdFee',
      label: 'Emirates ID Cost',
      placeholder: '1,155.00',
    },
    {
      key: 'immigrationResidencyFee',
      label: 'Immigration - Residency Cost',
      placeholder: '3,160.00',
    },
    {
      key: 'thirdPartyCosts',
      label: 'Third Party Costs',
      placeholder: '1,460.00',
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
   * Handler for visa cancelation checkbox changes
   */
  onVisaCancelationChange: (checked: boolean) => void;
  
  /**
   * Handler for visa cancelation fee changes
   */
  onVisaCancelationFeeChange?: (fee: number) => void;
}

export const AuthorityFeeBreakdown: React.FC<AuthorityFeeBreakdownProps> = ({
  visaType,
  data,
  onFieldChange,
  onVisaCancelationChange,
  onVisaCancelationFeeChange,
}) => {
  const colors = VISA_TYPE_COLORS[visaType];
  const fields = FIELD_CONFIGS[visaType];
  const ringClass = colors.ring;

  return (
    <div className="space-y-6">
      {/* Authority Fee Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {fields.map((field) => (
          <NumberInputField
            key={field.key}
            label={field.label}
            value={data[field.key] as number}
            onChange={(value) => onFieldChange(field.key, value)}
            placeholder={field.placeholder}
            className={ringClass}
          />
        ))}
      </div>

      {/* Visa Cancelation Section - constrained to match grid column width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisaCancelationField
          checked={data.visaCancelation as boolean || false}
          onCheckedChange={onVisaCancelationChange}
          fee={data.visaCancelationFee as number}
          onFeeChange={onVisaCancelationFeeChange}
        />
        <div></div> {/* Empty div to maintain grid structure */}
      </div>
    </div>
  );
}; 