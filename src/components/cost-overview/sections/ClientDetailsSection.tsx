import React, { useEffect, useState, useRef } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { User, Check, Plus, X, Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfferData } from '@/types/offer';
import { FormSection } from '../ui/FormSection';
import { FormattedInputHandlers } from '../hooks/useFormattedInputs';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { useSharedClient } from '@/contexts/SharedClientContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClientDetailsSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  handlers: FormattedInputHandlers;
  setValue: UseFormSetValue<OfferData>;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  watchedData,
  handlers,
  setValue
}) => {
  const { clientDetails } = watchedData;
  const { clearClientInfo, clientInfo } = useSharedClient();
  
  // Check if company name has any meaningful content
  const hasCompanyName = clientDetails?.companyName && clientDetails.companyName.trim().length > 0;

  // Email management state - start with existing emails or just one empty field
  const [emailInputs, setEmailInputs] = useState<string[]>(() => {
    if (clientDetails?.clientEmails?.length) {
      return clientDetails.clientEmails;
    }
    return [''];
  });

  useEffect(() => {
    if (!hasCompanyName) {
      setValue('clientDetails.addressToCompany', false);
    }
  }, [hasCompanyName, setValue]);

  // Update form data when email inputs change
  useEffect(() => {
    const validEmails = emailInputs.filter(email => email.trim() !== '');
    setValue('clientDetails.clientEmails', validEmails.length > 0 ? validEmails : ['']);
  }, [emailInputs, setValue]);

  // Use ref to track the latest emailInputs value without causing re-renders
  const emailInputsRef = useRef(emailInputs);
  emailInputsRef.current = emailInputs;

  // Sync email inputs from SharedClientContext when switching tabs
  useEffect(() => {
    if (clientInfo?.clientEmails && Array.isArray(clientInfo.clientEmails) && clientInfo.clientEmails.length > 0) {
      const contextEmails = clientInfo.clientEmails.filter(email => email && email.trim() !== '');
      if (contextEmails.length > 0) {
        // Only update if emails are different to avoid infinite loops
        const currentEmails = emailInputsRef.current.filter(email => email.trim() !== '');
        const emailsChanged = contextEmails.length !== currentEmails.length || 
                            contextEmails.some((email, index) => email !== currentEmails[index]);
        
        if (emailsChanged) {
          setEmailInputs(contextEmails);
          setValue('clientDetails.clientEmails', contextEmails);
        }
      }
    }
  }, [clientInfo?.clientEmails, setValue]);

  // Sync local email state with form data changes (e.g., from AI assistant)
  useEffect(() => {
    if (clientDetails?.clientEmails && Array.isArray(clientDetails.clientEmails)) {
      const formEmails = clientDetails.clientEmails.filter(email => email && email.trim() !== '');
      
      // Only update if the emails are actually different to avoid infinite loops
      const currentEmails = emailInputsRef.current.filter(email => email.trim() !== '');
      const emailsChanged = formEmails.length !== currentEmails.length || 
                          formEmails.some((email, index) => email !== currentEmails[index]);
      
      if (emailsChanged) {
        setEmailInputs(formEmails.length > 0 ? formEmails : ['']);
      }
    }
  }, [clientDetails?.clientEmails]);

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
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title="Client Details"
        description="Basic client information"
        icon={User}
        iconColor="text-slate-600"
        actionButton={
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  clearClientInfo({ source: 'manual-clear' });
                  // Clear all form fields including emails
                  setValue('clientDetails.firstName', '');
                  setValue('clientDetails.lastName', '');
                  setValue('clientDetails.companyName', '');
                  setValue('clientDetails.shortCompanyName', '');
                  setValue('clientDetails.clientEmails', ['']);
                  setEmailInputs(['']); // Reset email inputs state
                }}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear client information</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                First Name *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.firstName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter first name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Last Name *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.lastName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter last name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Company Information and Date */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Company Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.companyName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter company name (optional)"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.companyName.message}</p>
              )}
              
              {/* Company Address Checkbox */}
              <div className="mt-3">
                <motion.label 
                  whileHover={hasCompanyName ? { scale: 1.02 } : {}}
                  className={`flex items-center cursor-pointer ${!hasCompanyName ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('clientDetails.addressToCompany')}
                      disabled={!hasCompanyName}
                      checked={hasCompanyName ? (clientDetails?.addressToCompany || false) : false}
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                      style={{ 
                        borderColor: (hasCompanyName && clientDetails?.addressToCompany) ? '#243F7B' : '#d1d5db',
                        backgroundColor: (hasCompanyName && clientDetails?.addressToCompany) ? '#243F7B' : 'white'
                      }}
                    >
                      {hasCompanyName && clientDetails?.addressToCompany && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Address offer to company
                  </span>
                </motion.label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Date *
              </label>
              <FormDatePicker
                register={register}
                name="clientDetails.date"
                value={watchedData.clientDetails?.date}
                onChange={(value: string) => setValue('clientDetails.date', value)}
                label=""
                placeholder="Select date"
                required={false}
                error={errors.clientDetails?.date?.message}
              />
            </div>
          </div>

          {/* Client Emails Section */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              {emailInputs.length === 1 ? 'Primary Email Address *' : 'Client Email Addresses *'}
            </label>
            {emailInputs.length === 1 && (
              <p className="text-xs text-gray-500 mb-3">Enter client's primary email address</p>
            )}
            
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
            {errors.clientDetails?.clientEmails && (
              <p className="text-red-500 text-xs mt-2">
                {Array.isArray(errors.clientDetails.clientEmails) 
                  ? errors.clientDetails.clientEmails[0]?.message || 'Invalid email format'
                  : 'Please check email format'
                }
              </p>
            )}
          </div>

        </div>
      </FormSection>
    </motion.div>
  );
}; 