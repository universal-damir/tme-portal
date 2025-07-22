import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { FormSection } from '../ui/FormSection';

interface ActivityCodesSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  activityCodesArray: UseFieldArrayReturn<OfferData, 'activityCodes', 'id'>;
  watchedData: OfferData;
}

export const ActivityCodesSection: React.FC<ActivityCodesSectionProps> = ({
  register,
  errors,
  activityCodesArray,
  watchedData
}) => {
  const { fields, append, remove } = activityCodesArray;
  const [showAddButton, setShowAddButton] = useState(false);
  
  // Check which authority is selected
  const isIfzaSelected = watchedData.authorityInformation?.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = watchedData.authorityInformation?.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Check if TBC is enabled for either authority
  const isTbcEnabled = (isIfzaSelected && watchedData.ifzaLicense?.activitiesToBeConfirmed) || 
                       (isDetSelected && watchedData.detLicense?.activitiesToBeConfirmed) || false;

  // Ensure at least one activity field exists when TBC is not enabled
  useEffect(() => {
    if (!isTbcEnabled && fields.length === 0) {
      append({ code: '', description: '' });
    }
  }, [isTbcEnabled, fields.length, append]);

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
    // Ensure at least one field remains when TBC is not enabled
    if (!isTbcEnabled && fields.length <= 1) {
      append({ code: '', description: '' });
    }
  };

  return (
    <FormSection
      title="Activity Codes"
      description="Business activity information"
      icon={FileText}
      iconColor="text-purple-600"
      className="lg:col-span-2"
    >
      {/* TBC Checkbox for IFZA */}
      {isIfzaSelected && (
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ifzaActivitiesToBeConfirmed"
              {...register('ifzaLicense.activitiesToBeConfirmed')}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="ifzaActivitiesToBeConfirmed" className="ml-3 block text-sm font-medium text-gray-700">
              Activities to be confirmed - TBC
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Check this if the specific business activities are to be confirmed later. When checked, activity codes selection becomes optional.
          </p>
        </div>
      )}

      {/* TBC Checkbox for DET */}
      {isDetSelected && (
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="detActivitiesToBeConfirmed"
              {...register('detLicense.activitiesToBeConfirmed')}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="detActivitiesToBeConfirmed" className="ml-3 block text-sm font-medium text-gray-700">
              Activities to be confirmed - TBC
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Check this if the specific business activities are to be confirmed later. When checked, activity codes selection becomes optional.
          </p>
        </div>
      )}

      {/* Activity Fields - Only show when TBC is not enabled */}
      {!isTbcEnabled && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Activity Code {(!isIfzaSelected && !isDetSelected) && '*'}
                </label>
                <input
                  {...register(`activityCodes.${index}.code`)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Enter activity code"
                />
                {errors.activityCodes?.[index]?.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.activityCodes[index]?.code?.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Activity Description {(!isIfzaSelected && !isDetSelected) && '*'}
                  </label>
                  <input
                    {...register(`activityCodes.${index}.description`)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter activity description"
                  />
                  {errors.activityCodes?.[index]?.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.activityCodes[index]?.description?.message}</p>
                  )}
                </div>
                
                <div className="flex items-end gap-2">
                  {/* Small plus button only appears on the last field when it's complete and Add button is not shown */}
                  {shouldShowPlusButton(index) && (
                    <button
                      type="button"
                      onClick={handleShowAddButton}
                      className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-colors duration-200 inline-flex items-center"
                      title="Show add activity option"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Remove button only shows when there's more than 1 field */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(index)}
                      className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors duration-200"
                      title="Remove this activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Activity button - shown when plus button was clicked */}
      {!isTbcEnabled && showAddButton && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleAddActivity}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors duration-200 inline-flex items-center gap-2 font-medium"
            title="Add another activity"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </button>
        </div>
      )}
      
      {/* Show helpful instruction */}
      <div className="mt-4 text-sm text-gray-500 text-center">
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
      </div>
    </FormSection>
  );
}; 