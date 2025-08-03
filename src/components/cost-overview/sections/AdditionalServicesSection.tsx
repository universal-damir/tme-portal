import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown } from 'lucide-react';
import { CostInputField } from '../ui/CostInputField';
import { FormattedInputState, FormattedInputHandlers } from '../hooks/useFormattedInputs';
import { useFormContext } from 'react-hook-form';

interface AdditionalServicesSectionProps {
  formattedInputs: FormattedInputState;
  handlers: FormattedInputHandlers;
  updateFormattedInput?: (key: keyof FormattedInputState, value: string) => void;
}

export const AdditionalServicesSection: React.FC<AdditionalServicesSectionProps> = ({
  formattedInputs,
  handlers,
  updateFormattedInput
}) => {
  const formContext = useFormContext();
  const { watch, setValue, register } = formContext || {};
  const watchedData = watch ? watch() : {};
  
  // Local state for accounting frequency to ensure UI updates immediately
  const [localAccountingFrequency, setLocalAccountingFrequency] = useState<'yearly' | 'quarterly' | 'monthly'>('yearly');


  // Sync local state with form data
  useEffect(() => {
    const formFrequency = watchedData?.additionalServices?.accountingFrequency;
    if (formFrequency && formFrequency !== localAccountingFrequency) {
      setLocalAccountingFrequency(formFrequency);
    }
  }, [watchedData?.additionalServices?.accountingFrequency, localAccountingFrequency]);

  // Set default values on component mount
  useEffect(() => {
    if (!setValue) return;
    
    if (!watchedData?.additionalServices?.accountingFrequency) {
      setValue('additionalServices.accountingFrequency', 'yearly');
      setLocalAccountingFrequency('yearly');
    }
    if (!watchedData?.additionalServices?.accountingFee && localAccountingFrequency === 'yearly') {
      setValue('additionalServices.accountingFee', 6293);
      if (updateFormattedInput) {
        updateFormattedInput('accountingFeeFormatted', '6,293.00');
      }
    }
  }, [setValue, watchedData?.additionalServices?.accountingFrequency, watchedData?.additionalServices?.accountingFee, localAccountingFrequency, updateFormattedInput]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg p-6 border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center mb-4"
      >
        <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: '#243F7B' }}>
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>Additional Services</h2>
          <p className="text-sm text-gray-600">Optional services and fees</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CostInputField
                label="Company Stamp"
                value={formattedInputs.companyStampFormatted}
                onChange={handlers.handleCompanyStampChange}
                placeholder="600.00"
                description=""
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <CostInputField
                label="Emirates Post P.O. Box Registration"
                value={formattedInputs.emiratesPostFormatted}
                onChange={handlers.handleEmiratesPostChange}
                placeholder="1,500.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium">
                    Accounting
                  </label>
                  <div className="relative">
                    <select
                      value={localAccountingFrequency}
                      onChange={(e) => {
                        const frequency = e.target.value as 'yearly' | 'quarterly' | 'monthly';
                        setLocalAccountingFrequency(frequency);
                        handlers.handleAccountingFrequencyChange(frequency);
                      }}
                      className="px-2 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:border-blue-500 appearance-none bg-white pr-6"
                      style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}
                    >
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formattedInputs.accountingFeeFormatted}
                    onChange={handlers.handleAccountingFeeChange}
                    placeholder={localAccountingFrequency === 'quarterly' ? '2,098.00' : 
                                localAccountingFrequency === 'yearly' ? '6,293.00' : '2,183.00'}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                    AED
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <CostInputField
                label="CIT Registration"
                value={formattedInputs.citRegistrationFormatted}
                onChange={handlers.handleCitRegistrationChange}
                placeholder="2,921.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <CostInputField
                label="CIT Return Filing (Yearly)"
                value={formattedInputs.citReturnFilingFormatted}
                onChange={handlers.handleCitReturnFilingChange}
                placeholder="5,198.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <CostInputField
                label="VAT Registration/Exception"
                value={formattedInputs.vatRegistrationFormatted}
                onChange={handlers.handleVatRegistrationChange}
                placeholder="3,625.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <CostInputField
                label="Digital Bank WIO Account"
                value={formattedInputs.digitalBankFormatted}
                onChange={handlers.handleDigitalBankChange}
                placeholder="3,000.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <CostInputField
                label="Traditional UAE Bank Account"
                value={formattedInputs.traditionalBankFormatted}
                onChange={handlers.handleTraditionalBankChange}
                placeholder="7,000.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <CostInputField
                label="Personal Bank Account"
                value={formattedInputs.personalBankFormatted}
                onChange={handlers.handlePersonalBankChange}
                placeholder="3,000.00"
              />
            </motion.div>


          </div>
        </div>
      </div>
    </motion.div>
  );
}; 