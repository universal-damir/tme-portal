import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/authorities/types';
import { FormSection } from '../ui/FormSection';
import { CostInputField } from '../ui/CostInputField';
import { FormattedInputState, FormattedInputHandlers } from '../hooks/useFormattedInputs';

interface LicenseFeesSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  setValue: UseFormSetValue<OfferData>;
  authorityConfig: AuthorityConfig;
  formatNumberWithSeparators: (value: string) => string;
  parseFormattedNumber: (value: string) => number;
}

export const LicenseFeesSection: React.FC<LicenseFeesSectionProps> = ({
  register,
  errors,
  watchedData,
  setValue,
  authorityConfig,
  formatNumberWithSeparators,
  parseFormattedNumber
}) => {
  const { clientDetails } = watchedData;
  const { id: authorityId, initialSetup } = authorityConfig;

  // Clear deposit amount when checkbox is unchecked (IFZA only)
  useEffect(() => {
    if (authorityId === 'ifza' && !watchedData.ifzaLicense?.depositWithLandlord && watchedData.ifzaLicense?.depositAmount) {
      setValue('ifzaLicense.depositAmount', 0);
    }
  }, [authorityId, watchedData.ifzaLicense?.depositWithLandlord]);

  // Set default TME Services fee based on authority and setup type
  useEffect(() => {
    if (authorityId === 'ifza') {
      const defaultFee = clientDetails?.companySetupType === 'Individual Setup' 
        ? initialSetup.individualTmeServicesFee || initialSetup.defaultTmeServicesFee
        : initialSetup.defaultTmeServicesFee;
      // Always update the fee when setup type changes, or when fee is not set
      if (defaultFee > 0) {
        setValue('ifzaLicense.tmeServicesFee', defaultFee);
      }
    }
    if (authorityId === 'det') {
      const defaultFee = clientDetails?.companySetupType === 'Individual Setup' 
        ? initialSetup.individualTmeServicesFee || initialSetup.defaultTmeServicesFee
        : initialSetup.defaultTmeServicesFee;
      // Always update the fee when setup type changes, or when fee is not set
      if (defaultFee > 0) {
        setValue('detLicense.tmeServicesFee', defaultFee);
      }
    }
  }, [authorityId, clientDetails?.companySetupType, watchedData.ifzaLicense?.tmeServicesFee, watchedData.detLicense?.tmeServicesFee, initialSetup]);

  // Remove auto-fill for DET office rent - let user input manually like IFZA deposit

  // IFZA-specific rendering
  if (authorityId === 'ifza') {
    return (
      <FormSection
        title={`${authorityConfig.displayName} License Fee`}
        description="License fees and additional services"
        icon={FileText}
        iconColor="text-green-600"
      >
        <div className="space-y-8">
          {/* Basic License Configuration */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Basic License Configuration
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Number of License Years */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of License Years
                </label>
                <select
                  {...register('ifzaLicense.licenseYears', { valueAsNumber: true })}
                  className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                >
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                  <option value={5}>5 years</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Multi-year licenses include discounts: 2yr (-15%), 3yr (-20%), 5yr (-30%)
                </p>
                {errors.ifzaLicense?.licenseYears && (
                  <p className="text-red-500 text-sm mt-1">{errors.ifzaLicense.licenseYears.message}</p>
                )}
              </div>

              {/* Visa Quota */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Visa Quota
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('ifzaLicense.visaQuota', { valueAsNumber: true })}
                  className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Base: AED 12,900 + AED 2,000 per visa
                </p>
                {errors.ifzaLicense?.visaQuota && (
                  <p className="text-red-500 text-sm mt-1">{errors.ifzaLicense.visaQuota.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* IFZA Cross Border Fee */}
          {initialSetup.crossBorderLicense && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                IFZA Cross Border Fee
              </h3>
              
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('ifzaLicense.crossBorderLicense')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Add Cross Border Fee
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Additional AED 2,000. Enables conducting both professional and commercial activities.
                </p>
              </div>
            </div>
          )}

          {/* Document Services (MoFA Translations) */}
          {Object.keys(initialSetup.mofaTranslations).length > 0 && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {clientDetails?.companySetupType === 'Individual Setup' 
                  ? 'Power Of Attorney Services' 
                  : clientDetails?.companySetupType === 'Corporate Setup' 
                  ? 'Document Translation Services' 
                  : 'Document Services (MoFA Translations)'}
              </h3>
              
              <div className="space-y-3">
                {clientDetails?.companySetupType === 'Corporate Setup' && (
                  <>
                    {initialSetup.mofaTranslations.ownersDeclaration && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('ifzaLicense.mofaOwnersDeclaration')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Owner's Declaration Translation (+AED {initialSetup.mofaTranslations.ownersDeclaration.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.certificateOfIncorporation && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('ifzaLicense.mofaCertificateOfIncorporation')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Certificate of Incorporation Translation (+AED {initialSetup.mofaTranslations.certificateOfIncorporation.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.memorandumOrArticles && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('ifzaLicense.mofaActualMemorandumOrArticles')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Actual Memorandum of Association or Articles of Association Translation (+AED {initialSetup.mofaTranslations.memorandumOrArticles.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.commercialRegister && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('ifzaLicense.mofaCommercialRegister')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Actual Commercial Register Translation (+AED {initialSetup.mofaTranslations.commercialRegister.toLocaleString()})
                        </span>
                      </label>
                    )}
                  </>
                )}
                {clientDetails?.companySetupType === 'Individual Setup' && initialSetup.mofaTranslations.powerOfAttorney && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('ifzaLicense.mofaPowerOfAttorney')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Power Of Attorney (+AED {initialSetup.mofaTranslations.powerOfAttorney.toLocaleString()})
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Office & Location Services */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Office & Location Services
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rent Office Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rent Office Required from Authority
                </label>
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    {...register('ifzaLicense.rentOfficeRequired')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Rent office from authority
                  </span>
                </label>
                {watchedData.ifzaLicense?.rentOfficeRequired && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Office Rent Amount (AED)
                    </label>
                    <input
                      type="text"
                      value={watchedData.ifzaLicense?.officeRentAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.officeRentAmount || 0))}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseFormattedNumber(value);
                        setValue('ifzaLicense.officeRentAmount', parsed);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                      placeholder="30,000"
                    />
                  </div>
                )}
              </div>

              {/* Deposit with Landlord */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Deposit with the Landlord
                </label>
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    {...register('ifzaLicense.depositWithLandlord')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Deposit with the Landlord
                  </span>
                </label>
                {watchedData.ifzaLicense?.depositWithLandlord && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deposit Amount (AED)
                    </label>
                    <input
                      type="text"
                      value={watchedData.ifzaLicense?.depositAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.depositAmount || 0))}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseFormattedNumber(value);
                        setValue('ifzaLicense.depositAmount', parsed);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                      placeholder="10,000"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Security deposit required by the landlord
                </p>
              </div>
            </div>
          </div>

          {/* Additional Services & Fees */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Additional Services & Fees
            </h3>
            
            <div className="space-y-6">
              {/* Activities Required Third-party Approval */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Activities Required Third-party Approval (NOC)
                </label>
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    {...register('ifzaLicense.thirdPartyApproval')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Requires third-party approval (NOC)
                  </span>
                </label>
                {watchedData.ifzaLicense?.thirdPartyApproval && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Third-party Approval Amount (AED)
                    </label>
                    <input
                      type="text"
                      value={watchedData.ifzaLicense?.thirdPartyApprovalAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.thirdPartyApprovalAmount || 0))}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseFormattedNumber(value);
                        setValue('ifzaLicense.thirdPartyApprovalAmount', parsed);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                      placeholder="Enter amount"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-green-200">
                {/* TME Services Professional Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TME Services Professional Fee (AED)
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithSeparators(String(watchedData.ifzaLicense?.tmeServicesFee || 
                      (clientDetails?.companySetupType === 'Individual Setup' 
                        ? initialSetup.individualTmeServicesFee 
                        : initialSetup.defaultTmeServicesFee)))}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFormattedNumber(value);
                      setValue('ifzaLicense.tmeServicesFee', parsed);
                    }}
                    className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                    placeholder="Enter service fee amount"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Fee based on setup type: Individual AED {initialSetup.individualTmeServicesFee?.toLocaleString()} / Corporate AED {initialSetup.defaultTmeServicesFee.toLocaleString()}
                  </p>
                  {errors.ifzaLicense?.tmeServicesFee && (
                    <p className="text-red-500 text-sm mt-1">{errors.ifzaLicense.tmeServicesFee.message}</p>
                  )}
                </div>

                {/* Apply Price Reduction */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price Reduction
                  </label>
                  <label className="flex items-center cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      {...register('ifzaLicense.applyPriceReduction')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Apply price reduction
                    </span>
                  </label>
                  {watchedData.ifzaLicense?.applyPriceReduction && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reduction Amount (AED)
                      </label>
                      <input
                        type="text"
                        value={watchedData.ifzaLicense?.reductionAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.reductionAmount || 0))}
                        onChange={(e) => {
                          const value = e.target.value;
                          const parsed = parseFormattedNumber(value);
                          setValue('ifzaLicense.reductionAmount', parsed);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                        placeholder="Enter reduction amount"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    );
  }

  // DET-specific rendering
  if (authorityId === 'det') {
    return (
      <FormSection
        title={`${authorityConfig.displayName} License Fee`}
        description="License fees and government registrations"
        icon={FileText}
        iconColor="text-orange-600"
      >
        <div className="space-y-8">
          {/* DET License Type Selection */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              DET License Type *
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select License Type *
              </label>
              <select
                {...register('detLicense.licenseType')}
                className="max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
              >
                <option value="">Select License Type</option>
                <option value="commercial">Commercial (AED 13,000)</option>
                <option value="commercial-real-estate">Commercial Real Estate (AED 24,000)</option>
                <option value="commercial-investment">Comm Investment (Holding) (AED 30,000)</option>
                <option value="instant">Instant (AED 13,000)</option>
                <option value="industrial">Industrial (AED 20,000)</option>
                <option value="professional">Professional (AED 10,000)</option>
              </select>
              {errors.detLicense?.licenseType && (
                <p className="text-red-500 text-sm mt-2">{errors.detLicense.licenseType.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Select the appropriate license type for your business activities
              </p>
            </div>
          </div>

          {/* Document Services (MoFA Translations) */}
          {Object.keys(initialSetup.mofaTranslations).length > 0 && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {clientDetails?.companySetupType === 'Individual Setup' 
                  ? 'Power Of Attorney Services' 
                  : clientDetails?.companySetupType === 'Corporate Setup' 
                  ? 'Document Translation Services' 
                  : 'Document Services (MoFA Translations)'}
              </h3>
              
              <div className="space-y-3">
                {clientDetails?.companySetupType === 'Corporate Setup' && (
                  <>
                    {initialSetup.mofaTranslations.ownersDeclaration && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('detLicense.mofaOwnersDeclaration')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Owner's Declaration Translation (+AED {initialSetup.mofaTranslations.ownersDeclaration.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.certificateOfIncorporation && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('detLicense.mofaCertificateOfIncorporation')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Certificate of Incorporation Translation (+AED {initialSetup.mofaTranslations.certificateOfIncorporation.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.memorandumOrArticles && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('detLicense.mofaActualMemorandumOrArticles')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Actual Memorandum of Association or Articles of Association Translation (+AED {initialSetup.mofaTranslations.memorandumOrArticles.toLocaleString()})
                        </span>
                      </label>
                    )}
                    {initialSetup.mofaTranslations.commercialRegister && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('detLicense.mofaCommercialRegister')}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Actual Commercial Register Translation (+AED {initialSetup.mofaTranslations.commercialRegister.toLocaleString()})
                        </span>
                      </label>
                    )}
                  </>
                )}
                {clientDetails?.companySetupType === 'Individual Setup' && initialSetup.mofaTranslations.powerOfAttorney && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('detLicense.mofaPowerOfAttorney')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Power Of Attorney Cost (+AED {initialSetup.mofaTranslations.powerOfAttorney.toLocaleString()})
                    </span>
                  </label>
                )}
              </div>
              
            </div>
          )}

          {/* Office & Location Services (Mandatory for DET) */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Office & Location Services (Mandatory)
            </h3>
            
            <div className="space-y-6">
              {/* Rent Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Office Type *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="business-center"
                      {...register('detLicense.rentType')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Business Center Arrangement
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="office"
                      {...register('detLicense.rentType')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Office Rent
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="warehouse"
                      {...register('detLicense.rentType')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Warehouse Rent
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Suggested amount for any selection: AED {initialSetup.defaultOfficeRent?.toLocaleString()}
                </p>
              </div>

              {/* Office Rent Amount */}
              {watchedData.detLicense?.rentType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {watchedData.detLicense.rentType === 'business-center' ? 'Business Center' :
                     watchedData.detLicense.rentType === 'office' ? 'Office' : 'Warehouse'} Rent Amount (AED)
                  </label>
                  <input
                    type="text"
                    value={(!watchedData.detLicense?.officeRentAmount || watchedData.detLicense?.officeRentAmount === 0) ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.officeRentAmount))}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFormattedNumber(value);
                      setValue('detLicense.officeRentAmount', parsed);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                    placeholder="12,000"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Suggested rent amount: AED {initialSetup.defaultOfficeRent?.toLocaleString()}
                  </p>

                  {/* Deposits Information */}
                  <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Automatic Deposits Applied:</h4>
                    
                    {/* Landlord Deposit */}
                    {watchedData.detLicense.rentType !== 'business-center' && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Landlord Deposit (5% of rent):</span>
                        <span className="text-sm font-medium text-gray-900">
                          AED {Math.round((watchedData.detLicense?.officeRentAmount || 0) * 0.05).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {/* DEWA Deposit */}
                    {watchedData.detLicense.rentType === 'office' && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">DEWA Deposit:</span>
                        <span className="text-sm font-medium text-gray-900">AED {initialSetup.dewaDepositOffice?.toLocaleString()}</span>
                      </div>
                    )}
                    {watchedData.detLicense.rentType === 'warehouse' && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">DEWA Deposit:</span>
                        <span className="text-sm font-medium text-gray-900">AED {initialSetup.dewaDepositWarehouse?.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {watchedData.detLicense.rentType === 'business-center' && (
                      <p className="text-sm text-gray-600">No deposits required for Business Center arrangement</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Services & Fees */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Additional Services & Fees
            </h3>
            
            <div className="space-y-6">
              {/* Activities Required Third-party Approval */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Activities Required Third-party Approval
                </label>
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    {...register('detLicense.thirdPartyApproval')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Requires third-party approval
                  </span>
                </label>
                {watchedData.detLicense?.thirdPartyApproval && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Third-party Approval Amount (AED)
                    </label>
                    <input
                      type="text"
                      value={(!watchedData.detLicense?.thirdPartyApprovalAmount || watchedData.detLicense?.thirdPartyApprovalAmount === 0) ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.thirdPartyApprovalAmount))}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseFormattedNumber(value);
                        setValue('detLicense.thirdPartyApprovalAmount', parsed);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                      placeholder="Enter amount"
                    />
                  </div>
                )}
              </div>



              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-green-200">
                {/* TME Services Professional Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TME Services Professional Fee (AED)
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithSeparators(String(watchedData.detLicense?.tmeServicesFee || 
                      (clientDetails?.companySetupType === 'Corporate Setup' 
                        ? initialSetup.defaultTmeServicesFee 
                        : initialSetup.individualTmeServicesFee)))}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFormattedNumber(value);
                      setValue('detLicense.tmeServicesFee', parsed);
                    }}
                    className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                    placeholder="Enter service fee amount"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Fee based on setup type:  Individual (AED {initialSetup.individualTmeServicesFee?.toLocaleString()}) / Corporate (AED {initialSetup.defaultTmeServicesFee.toLocaleString()})
                  </p>
                  {errors.detLicense?.tmeServicesFee && (
                    <p className="text-red-500 text-sm mt-1">{errors.detLicense.tmeServicesFee.message}</p>
                  )}
                </div>

                {/* Apply Price Reduction */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price Reduction
                  </label>
                  <label className="flex items-center cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      {...register('detLicense.applyPriceReduction')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Apply price reduction
                    </span>
                  </label>
                  {watchedData.detLicense?.applyPriceReduction && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reduction Amount (AED)
                      </label>
                      <input
                        type="text"
                        value={(!watchedData.detLicense?.reductionAmount || watchedData.detLicense?.reductionAmount === 0) ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.reductionAmount))}
                        onChange={(e) => {
                          const value = e.target.value;
                          const parsed = parseFormattedNumber(value);
                          setValue('detLicense.reductionAmount', parsed);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="max-w-xs px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white focus:bg-white"
                        placeholder="Enter reduction amount"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    );
  }

  // Placeholder for other authorities
  return (
    <FormSection
      title={`${authorityConfig.displayName} License Fee`}
      description="License fees and additional services"
      icon={FileText}
      iconColor="text-orange-600"
    >
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <p className="text-gray-600">
          License fee configuration for {authorityConfig.displayName} will be implemented here.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Base License Fee: AED {initialSetup.baseLicenseFee.toLocaleString()}
        </p>
      </div>
    </FormSection>
  );
}; 