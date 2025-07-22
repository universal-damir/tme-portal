'use client';

import React, { useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface BackOfficeServicesSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current form data for reactive display
   */
  data: CompanyServicesData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
}

// Team size configurations with pricing tiers
const TEAM_CONFIGURATIONS = {
  micro: {
    label: 'Micro Team',
    tiers: [
      { staffRange: '1–2 staff', monthlyFee: 500 },
      { staffRange: '3–4 staff', monthlyFee: 960 },
      { staffRange: '5–6 staff', monthlyFee: 1374 },
    ]
  },
  small: {
    label: 'Small Team',
    tiers: [
      { staffRange: '1–3 staff', monthlyFee: 750 },
      { staffRange: '4–6 staff', monthlyFee: 1440 },
      { staffRange: '7–10 staff', monthlyFee: 2280 },
    ]
  },
  medium: {
    label: 'Medium Team',
    tiers: [
      { staffRange: '1–4 staff', monthlyFee: 980 },
      { staffRange: '5–6 staff', monthlyFee: 1440 },
      { staffRange: '7–8 staff', monthlyFee: 1860 },
    ]
  },
  large: {
    label: 'Large Team',
    tiers: [
      { staffRange: '1-5 staff', monthlyFee: 1250 },
      { staffRange: '6-10 staff', monthlyFee: 2400 },
      { staffRange: '11-15 staff', monthlyFee: 3412 },
      { staffRange: '16-20 staff', monthlyFee: 4273 },
    ]
  },
};

export const BackOfficeServicesSection: React.FC<BackOfficeServicesSectionProps> = ({
  register,
  errors,
  data,
  setValue,
  watchedData,
}) => {
  // Reset back-office fields when main checkbox is unchecked
  useEffect(() => {
    if (!watchedData.backOfficeServices?.enabled) {
      setValue('backOfficeServices.teamSize', '');
    }
  }, [watchedData.backOfficeServices?.enabled, setValue]);

  // Get current team configuration
  const currentTeamConfig = useMemo(() => {
    const teamSize = watchedData.backOfficeServices?.teamSize;
    if (teamSize && TEAM_CONFIGURATIONS[teamSize as keyof typeof TEAM_CONFIGURATIONS]) {
      return TEAM_CONFIGURATIONS[teamSize as keyof typeof TEAM_CONFIGURATIONS];
    }
    return null;
  }, [watchedData.backOfficeServices?.teamSize]);

  // Calculate secondary currency values
  const getSecondaryCurrencyValue = (aedValue: number) => {
    const exchangeRate = watchedData.exchangeRate || 3.67;
    return Math.round(aedValue / exchangeRate);
  };

  const secondaryCurrencySymbol = watchedData.secondaryCurrency === 'EUR' ? '€' : 
    watchedData.secondaryCurrency === 'GBP' ? '£' : '$';

  return (
    <FormSection
      title="Back-Office (PRO) Services"
      description="Comprehensive administrative support for government-related processes"
      icon={Users}
      iconColor="text-blue-600"
    >
      <div className="space-y-6">
        {/* Main Back-Office Services Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('backOfficeServices.enabled')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Back-Office (PRO) Services
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Select to include comprehensive administrative support for government-related processes
          </p>
        </div>

        {/* Back-Office Options - Show only if enabled */}
        {watchedData.backOfficeServices?.enabled && (
          <div className="space-y-6 pl-6 border-l-2 border-blue-200">
            {/* Team Size Selection */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Team Size Selection
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Team Size
                  </label>
                  <select
                    {...register('backOfficeServices.teamSize')}
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select team size...</option>
                    <option value="micro">1-2 | 3-4 | 5-6 | Staff</option>
                    <option value="small">1-3 | 4-6 | 7-10 | Staff</option>
                    <option value="medium">1-4 | 5-6 | 7-8 | Staff</option>
                    <option value="large">1-5 | 6-10 | 11-15 | 16-20 | Staff</option>
                  </select>
                  {errors.backOfficeServices?.teamSize && (
                    <p className="text-red-500 text-sm mt-1">{errors.backOfficeServices.teamSize.message}</p>
                  )}
                                 </div>
              </div>
            </div>

            {/* Pricing Table - Show only if team size is selected */}
            {currentTeamConfig && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  {currentTeamConfig.label} - Monthly Pricing
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                          Team Size
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                          Monthly Fee (AED)
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                          Monthly Fee ({watchedData.secondaryCurrency === 'EUR' ? 'EUR' : watchedData.secondaryCurrency === 'GBP' ? 'GBP' : 'USD'})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTeamConfig.tiers.map((tier, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {tier.staffRange}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">
                            {tier.monthlyFee.toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">
                            {getSecondaryCurrencyValue(tier.monthlyFee).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">
                    📋 Note: All pricing is based on monthly fees with a 12-month minimum commitment requirement.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
}; 