'use client';

import React from 'react';
import { Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { DependentVisaCard } from '../ui/DependentVisaCard';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { GoldenVisaData } from '@/types/golden-visa';

interface DependentVisasSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: any;
  
  /**
   * Current form data
   */
  data: GoldenVisaData;
  
  /**
   * Handler for field value changes
   * @param path - The field path (e.g., 'dependentAuthorityFees.professionalPassportPicture')
   * @param value - The new value
   */
  onFieldChange: (path: string, value: number | boolean) => void;
}

export const DependentVisasSection: React.FC<DependentVisasSectionProps> = ({
  register,
  data,
  onFieldChange,
}) => {
  const dependents = data.dependents || {};
  const authorityFees = data.dependentAuthorityFees || {};

  // Handlers for spouse
  const handleSpouseAuthorityFeeChange = (field: string, value: number) => {
    onFieldChange(`dependentAuthorityFees.${field}`, value);
  };

  // Initialize spouse default values when spouse is enabled
  const initializeSpouseDefaults = () => {
    const defaultValues = {
      professionalPassportPicture: 25,
      dependentFileOpening: 320,
      standardAuthorityCostsSpouse: 4710,
      mandatoryUaeMedicalTest: 700,
      emiratesIdFee: 1155,
      immigrationResidencyFeeSpouse: 2860,
      thirdPartyCosts: 1460
    };
    
    // Set default authority fees if not already set
    Object.entries(defaultValues).forEach(([field, defaultValue]) => {
      if (!(authorityFees as any)[field]) {
        onFieldChange(`dependentAuthorityFees.${field}`, defaultValue);
      }
    });
    
    // Set default TME service fee if not set
    if (!dependents.spouse?.tmeServicesFee) {
      onFieldChange('dependents.spouse.tmeServicesFee', 2240);
    }
  };

  const handleSpouseVisaCancelationChange = (checked: boolean) => {
    onFieldChange('dependents.spouse.visaCancelation', checked);
  };

  const handleSpouseVisaCancelationFeeChange = (fee: number) => {
    onFieldChange('dependents.spouse.visaCancelationFee', fee);
  };

  // Handlers for children
  const handleChildrenCountChange = (count: number) => {
    onFieldChange('dependents.children.count', count);
    
    // Initialize children defaults when first enabled
    if (count > 0) {
      initializeChildrenDefaults();
    }
  };

  // Initialize children default values when children are enabled
  const initializeChildrenDefaults = () => {
    const defaultValues = {
      professionalPassportPicture: 25,
      dependentFileOpening: 320,
      standardAuthorityCostsChild: 4604,
      mandatoryUaeMedicalTest: 700,
      emiratesIdFee: 1155,
      immigrationResidencyFeeChild: 2750,
      thirdPartyCosts: 1460
    };
    
    // Set default authority fees if not already set
    Object.entries(defaultValues).forEach(([field, defaultValue]) => {
      if (!(authorityFees as any)[field]) {
        onFieldChange(`dependentAuthorityFees.${field}`, defaultValue);
      }
    });
    
    // Set default TME service fee if not set
    if (!dependents.children?.tmeServicesFee) {
      onFieldChange('dependents.children.tmeServicesFee', 1690);
    }
  };

  const handleChildrenAuthorityFeeChange = (field: string, value: number) => {
    onFieldChange(`dependentAuthorityFees.${field}`, value);
  };

  const handleChildrenVisaCancelationChange = (checked: boolean) => {
    onFieldChange('dependents.children.visaCancelation', checked);
  };

  const handleChildrenVisaCancelationFeeChange = (fee: number) => {
    onFieldChange('dependents.children.visaCancelationFee', fee);
  };

  // Handlers for TME service fees
  const handleSpouseTMEServicesFeeChange = (fee: number) => {
    onFieldChange('dependents.spouse.tmeServicesFee', fee);
  };

  const handleChildrenTMEServicesFeeChange = (fee: number) => {
    onFieldChange('dependents.children.tmeServicesFee', fee);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <FormSection
        title="Dependent Visas (Optional)"
        description="Add spouse and children to the application"
        icon={Users}
      iconColor="text-slate-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spouse Section */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('dependents.spouse.required')}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onFieldChange('dependents.spouse.required', checked);
                    if (checked) {
                      initializeSpouseDefaults();
                    }
                  }}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: dependents.spouse?.required ? '#243F7B' : '#d1d5db',
                    backgroundColor: dependents.spouse?.required ? '#243F7B' : 'white'
                  }}
                >
                  {dependents.spouse?.required && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
              <span className="ml-3 text-sm font-semibold text-gray-700">Include Spouse</span>
            </motion.label>
            {/* Invisible spacer to match children counter height */}
            <div className="w-28 h-8"></div>
          </div>
          
          {dependents.spouse?.required && (
            <div className="space-y-4">
              <DependentVisaCard
                type="spouse"
                authorityFees={authorityFees}
                visaCancellation={dependents.spouse?.visaCancelation || false}
                visaCancellationFee={dependents.spouse?.visaCancelationFee}
                onAuthorityFeeChange={handleSpouseAuthorityFeeChange}
                onVisaCancellationChange={handleSpouseVisaCancelationChange}
                onVisaCancellationFeeChange={handleSpouseVisaCancelationFeeChange}
              />
              
              {/* TME Professional Service Fee for Spouse */}
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                <NumberInputField
                  label="TME Professional Service Fee - Spouse (AED)"
                  value={dependents.spouse?.tmeServicesFee || 3490}
                  onChange={handleSpouseTMEServicesFeeChange}
                  placeholder="3,490"
                  className="focus:ring-slate-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Children Section */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={(dependents.children?.count || 0) > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // When checking, set at least one child to show the options
                      handleChildrenCountChange(1);
                    } else {
                      // Reset children count to 0 when unchecked
                      handleChildrenCountChange(0);
                    }
                  }}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: (dependents.children?.count || 0) > 0 ? '#243F7B' : '#d1d5db',
                    backgroundColor: (dependents.children?.count || 0) > 0 ? '#243F7B' : 'white'
                  }}
                >
                  {(dependents.children?.count || 0) > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
              <span className="ml-3 text-sm font-semibold text-gray-700">Include Children</span>
            </motion.label>
            
            {/* Compact inline counter */}
            {(dependents.children?.count || 0) > 0 && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleChildrenCountChange(Math.max(1, (dependents.children?.count || 1) - 1))}
                  disabled={(dependents.children?.count || 0) <= 1}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="text"
                  value={dependents.children?.count || 0}
                  readOnly
                  className="w-12 px-2 py-1 border-t border-b border-gray-300 text-center text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => handleChildrenCountChange(Math.min(10, (dependents.children?.count || 0) + 1))}
                  disabled={(dependents.children?.count || 0) >= 10}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            )}
          </div>
          
          {(dependents.children?.count || 0) > 0 && (
            <div className="space-y-4">
              <DependentVisaCard
                type="children"
                authorityFees={authorityFees}
                visaCancellation={dependents.children?.visaCancelation || false}
                visaCancellationFee={dependents.children?.visaCancelationFee}
                onAuthorityFeeChange={handleChildrenAuthorityFeeChange}
                onVisaCancellationChange={handleChildrenVisaCancelationChange}
                onVisaCancellationFeeChange={handleChildrenVisaCancelationFeeChange}
              />
              
              {/* TME Professional Service Fee for Children */}
              <div className="bg-slate-200 border border-slate-400 rounded-lg p-4">
                <NumberInputField
                  label="TME Professional Service Fee per Child (AED)"
                  value={dependents.children?.tmeServicesFee || 2930}
                  onChange={handleChildrenTMEServicesFeeChange}
                  placeholder="2,930"
                  className="focus:ring-slate-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FormSection>
    </motion.div>
  );
}; 