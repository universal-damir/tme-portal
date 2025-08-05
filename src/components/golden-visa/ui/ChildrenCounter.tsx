'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChildrenCounterProps {
  /**
   * Current count value
   */
  count: number;
  
  /**
   * Handler for count changes
   */
  onCountChange: (count: number) => void;
  
  /**
   * Minimum count (default: 0)
   */
  minCount?: number;
  
  /**
   * Maximum count (default: 10)
   */
  maxCount?: number;
  
  /**
   * Label for the counter (default: "Children")
   */
  label?: string;
}

export const ChildrenCounter: React.FC<ChildrenCounterProps> = ({
  count,
  onCountChange,
  minCount = 0,
  maxCount = 10,
  label = "Children",
}) => {
  const handleDecrement = () => {
    if (count > minCount) {
      onCountChange(count - 1);
    }
  };

  const handleIncrement = () => {
    if (count < maxCount) {
      onCountChange(count + 1);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleDecrement}
          disabled={count <= minCount}
          className="w-7 h-7 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            borderColor: count <= minCount ? '#d1d5db' : '#243F7B', 
            color: count <= minCount ? '#9ca3af' : '#243F7B' 
          }}
        >
          -
        </motion.button>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={count}
          readOnly
          className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center bg-gray-50"
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleIncrement}
          disabled={count >= maxCount}
          className="w-7 h-7 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            borderColor: count >= maxCount ? '#d1d5db' : '#243F7B', 
            color: count >= maxCount ? '#9ca3af' : '#243F7B' 
          }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}; 