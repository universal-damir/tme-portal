'use client';

import React from 'react';

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
}

export const ChildrenCounter: React.FC<ChildrenCounterProps> = ({
  count,
  onCountChange,
  minCount = 0,
  maxCount = 10,
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
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Children
      </label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={count <= minCount}
          className="w-10 h-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-l-xl hover:bg-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
        >
          -
        </button>
        <input
          type="text"
          value={count}
          readOnly
          className="w-20 px-4 py-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-gray-50"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={count >= maxCount}
          className="w-10 h-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-r-xl hover:bg-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}; 