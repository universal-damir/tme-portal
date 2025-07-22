import React from 'react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import { User } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';
import { FormSection } from '../ui/FormSection';

interface VisaCostsSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  authorityConfig: AuthorityConfig;
  visaDetailsArray: UseFieldArrayReturn<OfferData, 'visaCosts.visaDetails', 'id'>;
}

export const VisaCostsSection: React.FC<VisaCostsSectionProps> = ({
  register,
  errors,
  watchedData,
  authorityConfig
}) => {
  const { id: authorityId, visaCosts } = authorityConfig;
  const healthInsurance = visaCosts?.healthInsurance;

  // For reduced visas: maximum 1 (independent of investor visas)
  const maxReducedVisas = 1;

  // Only show if authority supports visas
  if (!visaCosts) {
    return null;
  }

  return (
    <FormSection
      title="Visa Costs"
      description="Visa application and related services"
      icon={User}
      iconColor="text-blue-600"
    >
      <div className="space-y-8">
        {/* Basic Visa Information */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Basic Visa Information
          </h3>
          
          {/* IFZA: Two fields in one row */}
          {authorityId === 'ifza' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Number of Visas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Visas
                </label>
                <input
                  type="number"
                  min="0"
                  max={watchedData.ifzaLicense?.visaQuota || 0}
                  {...register('visaCosts.numberOfVisas', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the number of visas required - Maximum: {watchedData.ifzaLicense?.visaQuota || 0} (based on visa quota)
                </p>
                {errors.visaCosts?.numberOfVisas && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaCosts.numberOfVisas.message}</p>
                )}
              </div>



              {/* Reduced Visa Cost (Visa Free for Life) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reduced Visa Cost (Visa Free for Life)
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxReducedVisas}
                  {...register('visaCosts.reducedVisaCost', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Only 1 visa can be reduced cost and free for life (AED {(visaCosts.standardVisaFee - visaCosts.reducedVisaFee).toLocaleString()} reduction)
                </p>
                {errors.visaCosts?.reducedVisaCost && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaCosts.reducedVisaCost.message}</p>
                )}
              </div>
            </div>
          ) : (
            /* DET: Two fields layout */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Number of Visas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Visas
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('visaCosts.numberOfVisas', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the number of visas required
                </p>
                {errors.visaCosts?.numberOfVisas && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaCosts.numberOfVisas.message}</p>
                )}
              </div>




            </div>
          )}
        </div>

        {/* Per-Visa Services (Combined Health Insurance & Additional Services) */}
        {(watchedData.visaCosts?.numberOfVisas || 0) > 0 && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Per-Visa Services & Options
            </h3>
            
            {/* Per-Visa Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: authorityId === 'det' ? (watchedData.visaCosts?.numberOfVisas || 0) : Math.min(watchedData.visaCosts?.numberOfVisas || 0, watchedData.ifzaLicense?.visaQuota || 0) }, (_, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Visa {index + 1} Services
                  </h4>
                  
                  {/* Health Insurance for this visa */}
                  {healthInsurance && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Health Insurance *
                      </label>
                      <select
                        {...register(`visaCosts.visaDetails.${index}.healthInsurance`)}
                        defaultValue="No Insurance"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="No Insurance">No Insurance</option>
                        <option value="Low Cost">Low Cost (AED {healthInsurance.lowCost.toLocaleString()})</option>
                        <option value="Silver Package">Silver Package (AED {healthInsurance.silverPackage.toLocaleString()})</option>
                      </select>
                      {errors.visaCosts?.visaDetails?.[index]?.healthInsurance && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.visaCosts.visaDetails[index]?.healthInsurance?.message}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Investor/Employment Visa for this visa - DET vs IFZA */}
                  {(authorityId === 'det' || (visaCosts?.investorVisaFee && visaCosts.investorVisaFee > 0)) && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        {authorityId === 'det' 
                          ? 'Investor visa/Employment Visa' 
                          : `Investor Visa (AED ${visaCosts?.investorVisaFee?.toLocaleString()})`}
                      </label>
                      <select
                        {...register(`visaCosts.visaDetails.${index}.investorVisa`)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        {authorityId === 'det' ? (
                          <>
                            <option value="">Select visa type</option>
                            <option value="true">Investor Visa</option>
                            <option value="employment">Employment Visa</option>
                          </>
                        ) : (
                          <>
                            <option value="">No Investor Visa</option>
                            <option value="true">Enable Investor Visa</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                  
                  {/* Status Change for this visa */}
                  {visaCosts.statusChangeFee && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Status Change (AED {visaCosts.statusChangeFee.toLocaleString()})
                      </label>
                      <select
                        {...register(`visaCosts.visaDetails.${index}.statusChange`)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="">No Status Change</option>
                        <option value="true">Enable Status Change</option>
                      </select>
                    </div>
                  )}
                  
                  {/* VIP Stamping for this visa */}
                  {visaCosts.vipStampingFee && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        VIP Stamping (AED {visaCosts.vipStampingFee.toLocaleString()})
                      </label>
                      <select
                        {...register(`visaCosts.visaDetails.${index}.vipStamping`)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="">No VIP Stamping</option>
                        <option value="true">Enable VIP Stamping</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Configure services and options for each visa holder individually
            </p>
          </div>
        )}

        
      </div>
    </FormSection>
  );
}; 