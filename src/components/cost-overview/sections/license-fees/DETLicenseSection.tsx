import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/authorities/types';
import { TMECheckbox } from '../../ui/TMECheckbox';

interface DETLicenseSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  setValue: UseFormSetValue<OfferData>;
  authorityConfig: AuthorityConfig;
  formatNumberWithSeparators: (value: string) => string;
  parseFormattedNumber: (value: string) => number;
}

export const DETLicenseSection: React.FC<DETLicenseSectionProps> = ({
  register,
  errors,
  watchedData,
  setValue,
  authorityConfig,
  formatNumberWithSeparators,
  parseFormattedNumber
}) => {
  const { clientDetails } = watchedData;
  const { initialSetup } = authorityConfig;
  const [isLicenseTypeOpen, setIsLicenseTypeOpen] = useState(false);
  const [isRentTypeOpen, setIsRentTypeOpen] = useState(false);
  const [hasManuallyEditedDeposit, setHasManuallyEditedDeposit] = useState(false);

  const licenseTypeOptions = [
    { value: 'commercial', label: 'Commercial (AED 13,000)', fee: 13000 },
    { value: 'commercial-real-estate', label: 'Commercial Real Estate (AED 24,000)', fee: 24000 },
    { value: 'commercial-investment', label: 'Commercial Investment (AED 30,000)', fee: 30000 },
    { value: 'instant', label: 'Instant License (AED 13,000)', fee: 13000 },
    { value: 'industrial', label: 'Industrial (AED 20,000)', fee: 20000 },
    { value: 'professional', label: 'Professional (AED 10,000)', fee: 10000 }
  ];

  const rentTypeOptions = [
    { value: 'business-center', label: 'Business Center', description: 'Shared business address' },
    { value: 'office', label: 'Office', description: 'Dedicated office space' },
    { value: 'warehouse', label: 'Warehouse', description: 'Industrial/storage space' },
    { value: 'showroom', label: 'Showroom', description: 'Retail/display space' }
  ];

  // Set default TME Services fee based on setup type
  useEffect(() => {
    const defaultFee = clientDetails?.companySetupType === 'Individual Setup' 
      ? 11550  // Individual Setup
      : 33600; // Corporate Shareholder
    if (defaultFee > 0) {
      setValue('detLicense.tmeServicesFee', defaultFee);
    }
  }, [clientDetails?.companySetupType, watchedData.detLicense?.tmeServicesFee, setValue]);

  // Set default office rent amount based on rent type
  useEffect(() => {
    if (watchedData.detLicense?.rentType && !watchedData.detLicense?.officeRentAmount) {
      setValue('detLicense.officeRentAmount', initialSetup.defaultOfficeRent || 12000);
    }
  }, [watchedData.detLicense?.rentType, watchedData.detLicense?.officeRentAmount, initialSetup]);

  // Auto-calculate landlord deposit as 5% of rent amount when rent amount changes
  useEffect(() => {
    if (watchedData.detLicense?.rentType && 
        watchedData.detLicense?.rentType !== 'business-center' &&
        watchedData.detLicense?.officeRentAmount &&
        !hasManuallyEditedDeposit) {
      const calculatedDeposit = Math.round(watchedData.detLicense.officeRentAmount * 0.05);
      setValue('detLicense.landlordDepositAmount', calculatedDeposit);
    }
  }, [watchedData.detLicense?.officeRentAmount, hasManuallyEditedDeposit, setValue]);

  // Clear landlord deposit when rent type changes to business center or is cleared
  useEffect(() => {
    if (!watchedData.detLicense?.rentType || watchedData.detLicense?.rentType === 'business-center') {
      setValue('detLicense.landlordDepositAmount', 0);
      setHasManuallyEditedDeposit(false); // Reset manual edit flag
    }
  }, [watchedData.detLicense?.rentType, setValue]);

  return (
    <div className="space-y-3">
      {/* License Type and Rent Type Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* License Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            License Type *
          </label>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsLicenseTypeOpen(!isLicenseTypeOpen)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <span className={watchedData.detLicense?.licenseType ? 'text-gray-900' : 'text-gray-500'}>
                {watchedData.detLicense?.licenseType 
                  ? licenseTypeOptions.find(option => option.value === watchedData.detLicense?.licenseType)?.label
                  : 'Choose license type...'}
              </span>
              <motion.div
                animate={{ rotate: isLicenseTypeOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.button>
            
            {isLicenseTypeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
              >
                {licenseTypeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => {
                      setValue('detLicense.licenseType', option.value as any);
                      setIsLicenseTypeOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
          {errors.detLicense?.licenseType && (
            <p className="text-red-500 text-xs mt-1">{errors.detLicense.licenseType.message}</p>
          )}
        </div>

        {/* Rent Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            Office Requirements *
          </label>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsRentTypeOpen(!isRentTypeOpen)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <span className={watchedData.detLicense?.rentType ? 'text-gray-900' : 'text-gray-500'}>
                {watchedData.detLicense?.rentType
                  ? rentTypeOptions.find(option => option.value === watchedData.detLicense?.rentType)?.label
                  : 'Choose office type...'}
              </span>
              <motion.div
                animate={{ rotate: isRentTypeOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.button>
            
            {isRentTypeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
              >
                {rentTypeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => {
                      setValue('detLicense.rentType', option.value as any);
                      setIsRentTypeOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                  >
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
          {errors.detLicense?.rentType && (
            <p className="text-red-500 text-xs mt-1">{errors.detLicense.rentType.message}</p>
          )}
        </div>
      </div>

      {/* Office Rent Amount and Deposits */}
      {watchedData.detLicense?.rentType && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="space-y-4">
            {/* Rent Amount and Landlord Deposit - Side by side for non-business-center */}
            {watchedData.detLicense.rentType === 'business-center' ? (
              // Business center - only service fee
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                  Annual Service Fee (AED)
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={watchedData.detLicense?.officeRentAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.officeRentAmount || 0))}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseFormattedNumber(value);
                  setValue('detLicense.officeRentAmount', parsed);
                  }}
                  className="w-1/2 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  placeholder="12,000"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#243F7B';
                    e.target.select();
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            ) : (
              // Office, warehouse, showroom - rent and deposit side by side
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                    Annual Rent (AED)
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={watchedData.detLicense?.officeRentAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.officeRentAmount || 0))}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFormattedNumber(value);
                    setValue('detLicense.officeRentAmount', parsed);
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                    placeholder="12,000"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#243F7B';
                      e.target.select();
                    }}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                    Landlord Deposit (AED)
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={watchedData.detLicense?.landlordDepositAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.landlordDepositAmount || 0))}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = parseFormattedNumber(value);
                      setValue('detLicense.landlordDepositAmount', parsed);
                      setHasManuallyEditedDeposit(true); // Mark as manually edited
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                    placeholder={watchedData.detLicense?.officeRentAmount ? 
                      Math.round(watchedData.detLicense.officeRentAmount * 0.05).toLocaleString() : 
                      "Auto-calculated (5% of rent)"}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#243F7B';
                      e.target.select();
                    }}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            )}

            {/* DEWA Deposit Information */}
            {watchedData.detLicense.rentType !== 'business-center' && (
              <p className="text-xs text-gray-600">
                {watchedData.detLicense.rentType === 'office' && `DEWA deposit: AED 2,000`}
                {(watchedData.detLicense.rentType === 'warehouse' || watchedData.detLicense.rentType === 'showroom') && `DEWA deposit: AED 4,000`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Additional Services and Government Fees - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Additional Services */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          
          <div className="space-y-2">
            {/* Document Services for Corporate */}
            {clientDetails?.companySetupType === 'Corporate Setup' && (
              <>
                {initialSetup.mofaTranslations.ownersDeclaration && (
                  <TMECheckbox
                    name="detLicense.mofaOwnersDeclaration"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.detLicense?.mofaOwnersDeclaration || false}
                    label="OD - Owner's Declaration Translation"
                    cost={initialSetup.mofaTranslations.ownersDeclaration.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.certificateOfIncorporation && (
                  <TMECheckbox
                    name="detLicense.mofaCertificateOfIncorporation"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.detLicense?.mofaCertificateOfIncorporation || false}
                    label="CoIncorp - Certificate of Incorporation Translation"
                    cost={initialSetup.mofaTranslations.certificateOfIncorporation.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.memorandumOrArticles && (
                  <TMECheckbox
                    name="detLicense.mofaActualMemorandumOrArticles"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.detLicense?.mofaActualMemorandumOrArticles || false}
                    label="MoA/AoA - Memorandum/Articles Translation"
                    cost={initialSetup.mofaTranslations.memorandumOrArticles.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.commercialRegister && (
                  <TMECheckbox
                    name="detLicense.mofaCommercialRegister"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.detLicense?.mofaCommercialRegister || false}
                    label="CR - Commercial Register Translation"
                    cost={initialSetup.mofaTranslations.commercialRegister.toLocaleString()}
                  />
                )}
              </>
            )}

            {/* Power of Attorney for Individual */}
            {clientDetails?.companySetupType === 'Individual Setup' && initialSetup.mofaTranslations.powerOfAttorney && (
              <TMECheckbox
                name="detLicense.mofaPowerOfAttorney"
                register={register}
                setValue={setValue}
                checked={watchedData.detLicense?.mofaPowerOfAttorney || false}
                label="Power Of Attorney"
                cost={initialSetup.mofaTranslations.powerOfAttorney.toLocaleString()}
              />
            )}

          </div>
        </div>

        {/* Government Fees & Third-party Costs */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          
          <div className="space-y-4">
            {/* Third-party Approval */}
            <div className="space-y-2">
              <TMECheckbox
                name="detLicense.thirdPartyApproval"
                register={register}
                setValue={setValue}
                checked={watchedData.detLicense?.thirdPartyApproval || false}
                label="Third-party Approval (NOC)"
              />
              {watchedData.detLicense?.thirdPartyApproval && (
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={watchedData.detLicense?.thirdPartyApprovalAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.thirdPartyApprovalAmount || 0))}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseFormattedNumber(value);
                    setValue('detLicense.thirdPartyApprovalAmount', parsed);
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  placeholder="Enter amount"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#243F7B';
                    e.target.select();
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Services - TME Fee and Price Reduction */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        
        <div className="space-y-3">
          {/* TME Services Professional Fee */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
              TME Services Professional Fee (AED)
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={formatNumberWithSeparators(String(watchedData.detLicense?.tmeServicesFee || 
                (clientDetails?.companySetupType === 'Individual Setup' 
                  ? 11550 
                  : 33600)))}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseFormattedNumber(value);
                setValue('detLicense.tmeServicesFee', parsed);
              }}
              className="w-1/2 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {errors.detLicense?.tmeServicesFee && (
              <p className="text-red-500 text-xs mt-1">{errors.detLicense.tmeServicesFee.message}</p>
            )}
          </div>

          {/* Apply Price Reduction */}
          <div className="space-y-2">
            <TMECheckbox
              name="detLicense.applyPriceReduction"
              register={register}
              setValue={setValue}
              checked={watchedData.detLicense?.applyPriceReduction || false}
              label="Apply Price Reduction"
            />
            {watchedData.detLicense?.applyPriceReduction && (
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={watchedData.detLicense?.reductionAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.detLicense?.reductionAmount || 0))}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsed = parseFormattedNumber(value);
                  setValue('detLicense.reductionAmount', parsed);
                }}
                className="w-1/2 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Reduction amount"
                onFocus={(e) => {
                  e.target.style.borderColor = '#243F7B';
                  e.target.select();
                }}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};