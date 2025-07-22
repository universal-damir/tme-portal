'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { AuthorityFeeBreakdown } from '../ui/AuthorityFeeBreakdown';

import { GoldenVisaType, GoldenVisaData } from '@/types/golden-visa';

/**
 * Configuration for section titles and descriptions per visa type
 */
const SECTION_CONFIG = {
  'property-investment': {
    title: 'Authority Costs Breakdown',
    description: 'Detailed breakdown of authority costs for Property Investment Golden Visa',
    iconColor: 'text-purple-600',
    dataPath: 'propertyAuthorityFees',
  },
  'time-deposit': {
    title: 'Authority Costs Breakdown',
    description: 'Detailed breakdown of authority costs for Time Deposit Golden Visa',
    iconColor: 'text-orange-600',
    dataPath: 'skilledEmployeeAuthorityFees', // Same structure as skilled employee (no DLD)
  },
  'skilled-employee': {
    title: 'Authority Costs Breakdown',
    description: 'Detailed breakdown of authority costs for Skilled Employee Golden Visa',
    iconColor: 'text-green-600',
    dataPath: 'skilledEmployeeAuthorityFees',
  },
} as const;

interface AuthorityFeesSectionProps {
  /**
   * Current visa type to determine which authority fees to show
   */
  visaType: GoldenVisaType;
  
  /**
   * Current form data
   */
  data: GoldenVisaData;
  
  /**
   * Handler for field value changes
   * @param path - The field path (e.g., 'propertyAuthorityFees.professionalPassportPicture')
   * @param value - The new value
   */
  onFieldChange: (path: string, value: number | boolean) => void;
}

export const AuthorityFeesSection: React.FC<AuthorityFeesSectionProps> = ({
  visaType,
  data,
  onFieldChange,
}) => {
  // Don't render if visa type doesn't have authority fees or primary visa is not required
  if (!SECTION_CONFIG[visaType] || !data.primaryVisaRequired) {
    return null;
  }

  const config = SECTION_CONFIG[visaType];
  const authorityData = data[config.dataPath as keyof GoldenVisaData] as Record<string, number | boolean | undefined> || {};

  // Handler for field changes with proper path construction
  const handleFieldChange = (field: string, value: number) => {
    onFieldChange(`${config.dataPath}.${field}`, value);
  };

  // Handler for visa cancelation checkbox
  const handleVisaCancelationChange = (checked: boolean) => {
    onFieldChange(`${config.dataPath}.visaCancelation`, checked);
  };

  // Handler for visa cancelation fee
  const handleVisaCancelationFeeChange = (fee: number) => {
    onFieldChange(`${config.dataPath}.visaCancelationFee`, fee);
  };

  return (
    <FormSection
      title={config.title}
      description={config.description}
      icon={Building2}
      iconColor={config.iconColor}
    >
      <AuthorityFeeBreakdown
        visaType={visaType}
        data={authorityData}
        onFieldChange={handleFieldChange}
        onVisaCancelationChange={handleVisaCancelationChange}
        onVisaCancelationFeeChange={handleVisaCancelationFeeChange}
      />
    </FormSection>
  );
}; 