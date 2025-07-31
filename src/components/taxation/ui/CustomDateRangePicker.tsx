'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaxPeriodDateRange } from '@/types/taxation';

interface CustomDateRangePickerProps {
  /**
   * Current date range values
   */
  value: TaxPeriodDateRange;
  
  /**
   * Handler for date range changes
   */
  onChange: (range: TaxPeriodDateRange) => void;
  
  /**
   * Label for the date range picker
   */
  label: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Whether the fields are required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Error message
   */
  error?: string;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  label,
  description,
  required = false,
  className = '',
  error,
}) => {
  const [isRangeCalendarOpen, setIsRangeCalendarOpen] = useState(false);
  const [rangeCurrentMonth, setRangeCurrentMonth] = useState(new Date().getMonth());
  const [rangeCurrentYear, setRangeCurrentYear] = useState(new Date().getFullYear());
  const [rangeTempSelection, setRangeTempSelection] = useState<string | null>(null);
  const [rangeSelectionStep, setRangeSelectionStep] = useState<'year' | 'month' | 'day'>('year');
  const [rangeSelectedYear, setRangeSelectedYear] = useState<number | null>(null);
  const [rangeSelectedMonth, setRangeSelectedMonth] = useState<number | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'dd.mm.yyyy';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatDateRange = () => {
    if (!value.fromDate && !value.toDate) {
      return 'dd.mm.yyyy - dd.mm.yyyy';
    }
    
    const fromFormatted = value.fromDate ? formatDisplayDate(value.fromDate) : 'dd.mm.yyyy';
    const toFormatted = value.toDate ? formatDisplayDate(value.toDate) : 'dd.mm.yyyy';
    
    return `${fromFormatted} - ${toFormatted}`;
  };

  const isDateInRange = (dateString: string) => {
    if (!value.fromDate) return false;
    
    const date = new Date(dateString + 'T12:00:00');
    const fromDate = new Date(value.fromDate + 'T12:00:00');
    
    if (value.toDate) {
      const toDate = new Date(value.toDate + 'T12:00:00');
      return date >= fromDate && date <= toDate;
    } else if (rangeTempSelection) {
      const tempDate = new Date(rangeTempSelection + 'T12:00:00');
      const startDate = date <= tempDate ? date : tempDate;
      const endDate = date <= tempDate ? tempDate : date;
      return date >= startDate && date <= endDate;
    }
    
    return false;
  };

  const isRangeEndpoint = (dateString: string) => {
    return dateString === value.fromDate || dateString === value.toDate;
  };

  const handleRangeDateSelect = (day: number) => {
    const date = new Date(rangeCurrentYear, rangeCurrentMonth, day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    if (!value.fromDate || (value.fromDate && value.toDate)) {
      // Start new selection
      onChange({ fromDate: formattedDate, toDate: '' });
      setRangeTempSelection(formattedDate);
      setRangeSelectionStep('year'); // Reset for "to" date selection
    } else if (value.fromDate && !value.toDate) {
      // Complete the range
      const fromDate = new Date(value.fromDate + 'T12:00:00');
      const toDate = new Date(formattedDate + 'T12:00:00');
      
      if (toDate >= fromDate) {
        onChange({ fromDate: value.fromDate, toDate: formattedDate });
        setRangeTempSelection(null);
        setIsRangeCalendarOpen(false);
        setRangeSelectionStep('year');
      } else {
        // If selected date is before 'from', swap them
        onChange({ fromDate: formattedDate, toDate: value.fromDate });
        setRangeTempSelection(null);
        setIsRangeCalendarOpen(false);
        setRangeSelectionStep('year');
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
          {label} {required && '*'}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-2">
            {description}
          </p>
        )}
      </div>

      <div className="relative max-w-md">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setIsRangeCalendarOpen(!isRangeCalendarOpen);
            if (!isRangeCalendarOpen) {
              setRangeSelectionStep('year');
              setRangeSelectedYear(null);
              setRangeSelectedMonth(null);
            }
          }}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        >
          <span className={(value.fromDate || value.toDate) ? 'text-gray-900' : 'text-gray-500'}>
            {formatDateRange()}
          </span>
          <Calendar className="w-5 h-5" style={{ color: '#243F7B' }} />
        </motion.button>
        
        {isRangeCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-20 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 w-full max-w-md"
            style={{ left: '0' }}
          >
            {/* Year Selection */}
            {rangeSelectionStep === 'year' && (
              <div>
                <h4 className="text-center text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
                  Select Year
                </h4>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {Array.from({ length: 20 }, (_, i) => {
                    const year = new Date().getFullYear() - 10 + i;
                    return (
                      <motion.button
                        key={year}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setRangeSelectedYear(year);
                          setRangeSelectionStep('month');
                        }}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                          year === new Date().getFullYear()
                            ? 'text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={{
                          backgroundColor: year === new Date().getFullYear() ? '#D2BC99' : 'transparent'
                        }}
                      >
                        {year}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month Selection */}
            {rangeSelectionStep === 'month' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRangeSelectionStep('year')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: '#243F7B' }} />
                  </motion.button>
                  <h4 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                    Select Month - {rangeSelectedYear}
                  </h4>
                  <div className="w-6" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((month, index) => (
                    <motion.button
                      key={month}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setRangeSelectedMonth(index);
                        setRangeCurrentMonth(index);
                        setRangeCurrentYear(rangeSelectedYear!);
                        setRangeSelectionStep('day');
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                        index === new Date().getMonth() && rangeSelectedYear === new Date().getFullYear()
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: index === new Date().getMonth() && rangeSelectedYear === new Date().getFullYear() ? '#D2BC99' : 'transparent'
                      }}
                    >
                      {month.slice(0, 3)}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Day Selection */}
            {rangeSelectionStep === 'day' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRangeSelectionStep('month')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: '#243F7B' }} />
                  </motion.button>
                  <h4 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                    {monthNames[rangeCurrentMonth]} {rangeCurrentYear}
                  </h4>
                  <div className="w-6" />
                </div>
                
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium py-1 text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells */}
                  {Array.from({ length: getFirstDayOfMonth(rangeCurrentMonth, rangeCurrentYear) }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-8 w-8" />
                  ))}
                  
                  {/* Days */}
                  {Array.from({ length: getDaysInMonth(rangeCurrentMonth, rangeCurrentYear) }).map((_, index) => {
                    const day = index + 1;
                    const date = new Date(rangeCurrentYear, rangeCurrentMonth, day);
                    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const isSelected = isRangeEndpoint(dateString);
                    const isInRange = isDateInRange(dateString);
                    const isToday = 
                      new Date().getDate() === day &&
                      new Date().getMonth() === rangeCurrentMonth &&
                      new Date().getFullYear() === rangeCurrentYear;
                    
                    return (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRangeDateSelect(day)}
                        className={`h-8 w-8 rounded-md text-sm font-medium transition-all duration-150 flex items-center justify-center ${
                          isSelected
                            ? 'text-white shadow-md'
                            : isInRange
                            ? 'text-white'
                            : isToday
                            ? 'text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? '#243F7B' : isInRange ? '#D2BC99' : isToday ? '#D2BC99' : 'transparent'
                        }}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Range Calendar Footer */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onChange({ fromDate: '', toDate: '' });
                  setRangeTempSelection(null);
                  setRangeSelectionStep('year');
                  setRangeSelectedYear(null);
                  setRangeSelectedMonth(null);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
              >
                Clear
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const today = new Date();
                  setRangeCurrentMonth(today.getMonth());
                  setRangeCurrentYear(today.getFullYear());
                  setRangeSelectionStep('year');
                  setRangeSelectedYear(null);
                  setRangeSelectedMonth(null);
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
              >
                Today
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Date Range Summary */}
      {(value.fromDate || value.toDate) && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Selected Period:</span>{' '}
            {value.fromDate ? formatDisplayDate(value.fromDate) : 'Not set'} -{' '}
            {value.toDate ? formatDisplayDate(value.toDate) : 'Not set'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};