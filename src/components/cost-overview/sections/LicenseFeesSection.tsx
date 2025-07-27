import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/authorities/types';
import { FormSection } from '../ui/FormSection';
import { IFZALicenseSection } from './license-fees/IFZALicenseSection';
import { DETLicenseSection } from './license-fees/DETLicenseSection';

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
  const { id: authorityId, initialSetup } = authorityConfig;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title={`${authorityConfig.displayName} License Fee`}
        description="License fees and additional services"
        icon={FileText}
        iconColor="text-slate-600"
      >
        {/* IFZA-specific rendering */}
        {authorityId === 'ifza' && (
          <IFZALicenseSection
            register={register}
            errors={errors}
            watchedData={watchedData}
            setValue={setValue}
            authorityConfig={authorityConfig}
            formatNumberWithSeparators={formatNumberWithSeparators}
            parseFormattedNumber={parseFormattedNumber}
          />
        )}

        {/* DET-specific rendering */}
        {authorityId === 'det' && (
          <DETLicenseSection
            register={register}
            errors={errors}
            watchedData={watchedData}
            setValue={setValue}
            authorityConfig={authorityConfig}
            formatNumberWithSeparators={formatNumberWithSeparators}
            parseFormattedNumber={parseFormattedNumber}
          />
        )}

        {/* Other authorities */}
        {authorityId !== 'ifza' && authorityId !== 'det' && (
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <p className="text-gray-600 mb-2">
              License fee configuration for {authorityConfig.displayName} will be implemented here.
            </p>
            <p className="text-sm text-gray-500">
              Base License Fee: AED {initialSetup.baseLicenseFee.toLocaleString()}
            </p>
          </div>
        )}
      </FormSection>
    </motion.div>
  );
};