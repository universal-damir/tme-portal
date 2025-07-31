'use client';

import React, { useEffect } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData } from '@/types/taxation';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { FormDatePicker } from '@/components/ui/form-date-picker';

interface ClientDetailsSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<TaxationData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<TaxationData>;
  
  /**
   * Current form data for reactive display
   */
  data: TaxationData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<TaxationData>;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  data,
  setValue,
}) => {
  // Auto-fill short company name when company name changes
  useEffect(() => {
    if (data.companyName) {
      const words = data.companyName.trim().split(/\s+/);
      const shortName = words.slice(0, 2).join(' ');
      setValue('shortCompanyName', shortName);
    } else {
      setValue('shortCompanyName', '');
    }
  }, [data.companyName, setValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Client Details"
        description="Basic client information for taxation services"
        icon={User}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Name Fields and Date in one row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                First Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('firstName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter first name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Last Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('lastName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter last name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Date *
              </label>
              <div className="relative date-picker-override">
                <FormDatePicker
                  register={register}
                  name="date"
                  value={data.date}
                  onChange={(value: string) => setValue('date', value)}
                  label=""
                  placeholder="dd.mm.yyyy"
                  required={true}
                  error={errors.date?.message}
                  captionLayout="dropdown"
                />
              </div>
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date?.message}</p>
              )}
            </div>
          </div>

          {/* Company Name Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Company Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('companyName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter company name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Short Company Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('shortCompanyName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Auto-filled from company name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically fills with first two words of company name
              </p>
              {errors.shortCompanyName && (
                <p className="text-red-500 text-xs mt-1">{errors.shortCompanyName.message}</p>
              )}
            </div>
          </div>

        </div>
        
      </FormSection>
    </motion.div>
  );
}; 