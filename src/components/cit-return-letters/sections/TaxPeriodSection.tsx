'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomDatePicker from '../ui/CustomDatePicker';

interface TaxPeriodSectionProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const TaxPeriodSection: React.FC<TaxPeriodSectionProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {

  // Auto-populate end date when start date changes (only if end date is empty)
  useEffect(() => {
    if (startDate && startDate !== '' && (!endDate || endDate === '')) {
      const startDateObj = new Date(startDate);
      if (!isNaN(startDateObj.getTime())) {
        // Add 1 year to the start date, then subtract 1 day to get last day of tax period
        const endDateObj = new Date(startDateObj);
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        endDateObj.setDate(endDateObj.getDate() - 1);
        
        // Format as YYYY-MM-DD
        const formattedEndDate = endDateObj.toISOString().split('T')[0];
        
        onEndDateChange(formattedEndDate);
      }
    }
  }, [startDate, onEndDateChange]); // Remove endDate from dependencies to allow manual editing

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
        Tax Period
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Start Date */}
        <CustomDatePicker
          value={startDate}
          onChange={onStartDateChange}
          label="Tax Period Start Date"
          placeholder="dd.mm.yyyy"
        />

        {/* End Date */}
        <div>
          <CustomDatePicker
            value={endDate}
            onChange={onEndDateChange}
            label="Tax Period End Date"
            placeholder="dd.mm.yyyy"
            minDate={startDate}
          />
          {startDate && (
            <p className="text-xs text-gray-500 mt-1">
              Auto-populated as last day of tax year (editable, must be after start date)
            </p>
          )}
        </div>
      </div>

      {/* Tax Period Summary */}
      {startDate && endDate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-blue-50 rounded-lg border"
          style={{ borderColor: '#243F7B' }}
        >
          <div className="text-sm">
            <span className="font-medium" style={{ color: '#243F7B' }}>
              Tax Period: 
            </span>
            <span className="ml-2 text-gray-700">
              {new Date(startDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })} 
              {' - '}
              {new Date(endDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Duration: {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TaxPeriodSection;