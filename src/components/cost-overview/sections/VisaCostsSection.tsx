import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import { User, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
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
      <label className="block text-xs font-medium mb-1" style={{ color: '#243F7B' }}>
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

  // State for dropdown values
  const [dropdownValues, setDropdownValues] = useState<{[key: string]: string}>({});

  const updateDropdownValue = (key: string, value: string) => {
    setDropdownValues(prev => ({ ...prev, [key]: value }));
  };

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
      <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Basic Visa Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Basic Visa Information
          </h3>
          
          {/* IFZA: Two fields in one row */}
          {authorityId === 'ifza' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Number of Visas */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Number of Visas
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="number"
                  min="0"
                  max={watchedData.ifzaLicense?.visaQuota || 0}
                  {...register('visaCosts.numberOfVisas', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the number of visas required - Maximum: {watchedData.ifzaLicense?.visaQuota || 0} (based on visa quota)
                </p>
                {errors.visaCosts?.numberOfVisas && (
                  <p className="text-red-500 text-xs mt-1">{errors.visaCosts.numberOfVisas.message}</p>
                )}
              </div>



              {/* Reduced Visa Cost (Visa Free for Life) */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Reduced Visa Cost (Visa Free for Life)
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="number"
                  min="0"
                  max={maxReducedVisas}
                  {...register('visaCosts.reducedVisaCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Only 1 visa can be reduced cost and free for life (AED {(visaCosts.standardVisaFee - visaCosts.reducedVisaFee).toLocaleString()} reduction)
                </p>
                {errors.visaCosts?.reducedVisaCost && (
                  <p className="text-red-500 text-xs mt-1">{errors.visaCosts.reducedVisaCost.message}</p>
                )}
              </div>
            </div>
          ) : (
            /* DET: Two fields layout */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Number of Visas */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Number of Visas
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="number"
                  min="0"
                  {...register('visaCosts.numberOfVisas', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the number of visas required
                </p>
                {errors.visaCosts?.numberOfVisas && (
                  <p className="text-red-500 text-xs mt-1">{errors.visaCosts.numberOfVisas.message}</p>
                )}
              </div>




            </div>
          )}
        </div>

        {/* Per-Visa Services (Combined Health Insurance & Additional Services) */}
        {(watchedData.visaCosts?.numberOfVisas || 0) > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Per-Visa Services & Options
            </h3>
            
            {/* Per-Visa Services - Compact Layout */}
            <div className="space-y-3">
              {Array.from({ length: authorityId === 'det' ? (watchedData.visaCosts?.numberOfVisas || 0) : Math.min(watchedData.visaCosts?.numberOfVisas || 0, watchedData.ifzaLicense?.visaQuota || 0) }, (_, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 bg-slate-50">
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                    Visa {index + 1} Services
                  </h4>
                  
                  {/* Compact grid layout for all dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Health Insurance for this visa */}
                  {healthInsurance && (
                    <CustomDropdown
                      label="Health Insurance *"
                      options={[
                        { value: "No Insurance", label: "No Insurance" },
                        { value: "Low Cost", label: `Low Cost (AED ${healthInsurance.lowCost.toLocaleString()})` },
                        { value: "Silver Package", label: `Silver Package (AED ${healthInsurance.silverPackage.toLocaleString()})` }
                      ]}
                      value={dropdownValues[`healthInsurance-${index}`] || "No Insurance"}
                      onChange={(value) => {
                        updateDropdownValue(`healthInsurance-${index}`, value);
                        register(`visaCosts.visaDetails.${index}.healthInsurance`).onChange({ target: { value } });
                      }}
                      error={errors.visaCosts?.visaDetails?.[index]?.healthInsurance?.message}
                    />
                  )}
                  
                  {/* Investor/Employment Visa for this visa - DET vs IFZA */}
                  {(authorityId === 'det' || (visaCosts?.investorVisaFee && visaCosts.investorVisaFee > 0)) && (
                    <CustomDropdown
                      label={authorityId === 'det' 
                        ? 'Investor/Employment Visa' 
                        : `Investor Visa (AED ${visaCosts?.investorVisaFee?.toLocaleString()})`}
                      options={authorityId === 'det' ? [
                        { value: "", label: "Select visa type" },
                        { value: "true", label: "Investor Visa" },
                        { value: "employment", label: "Employment Visa" }
                      ] : [
                        { value: "", label: "No Investor Visa" },
                        { value: "true", label: "Enable Investor Visa" }
                      ]}
                      value={dropdownValues[`investorVisa-${index}`] || ""}
                      onChange={(value) => {
                        updateDropdownValue(`investorVisa-${index}`, value);
                        register(`visaCosts.visaDetails.${index}.investorVisa`).onChange({ target: { value } });
                      }}
                    />
                  )}
                  
                  {/* Status Change for this visa */}
                  {visaCosts.statusChangeFee && (
                    <CustomDropdown
                      label={`Status Change (AED ${visaCosts.statusChangeFee.toLocaleString()})`}
                      options={[
                        { value: "", label: "No Status Change" },
                        { value: "true", label: "Enable Status Change" }
                      ]}
                      value={dropdownValues[`statusChange-${index}`] || ""}
                      onChange={(value) => {
                        updateDropdownValue(`statusChange-${index}`, value);
                        register(`visaCosts.visaDetails.${index}.statusChange`).onChange({ target: { value } });
                      }}
                    />
                  )}
                  
                  {/* VIP Stamping for this visa */}
                  {visaCosts.vipStampingFee && (
                    <CustomDropdown
                      label={`VIP Stamping (AED ${visaCosts.vipStampingFee.toLocaleString()})`}
                      options={[
                        { value: "", label: "No VIP Stamping" },
                        { value: "true", label: "Enable VIP Stamping" }
                      ]}
                      value={dropdownValues[`vipStamping-${index}`] || ""}
                      onChange={(value) => {
                        updateDropdownValue(`vipStamping-${index}`, value);
                        register(`visaCosts.visaDetails.${index}.vipStamping`).onChange({ target: { value } });
                      }}
                    />
                  )}
                  </div>
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