import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';

interface SpouseVisaSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  authorityConfig: AuthorityConfig;
  setValue: UseFormSetValue<OfferData>;
}

export const SpouseVisaSection: React.FC<SpouseVisaSectionProps> = ({
  register,
  errors,
  watchedData,
  authorityConfig,
  setValue
}) => {
  const { visaCosts } = authorityConfig;
  const healthInsurance = visaCosts?.healthInsurance;

  // Reset spouse visa related fields when spouseVisa is unchecked
  useEffect(() => {
    if (!watchedData.visaCosts?.spouseVisa) {
      setValue('visaCosts.spouseVisaInsurance', 'No Insurance');
      setValue('visaCosts.spouseVisaStatusChange', false);
      setValue('visaCosts.spouseVisaVipStamping', false);
    }
  }, [watchedData.visaCosts?.spouseVisa, setValue]);

  // Only show this section if authority supports spouse visas
  if (!visaCosts?.spouseVisaStandardFee) {
    return null;
  }

  return (
    <div className="bg-pink-50 rounded-xl p-6 border border-pink-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
        Spouse Visa
      </h3>
      
      <div className="space-y-6">
        {/* Spouse Visa Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('visaCosts.spouseVisa')}
              className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Spouse Visa
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Unrelated to number of visas, no validation needed
          </p>
        </div>

        {/* Spouse Visa Options - Show only if spouse visa is checked */}
        {watchedData.visaCosts?.spouseVisa && (
          <div className="space-y-6 pl-6 border-l-2 border-pink-200">
            {/* Spouse Visa Insurance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Spouse Visa Health Insurance
              </label>
              <select
                {...register('visaCosts.spouseVisaInsurance')}
                defaultValue="No Insurance"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="No Insurance">No Insurance</option>
                <option value="Low Cost">Low Cost (AED {healthInsurance?.lowCost.toLocaleString()})</option>
                <option value="Silver Package">Silver Package (AED {healthInsurance?.silverPackage.toLocaleString()})</option>
              </select>
              {errors.visaCosts?.spouseVisaInsurance && (
                <p className="text-red-500 text-sm mt-1">{errors.visaCosts.spouseVisaInsurance.message}</p>
              )}
            </div>

            {/* Spouse Visa Status Change */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('visaCosts.spouseVisaStatusChange')}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Spouse Visa Status Change (AED {visaCosts?.statusChangeFee?.toLocaleString()})
                </span>
              </label>
            </div>

            {/* Spouse Visa VIP Stamping */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('visaCosts.spouseVisaVipStamping')}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Spouse Visa VIP Stamping (AED {visaCosts?.vipStampingFee?.toLocaleString()})
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 