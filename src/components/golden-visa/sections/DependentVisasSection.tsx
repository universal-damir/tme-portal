'use client';

import React from 'react';
import { Users } from 'lucide-react';
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

  const handleSpouseVisaCancelationChange = (checked: boolean) => {
    onFieldChange('dependents.spouse.visaCancelation', checked);
  };

  const handleSpouseVisaCancelationFeeChange = (fee: number) => {
    onFieldChange('dependents.spouse.visaCancelationFee', fee);
  };

  // Handlers for children
  const handleChildrenCountChange = (count: number) => {
    onFieldChange('dependents.children.count', count);
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
    <FormSection
      title="Dependent Visas (Optional)"
      description="Add spouse and children to the application"
      icon={Users}
      iconColor="text-pink-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spouse Section */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('dependents.spouse.required')}
                className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">Include Spouse</span>
            </div>
            {/* Invisible spacer to match children counter height */}
            <div className="w-28 h-8"></div>
          </div>
          
          {dependents.spouse?.required && (
            <div className="space-y-4">
              <DependentVisaCard
                type="spouse"
                authorityFees={authorityFees}
                visaCancelation={dependents.spouse?.visaCancelation || false}
                visaCancelationFee={dependents.spouse?.visaCancelationFee}
                onAuthorityFeeChange={handleSpouseAuthorityFeeChange}
                onVisaCancelationChange={handleSpouseVisaCancelationChange}
                onVisaCancelationFeeChange={handleSpouseVisaCancelationFeeChange}
              />
              
              {/* TME Professional Service Fee for Spouse */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <NumberInputField
                  label="TME Professional Service Fee - Spouse (AED)"
                  value={dependents.spouse?.tmeServicesFee}
                  onChange={handleSpouseTMEServicesFeeChange}
                  placeholder="3,490"
                  className="focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Children Section */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
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
                className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">Include Children</span>
            </div>
            
            {/* Compact inline counter */}
            {(dependents.children?.count || 0) > 0 && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleChildrenCountChange(Math.max(1, (dependents.children?.count || 1) - 1))}
                  disabled={(dependents.children?.count || 0) <= 1}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="text"
                  value={dependents.children?.count || 0}
                  readOnly
                  className="w-12 px-2 py-1 border-t border-b border-gray-300 text-center text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => handleChildrenCountChange(Math.min(10, (dependents.children?.count || 0) + 1))}
                  disabled={(dependents.children?.count || 0) >= 10}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
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
                visaCancelation={dependents.children?.visaCancelation || false}
                visaCancelationFee={dependents.children?.visaCancelationFee}
                onAuthorityFeeChange={handleChildrenAuthorityFeeChange}
                onVisaCancelationChange={handleChildrenVisaCancelationChange}
                onVisaCancelationFeeChange={handleChildrenVisaCancelationFeeChange}
              />
              
              {/* TME Professional Service Fee for Children */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <NumberInputField
                  label="TME Professional Service Fee per Child (AED)"
                  value={dependents.children?.tmeServicesFee}
                  onChange={handleChildrenTMEServicesFeeChange}
                  placeholder="2,930"
                  className="focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}; 