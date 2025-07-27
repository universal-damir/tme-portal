import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';

interface SpouseVisaSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  authorityConfig: AuthorityConfig;
  setValue: UseFormSetValue<OfferData>;
}

// Custom Dropdown Component
interface CustomDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
        {label}
      </label>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </motion.button>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ backgroundColor: '#f3f4f6' }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export const SpouseVisaSection: React.FC<SpouseVisaSectionProps> = ({
  register,
  errors,
  watchedData,
  authorityConfig,
  setValue
}) => {
  const { visaCosts } = authorityConfig;
  const healthInsurance = visaCosts?.healthInsurance;
  const [dropdownValues, setDropdownValues] = useState<{[key: string]: string}>({});

  const updateDropdownValue = (key: string, value: string) => {
    setDropdownValues(prev => ({ ...prev, [key]: value }));
  };

  // Reset spouse visa related fields when spouseVisa is unchecked
  useEffect(() => {
    if (!watchedData.visaCosts?.spouseVisa) {
      setValue('visaCosts.spouseVisaInsurance', 'No Insurance');
      setValue('visaCosts.spouseVisaStatusChange', false);
      setValue('visaCosts.spouseVisaVipStamping', false);
    }
  }, [watchedData.visaCosts?.spouseVisa, setValue]);

  // Only show this section if authority supports spouse visas
  if (!visaCosts?.spouseVisaStandardFee) {
    return null;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        Spouse Visa
      </h3>
      
      <div className="space-y-3">
        {/* Spouse Visa Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('visaCosts.spouseVisa')}
              className="w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 transition-all duration-200"
              style={{
                accentColor: '#243F7B'
              }}
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Spouse Visa
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Unrelated to number of visas, no validation needed
          </p>
        </div>

        {/* Spouse Visa Options - Show only if spouse visa is checked */}
        {watchedData.visaCosts?.spouseVisa && (
          <div className="p-4 rounded-lg border border-gray-200 bg-slate-50">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
              Spouse Visa Services
            </h4>
            
            {/* Compact grid layout for all options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Health Insurance */}
              <CustomDropdown
                label="Health Insurance"
                options={[
                  { value: "No Insurance", label: "No Insurance" },
                  { value: "Low Cost", label: `Low Cost (AED ${healthInsurance?.lowCost.toLocaleString()})` },
                  { value: "Silver Package", label: `Silver Package (AED ${healthInsurance?.silverPackage.toLocaleString()})` }
                ]}
                value={dropdownValues['spouseInsurance'] || "No Insurance"}
                onChange={(value) => {
                  updateDropdownValue('spouseInsurance', value);
                  register('visaCosts.spouseVisaInsurance').onChange({ target: { value } });
                }}
                error={errors.visaCosts?.spouseVisaInsurance?.message}
              />
              
              {/* Status Change Checkbox */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#243F7B' }}>
                  Status Change (AED {visaCosts?.statusChangeFee?.toLocaleString()})
                </label>
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 h-[42px]"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('visaCosts.spouseVisaStatusChange')}
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                      style={{ 
                        borderColor: watchedData.visaCosts?.spouseVisaStatusChange ? '#243F7B' : '#d1d5db',
                        backgroundColor: watchedData.visaCosts?.spouseVisaStatusChange ? '#243F7B' : 'white'
                      }}
                    >
                      {watchedData.visaCosts?.spouseVisaStatusChange && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Enable Status Change</span>
                </motion.label>
              </div>
              
              {/* VIP Stamping Checkbox */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#243F7B' }}>
                  VIP Stamping (AED {visaCosts?.vipStampingFee?.toLocaleString()})
                </label>
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 h-[42px]"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('visaCosts.spouseVisaVipStamping')}
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                      style={{ 
                        borderColor: watchedData.visaCosts?.spouseVisaVipStamping ? '#243F7B' : '#d1d5db',
                        backgroundColor: watchedData.visaCosts?.spouseVisaVipStamping ? '#243F7B' : 'white'
                      }}
                    >
                      {watchedData.visaCosts?.spouseVisaVipStamping && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Enable VIP Stamping</span>
                </motion.label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 