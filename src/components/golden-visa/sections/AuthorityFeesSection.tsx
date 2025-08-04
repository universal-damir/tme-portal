'use client';

import React from 'react';
import { Building2, FileText } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { AuthorityFeeBreakdown } from '../ui/AuthorityFeeBreakdown';
import { NumberInputField } from '../../portal/tabs/NumberInputField';

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

  // Handler for visa cancellation checkbox
  const handleVisaCancellationChange = (checked: boolean) => {
    onFieldChange(`${config.dataPath}.visaCancellation`, checked);
  };

  // Handler for visa cancellation fee
  const handleVisaCancellationFeeChange = (fee: number) => {
    onFieldChange(`${config.dataPath}.visaCancellationFee`, fee);
  };

  // Handler for TME services fee
  const handleTMEServicesChange = (value: number) => {
    onFieldChange('tmeServicesFee', value);
  };

  return (
    <div className="space-y-6">
      {/* Authority Costs Section */}
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
          onVisaCancellationChange={handleVisaCancellationChange}
          onVisaCancellationFeeChange={handleVisaCancellationFeeChange}
        />
      </FormSection>

      {/* TME Professional Services Section */}
      <FormSection
        title="TME Professional Service Fee"
        description="Professional service fees for Golden Visa processing"
        icon={FileText}
        iconColor="text-slate-600"
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="max-w-sm">
            <NumberInputField
              label="TME Professional Service Fee (AED)"
              value={data.tmeServicesFee}
              onChange={handleTMEServicesChange}
              placeholder="4,820"
              className="focus:ring-slate-500"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
};