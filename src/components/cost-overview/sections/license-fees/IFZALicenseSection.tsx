import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/authorities/types';
import { TMECheckbox } from '../../ui/TMECheckbox';

interface IFZALicenseSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  setValue: UseFormSetValue<OfferData>;
  authorityConfig: AuthorityConfig;
  formatNumberWithSeparators: (value: string) => string;
  parseFormattedNumber: (value: string) => number;
}

export const IFZALicenseSection: React.FC<IFZALicenseSectionProps> = ({
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
  const [isLicenseYearsOpen, setIsLicenseYearsOpen] = useState(false);

  const licenseYearOptions = [
    { value: 1, label: '1 year' },
    { value: 2, label: '2 years (-15%)' },
    { value: 3, label: '3 years (-20%)' },
    { value: 5, label: '5 years (-30%)' }
  ];

  // Clear deposit amount when checkbox is unchecked
  useEffect(() => {
    if (!watchedData.ifzaLicense?.depositWithLandlord && watchedData.ifzaLicense?.depositAmount) {
      setValue('ifzaLicense.depositAmount', 0);
    }
  }, [watchedData.ifzaLicense?.depositWithLandlord]);

  // Set default TME Services fee
  useEffect(() => {
    const defaultFee = clientDetails?.companySetupType === 'Individual Setup' 
      ? initialSetup.individualTmeServicesFee || initialSetup.defaultTmeServicesFee
      : initialSetup.defaultTmeServicesFee;
    if (defaultFee > 0) {
      setValue('ifzaLicense.tmeServicesFee', defaultFee);
    }
  }, [clientDetails?.companySetupType, watchedData.ifzaLicense?.tmeServicesFee, initialSetup]);

  return (
    <div className="space-y-3">
      {/* Basic Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            License Years
          </label>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsLicenseYearsOpen(!isLicenseYearsOpen)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <span className="text-gray-900">
                {licenseYearOptions.find(option => option.value === (watchedData.ifzaLicense?.licenseYears || 1))?.label || '1 year'}
              </span>
              <motion.div
                animate={{ rotate: isLicenseYearsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.button>
            
            {isLicenseYearsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
              >
                {licenseYearOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => {
                      setValue('ifzaLicense.licenseYears', option.value);
                      setIsLicenseYearsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
          {errors.ifzaLicense?.licenseYears && (
            <p className="text-red-500 text-xs mt-1">{errors.ifzaLicense.licenseYears.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
            Visa Quota
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="number"
            min="0"
            {...register('ifzaLicense.visaQuota', { valueAsNumber: true })}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            placeholder="0"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p className="text-xs text-gray-600 mt-1">AED 12,900 + AED 2,000 per visa</p>
          {errors.ifzaLicense?.visaQuota && (
            <p className="text-red-500 text-xs mt-1">{errors.ifzaLicense.visaQuota.message}</p>
          )}
        </div>
      </div>

      {/* Additional Services and Office Requirements - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Additional Services */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          
          <div className="space-y-2">
            {/* Cross Border License */}
            {initialSetup.crossBorderLicense && (
              <TMECheckbox
                name="ifzaLicense.crossBorderLicense"
                register={register}
                setValue={setValue}
                checked={watchedData.ifzaLicense?.crossBorderLicense || false}
                label="Cross Border License"
                cost="2,000"
              />
            )}

            {/* Document Services for Corporate */}
            {clientDetails?.companySetupType === 'Corporate Setup' && (
              <>
                {initialSetup.mofaTranslations.ownersDeclaration && (
                  <TMECheckbox
                    name="ifzaLicense.mofaOwnersDeclaration"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.ifzaLicense?.mofaOwnersDeclaration || false}
                    label="Owner's Declaration Translation"
                    cost={initialSetup.mofaTranslations.ownersDeclaration.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.certificateOfIncorporation && (
                  <TMECheckbox
                    name="ifzaLicense.mofaCertificateOfIncorporation"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.ifzaLicense?.mofaCertificateOfIncorporation || false}
                    label="Certificate of Incorporation Translation"
                    cost={initialSetup.mofaTranslations.certificateOfIncorporation.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.memorandumOrArticles && (
                  <TMECheckbox
                    name="ifzaLicense.mofaActualMemorandumOrArticles"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.ifzaLicense?.mofaActualMemorandumOrArticles || false}
                    label="Memorandum/Articles Translation"
                    cost={initialSetup.mofaTranslations.memorandumOrArticles.toLocaleString()}
                  />
                )}
                {initialSetup.mofaTranslations.commercialRegister && (
                  <TMECheckbox
                    name="ifzaLicense.mofaCommercialRegister"
                    register={register}
                    setValue={setValue}
                    checked={watchedData.ifzaLicense?.mofaCommercialRegister || false}
                    label="Commercial Register Translation"
                    cost={initialSetup.mofaTranslations.commercialRegister.toLocaleString()}
                  />
                )}
              </>
            )}

            {/* Power of Attorney for Individual */}
            {clientDetails?.companySetupType === 'Individual Setup' && initialSetup.mofaTranslations.powerOfAttorney && (
              <TMECheckbox
                name="ifzaLicense.mofaPowerOfAttorney"
                register={register}
                setValue={setValue}
                checked={watchedData.ifzaLicense?.mofaPowerOfAttorney || false}
                label="Power Of Attorney"
                cost={initialSetup.mofaTranslations.powerOfAttorney.toLocaleString()}
              />
            )}
          </div>
        </div>

        {/* Office Requirements & Third-party Costs */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <TMECheckbox
                name="ifzaLicense.rentOfficeRequired"
                register={register}
                setValue={setValue}
                checked={watchedData.ifzaLicense?.rentOfficeRequired || false}
                label="Rent Office from Authority"
              />
              {watchedData.ifzaLicense?.rentOfficeRequired && (
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={watchedData.ifzaLicense?.officeRentAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.officeRentAmount || 0))}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseFormattedNumber(value);
                    setValue('ifzaLicense.officeRentAmount', parsed);
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  placeholder="30,000"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#243F7B';
                    e.target.select();
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              )}
            </div>

            <div className="space-y-2">
              <TMECheckbox
                name="ifzaLicense.depositWithLandlord"
                register={register}
                setValue={setValue}
                checked={watchedData.ifzaLicense?.depositWithLandlord || false}
                label="Deposit with Landlord"
              />
              {watchedData.ifzaLicense?.depositWithLandlord && (
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={watchedData.ifzaLicense?.depositAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.depositAmount || 0))}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseFormattedNumber(value);
                    setValue('ifzaLicense.depositAmount', parsed);
                  }}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  placeholder="10,000"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#243F7B';
                    e.target.select();
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              )}
            </div>

            <div className="space-y-2">
              <TMECheckbox
                name="ifzaLicense.thirdPartyApproval"
                register={register}
                setValue={setValue}
                checked={watchedData.ifzaLicense?.thirdPartyApproval || false}
                label="Third-party Approval (NOC)"
              />
              {watchedData.ifzaLicense?.thirdPartyApproval && (
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={watchedData.ifzaLicense?.thirdPartyApprovalAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.thirdPartyApprovalAmount || 0))}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseFormattedNumber(value);
                    setValue('ifzaLicense.thirdPartyApprovalAmount', parsed);
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
              value={formatNumberWithSeparators(String(watchedData.ifzaLicense?.tmeServicesFee || 
                (clientDetails?.companySetupType === 'Individual Setup' 
                  ? initialSetup.individualTmeServicesFee 
                  : initialSetup.defaultTmeServicesFee)))}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseFormattedNumber(value);
                setValue('ifzaLicense.tmeServicesFee', parsed);
              }}
              className="w-1/2 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {errors.ifzaLicense?.tmeServicesFee && (
              <p className="text-red-500 text-xs mt-1">{errors.ifzaLicense.tmeServicesFee.message}</p>
            )}
          </div>

          {/* Apply Price Reduction */}
          <div className="space-y-2">
            <TMECheckbox
              name="ifzaLicense.applyPriceReduction"
              register={register}
              setValue={setValue}
              checked={watchedData.ifzaLicense?.applyPriceReduction || false}
              label="Apply Price Reduction"
            />
            {watchedData.ifzaLicense?.applyPriceReduction && (
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={watchedData.ifzaLicense?.reductionAmount === 0 ? '' : formatNumberWithSeparators(String(watchedData.ifzaLicense?.reductionAmount || 0))}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsed = parseFormattedNumber(value);
                  setValue('ifzaLicense.reductionAmount', parsed);
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