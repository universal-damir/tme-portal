import React from 'react';
import { motion } from 'framer-motion';
import { UseFormRegister, UseFormSetValue, FieldPath } from 'react-hook-form';
import { OfferData } from '@/types/offer';

interface TMERadioProps {
  name: FieldPath<OfferData>;
  register: UseFormRegister<OfferData>;
  setValue: UseFormSetValue<OfferData>;
  value: string;
  checked: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const TMERadio: React.FC<TMERadioProps> = ({
  name,
  register,
  setValue,
  value,
  checked,
  label,
  description,
  disabled = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      console.log(`${name} clicked:`, value);
      setValue(name, value as any);
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
          type="radio"
          {...register(name)}
          value={value}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          readOnly
          tabIndex={-1}
          onFocus={(e) => e.target.blur()}
        />
        <div 
          className="w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center mt-0.5"
          style={{ 
            borderColor: checked ? '#243F7B' : '#d1d5db'
          }}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: '#243F7B' }}
            />
          )}
        </div>
      </div>
      <div className="flex-1">
        <span className="block text-sm font-medium" style={{ color: '#243F7B' }}>
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
};