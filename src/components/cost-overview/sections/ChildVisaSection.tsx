import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';

interface ChildVisaSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  authorityConfig: AuthorityConfig;
  setValue: UseFormSetValue<OfferData>;
}

export const ChildVisaSection: React.FC<ChildVisaSectionProps> = ({
  register,
  errors,
  watchedData,
  authorityConfig,
  setValue
}) => {
  const { visaCosts } = authorityConfig;
  const healthInsurance = visaCosts?.healthInsurance;

  // Reset child visa related fields when childVisa is unchecked
  useEffect(() => {
    if (!watchedData.visaCosts?.childVisa) {
      setValue('visaCosts.numberOfChildVisas', 0);
      setValue('visaCosts.childVisaStatusChange', 0);
      setValue('visaCosts.childVisaVipStamping', 0);
      // Reset child visa details array
      setValue('visaCosts.childVisaDetails', []);
    }
  }, [watchedData.visaCosts?.childVisa, setValue]);

  // Only show this section if authority supports child visas
  if (!visaCosts?.childVisaStandardFee) {
    return null;
  }

  return (
    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
        Child Visas
      </h3>
      
      <div className="space-y-6">
        {/* Child Visa Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('visaCosts.childVisa')}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Child Visa
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Select number of children and configure options below
          </p>
        </div>

        {/* Child Visa Options - Show only if child visa is checked */}
        {watchedData.visaCosts?.childVisa && (
          <div className="space-y-6 pl-6 border-l-2 border-purple-200">
            {/* Number of Child Visas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Child Visas
              </label>
              <input
                type="number"
                min="1"
                {...register('visaCosts.numberOfChildVisas', { valueAsNumber: true })}
                className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                placeholder="1"
              />
              {errors.visaCosts?.numberOfChildVisas && (
                <p className="text-red-500 text-sm mt-1">{errors.visaCosts.numberOfChildVisas.message}</p>
              )}
            </div>

            {/* Child Visa Health Insurance - Show only if number of children > 0 */}
            {(watchedData.visaCosts?.numberOfChildVisas || 0) > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Child Visa Health Insurance</h4>
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: watchedData.visaCosts?.numberOfChildVisas || 0 }, (_, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-purple-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Child {index + 1} Insurance
                      </label>
                      <select
                        {...register(`visaCosts.childVisaDetails.${index}.healthInsurance`)}
                        defaultValue="No Insurance"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="No Insurance">No Insurance</option>
                        <option value="Low Cost">Low Cost (AED {healthInsurance?.lowCost.toLocaleString()})</option>
                        <option value="Silver Package">Silver Package (AED {healthInsurance?.silverPackage.toLocaleString()})</option>
                      </select>
                      {errors.visaCosts?.childVisaDetails?.[index]?.healthInsurance && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.visaCosts.childVisaDetails[index]?.healthInsurance?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Child Visa Status Change - Show only if number of children > 0 */}
            {(watchedData.visaCosts?.numberOfChildVisas || 0) > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Child Visas for Status Change
                </label>
                <input
                  type="number"
                  min="0"
                  max={watchedData.visaCosts?.numberOfChildVisas || 0}
                  {...register('visaCosts.childVisaStatusChange', { valueAsNumber: true })}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum: {watchedData.visaCosts?.numberOfChildVisas || 0} (AED {visaCosts?.statusChangeFee?.toLocaleString()} per visa)
                </p>
                {errors.visaCosts?.childVisaStatusChange && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaCosts.childVisaStatusChange.message}</p>
                )}
              </div>
            )}

            {/* Child Visa VIP Stamping - Show only if number of children > 0 */}
            {(watchedData.visaCosts?.numberOfChildVisas || 0) > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Child Visas for VIP Stamping
                </label>
                <input
                  type="number"
                  min="0"
                  max={watchedData.visaCosts?.numberOfChildVisas || 0}
                  {...register('visaCosts.childVisaVipStamping', { valueAsNumber: true })}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum: {watchedData.visaCosts?.numberOfChildVisas || 0} (AED {visaCosts?.vipStampingFee?.toLocaleString()} per visa)
                </p>
                {errors.visaCosts?.childVisaVipStamping && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaCosts.childVisaVipStamping.message}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 