import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn, UseFormSetValue } from 'react-hook-form';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfferData } from '@/types/offer';
import { FormSection } from '../ui/FormSection';

interface ActivityCodesSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  activityCodesArray: UseFieldArrayReturn<OfferData, 'activityCodes', 'id'>;
  watchedData: OfferData;
  setValue: UseFormSetValue<OfferData>;
}

export const ActivityCodesSection: React.FC<ActivityCodesSectionProps> = ({
  register,
  errors,
  activityCodesArray,
  watchedData,
  setValue
}) => {
  const { fields, append, remove } = activityCodesArray;
  const [showAddButton, setShowAddButton] = useState(false);
  
  // Check which authority is selected
  const isIfzaSelected = watchedData.authorityInformation?.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = watchedData.authorityInformation?.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Check if TBC is enabled for either authority
  const isTbcEnabled = (isIfzaSelected && watchedData.ifzaLicense?.activitiesToBeConfirmed) || 
                       (isDetSelected && watchedData.detLicense?.activitiesToBeConfirmed) || false;

  // DISABLED - Activity codes are now managed in AuthorityInfoSection
  // useEffect(() => {
  //   if (!isTbcEnabled && fields.length === 0) {
  //     append({ code: '', description: '' });
  //   }
  // }, [isTbcEnabled, fields.length, append]);

  // Check if a specific activity field is complete
  const isActivityComplete = (index: number) => {
    const activity = watchedData.activityCodes?.[index];
    return activity && activity.code && activity.code.trim() !== '' && activity.description && activity.description.trim() !== '';
  };

  // Check if we should show the small plus button for a specific field
  const shouldShowPlusButton = (index: number) => {
    // Show plus button only on the last field, and only if it's complete and Add button is not shown
    return index === fields.length - 1 && isActivityComplete(index) && !showAddButton;
  };

  const handleShowAddButton = () => {
    setShowAddButton(true);
  };

  const handleAddActivity = () => {
    append({ code: '', description: '' });
    setShowAddButton(false); // Hide the Add button after adding
  };

  const handleRemoveActivity = (index: number) => {
    remove(index);
    // DISABLED - No auto-adding fields
    // if (!isTbcEnabled && fields.length <= 1) {
    //   append({ code: '', description: '' });
    // }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title="Activity Codes"
        description="Business activity information"
        icon={FileText}
        iconColor="text-slate-600"
        className="lg:col-span-2"
      >
        <div className="space-y-4">
          {/* TBC Checkbox for IFZA */}
          {isIfzaSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
            >
              <motion.label
                whileHover={{ scale: 1.01 }}
                className="flex items-start gap-2 cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    id="ifzaActivitiesToBeConfirmed"
                    {...register('ifzaLicense.activitiesToBeConfirmed')}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mt-0.5"
                    style={{ 
                      borderColor: watchedData.ifzaLicense?.activitiesToBeConfirmed ? '#243F7B' : '#d1d5db',
                      backgroundColor: watchedData.ifzaLicense?.activitiesToBeConfirmed ? '#243F7B' : 'white'
                    }}
                  >
                    {watchedData.ifzaLicense?.activitiesToBeConfirmed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Activities to be confirmed - TBC
                  </span>
                  <p className="text-xs text-gray-600">
                    Check this if the specific business activities are to be confirmed later. When checked, activity codes selection becomes optional.
                  </p>
                </div>
              </motion.label>
            </motion.div>
          )}

          {/* TBC Checkbox for DET */}
          {isDetSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
            >
              <motion.label
                whileHover={{ scale: 1.01 }}
                className="flex items-start gap-2 cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    id="detActivitiesToBeConfirmed"
                    {...register('detLicense.activitiesToBeConfirmed')}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mt-0.5"
                    style={{ 
                      borderColor: watchedData.detLicense?.activitiesToBeConfirmed ? '#243F7B' : '#d1d5db',
                      backgroundColor: watchedData.detLicense?.activitiesToBeConfirmed ? '#243F7B' : 'white'
                    }}
                  >
                    {watchedData.detLicense?.activitiesToBeConfirmed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Activities to be confirmed - TBC
                  </span>
                  <p className="text-xs text-gray-600">
                    Check this if the specific business activities are to be confirmed later. When checked, activity codes selection becomes optional.
                  </p>
                </div>
              </motion.label>
            </motion.div>
          )}

          {/* Activity Fields - Only show when TBC is not enabled */}
          {!isTbcEnabled && (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      Activity Code {(!isIfzaSelected && !isDetSelected) && '*'}
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      {...register(`activityCodes.${index}.code`)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                      placeholder="Enter activity code"
                      onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    {errors.activityCodes?.[index]?.code && (
                      <p className="text-red-500 text-xs mt-1">{errors.activityCodes[index]?.code?.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                        Activity Description {(!isIfzaSelected && !isDetSelected) && '*'}
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        {...register(`activityCodes.${index}.description`)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                        placeholder="Enter activity description"
                        onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {errors.activityCodes?.[index]?.description && (
                        <p className="text-red-500 text-xs mt-1">{errors.activityCodes[index]?.description?.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-end gap-2">
                      {/* Small plus button only appears on the last field when it's complete and Add button is not shown */}
                      {shouldShowPlusButton(index) && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleShowAddButton}
                          className="px-3 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg h-[42px] flex items-center"
                          style={{ backgroundColor: '#243F7B' }}
                          title="Show add activity option"
                        >
                          <Plus className="h-4 w-4" />
                        </motion.button>
                      )}
                      
                      {/* Remove button only shows when there's more than 1 field */}
                      {fields.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleRemoveActivity(index)}
                          className="px-3 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-all duration-200 hover:shadow-lg h-[42px] flex items-center"
                          title="Remove this activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Add Activity button - shown when plus button was clicked */}
          {!isTbcEnabled && showAddButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleAddActivity}
                className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                title="Add another activity"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </motion.button>
            </motion.div>
          )}
          
          {/* Show helpful instruction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-gray-600 text-center"
          >
            {isTbcEnabled ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium">✓ Activities to be confirmed (TBC) is enabled.</p>
                <p className="text-amber-700 text-xs mt-1">Activity codes will be determined later and are optional for now.</p>
              </div>
            ) : fields.length === 1 && !isActivityComplete(0) ? (
              <p>Fill in both the activity code and description to add more activities.</p>
            ) : !showAddButton ? (
              <p>Add all business activities that company will be conducting. Each activity requires both a code and description.</p>
            ) : (
              <p>Click "Add Activity" to add another business activity.</p>
            )}
          </motion.div>
        </div>
      </FormSection>
    </motion.div>
  );
}; 