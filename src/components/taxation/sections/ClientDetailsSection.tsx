'use client';

import React, { useEffect, useState } from 'react';
import { User, Plus, X, Mail, Check } from 'lucide-react';
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
  // Email management state - start with existing emails or just one empty field
  const [emailInputs, setEmailInputs] = useState<string[]>(() => {
    if (data?.clientEmails?.length) {
      return data.clientEmails;
    }
    return [''];
  });

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

  // Update form data when email inputs change
  useEffect(() => {
    const validEmails = emailInputs.filter(email => email.trim() !== '');
    setValue('clientEmails', validEmails.length > 0 ? validEmails : ['']);
  }, [emailInputs, setValue]);

  // Sync local email state with form data changes (e.g., from AI assistant)
  useEffect(() => {
    if (data?.clientEmails && Array.isArray(data.clientEmails)) {
      const formEmails = data.clientEmails.filter(email => email && email.trim() !== '');
      
      // Only update if the emails are actually different to avoid infinite loops
      const currentEmails = emailInputs.filter(email => email.trim() !== '');
      const emailsChanged = formEmails.length !== currentEmails.length || 
                          formEmails.some((email, index) => email !== currentEmails[index]);
      
      if (emailsChanged) {
        setEmailInputs(formEmails.length > 0 ? formEmails : ['']);
      }
    }
  }, [data?.clientEmails, emailInputs]);

  // Email input handlers
  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emailInputs];
    newEmails[index] = value;
    setEmailInputs(newEmails);
  };

  const addEmailInput = () => {
    setEmailInputs([...emailInputs, '']);
  };

  const removeEmailInput = (index: number) => {
    if (emailInputs.length > 1) {
      const newEmails = emailInputs.filter((_, i) => i !== index);
      setEmailInputs(newEmails);
    } else {
      // If it's the last field, just clear it instead of removing
      setEmailInputs(['']);
    }
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
          {/* Line 1: First Name, Last Name, Date */}
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

          {/* Line 2: Company Name, Short Company Name, Email */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

            {/* Client Email Section */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                {emailInputs.length === 1 ? 'Client Primary Email Address *' : 'Client Email Addresses *'}
              </label>
              
              <div className="space-y-3">
                {emailInputs.map((email, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="relative">
                        <Mail 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                        />
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] ${
                            email && !validateEmail(email) 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-200'
                          }`}
                          placeholder={index === 0 ? 'Enter primary email address' : `Enter additional email address`}
                          onFocus={(e) => e.target.style.borderColor = email && !validateEmail(email) ? '#ef4444' : '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = email && !validateEmail(email) ? '#fca5a5' : '#e5e7eb'}
                        />
                        {email && validateEmail(email) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      {email && !validateEmail(email) && (
                        <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                      )}
                    </div>
                    
                    {/* Only show remove button for additional emails (not the primary one) */}
                    {emailInputs.length > 1 && index > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => removeEmailInput(index)}
                        className="p-2 rounded-lg border-2 border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Add Another Email Button - Only show when there's one field or when the last field has content */}
              {(emailInputs.length === 1 || (emailInputs.length > 1 && emailInputs[emailInputs.length - 1].trim() !== '')) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={addEmailInput}
                  className="mt-3 flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:underline"
                  style={{ color: '#243F7B' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add additional email (optional)</span>
                </motion.button>
              )}

              {/* Display validation errors for the email array */}
              {errors.clientEmails && (
                <p className="text-red-500 text-xs mt-2">
                  {Array.isArray(errors.clientEmails) 
                    ? errors.clientEmails[0]?.message || 'Invalid email format'
                    : 'Please check email format'
                  }
                </p>
              )}
            </div>
          </div>

        </div>
        
      </FormSection>
    </motion.div>
  );
}; 