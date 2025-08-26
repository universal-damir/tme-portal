'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CustomDatePicker from '../ui/CustomDatePicker';

interface LetterDateSectionProps {
  letterDate: string;
  onLetterDateChange: (date: string) => void;
}

const LetterDateSection: React.FC<LetterDateSectionProps> = ({
  letterDate,
  onLetterDateChange,
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-3" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
        Letter Date
      </h3>

      <div className="w-full lg:w-1/2">
        <CustomDatePicker
          value={letterDate}
          onChange={onLetterDateChange}
          label="Date of Letter"
          placeholder="dd.mm.yyyy"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Date that will appear on the letter
        </p>
      </div>
    </motion.div>
  );
};

export default LetterDateSection;