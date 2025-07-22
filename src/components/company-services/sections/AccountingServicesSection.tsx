'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { 
  ServiceTypeSelector,
  TransactionTierSelector,
  PricingDisplay,
  AdditionalServiceCard,
  AnnualServiceCard,
  CommercialServiceCard,
} from '../ui';
import { useAccountingPricing, useAccountingDefaults } from '../hooks';

interface AccountingServicesSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
}

export const AccountingServicesSection: React.FC<AccountingServicesSectionProps> = ({
  register,
  errors,
  setValue,
  watchedData,
}) => {
  // Use custom hooks for pricing and defaults
  const { transactionTiers, combinedDisplayTiers } = useAccountingPricing(watchedData);
  useAccountingDefaults(watchedData, setValue);

  return (
    <FormSection
      title="Accounting Services"
      description="Financial accounting with trial balance and P&L statements"
      icon={Calculator}
      iconColor="text-purple-600"
    >
      <div className="space-y-6">
        {/* Main Accounting Services Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('accountingServices.enabled')}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Accounting Services
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Financial accounting services with trial balance and P&L statements
          </p>
        </div>

        {/* Accounting Options - Show only if enabled */}
        {watchedData.accountingServices?.enabled && (
          <div className="space-y-8 pl-6 border-l-2 border-purple-200">
            <ServiceTypeSelector 
              register={register} 
              errors={errors}
              value={watchedData.accountingServices?.serviceType}
              onValueChange={(value) => setValue('accountingServices.serviceType', value as '' | 'monthly' | 'quarterly-yearly')}
            />
            
            <TransactionTierSelector
              register={register}
              errors={errors}
              transactionTiers={transactionTiers}
              serviceType={watchedData.accountingServices?.serviceType}
              value={watchedData.accountingServices?.transactionTier}
              onValueChange={(value) => setValue('accountingServices.transactionTier', value)}
            />

            <PricingDisplay
              serviceType={watchedData.accountingServices?.serviceType || ''}
              displayTiers={combinedDisplayTiers}
            />

            <AdditionalServiceCard register={register} />

            <AnnualServiceCard 
              register={register} 
              errors={errors} 
              setValue={setValue}
              watchedData={watchedData}
            />

            <CommercialServiceCard 
              register={register} 
              errors={errors} 
              watchedData={watchedData} 
              setValue={setValue}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}; 