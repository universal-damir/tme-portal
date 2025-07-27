import React from 'react';
import { motion } from 'framer-motion';
import { UseFormRegister, UseFormSetValue, FieldPath } from 'react-hook-form';
import { OfferData } from '@/types/offer';

interface TMECheckboxProps {
  name: FieldPath<OfferData>;
  register: UseFormRegister<OfferData>;
  setValue: UseFormSetValue<OfferData>;
  checked: boolean;
  label: string;
  description?: string;
  cost?: string;
  disabled?: boolean;
}

export const TMECheckbox: React.FC<TMECheckboxProps> = ({
  name,
  register,
  setValue,
  checked,
  label,
  description,
  cost,
  disabled = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      console.log(`${name} clicked:`, !checked);
      setValue(name, !checked);
    }
  };

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      className={`flex items-start gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      <div className="relative">
        <input
          type="checkbox"
          {...register(name)}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          tabIndex={-1}
          onFocus={(e) => e.target.blur()}
        />
        <div 
          className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center mt-0.5"
          style={{ 
            borderColor: checked ? '#243F7B' : '#d1d5db',
            backgroundColor: checked ? '#243F7B' : 'white'
          }}
        >
          {checked && (
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
      <div className="flex-1">
        <span className="block text-sm font-medium" style={{ color: '#243F7B' }}>
          {label} {cost && `(+AED ${cost})`}
        </span>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
};