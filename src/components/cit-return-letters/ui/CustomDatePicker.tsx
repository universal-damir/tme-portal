'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd.mm.yyyy',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectionStep, setSelectionStep] = useState<'year' | 'month' | 'day'>('year');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set current month/year based on selected value
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (year && month) {
        setCurrentYear(year);
        setCurrentMonth(month - 1);
      }
    }
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
          {label}
        </label>
      )}
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSelectionStep('year');
            setSelectedYear(null);
            setSelectedMonth(null);
          }
        }}
        type="button"
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
        onFocus={(e) => e.target.style.borderColor = '#243F7B'}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="w-5 h-5" style={{ color: '#243F7B' }} />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px]"
        >
          {/* Year Selection */}
          {selectionStep === 'year' && (
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
                        setSelectedYear(year);
                        setSelectionStep('month');
                      }}
                      type="button"
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
          {selectionStep === 'month' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectionStep('year')}
                  type="button"
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#243F7B' }} />
                </motion.button>
                <h4 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                  Select Month - {selectedYear}
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
                      setSelectedMonth(index);
                      setCurrentMonth(index);
                      setCurrentYear(selectedYear!);
                      setSelectionStep('day');
                    }}
                    type="button"
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                      index === new Date().getMonth() && selectedYear === new Date().getFullYear()
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: index === new Date().getMonth() && selectedYear === new Date().getFullYear() ? '#D2BC99' : 'transparent'
                    }}
                  >
                    {month.slice(0, 3)}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Day Selection */}
          {selectionStep === 'day' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectionStep('month')}
                  type="button"
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#243F7B' }} />
                </motion.button>
                <h4 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                  {monthNames[currentMonth]} {currentYear}
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
                {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-8 w-8" />
                ))}
                
                {/* Days */}
                {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(currentYear, currentMonth, day);
                  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  const isSelected = value === dateString;
                  const isToday = 
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentMonth &&
                    new Date().getFullYear() === currentYear;
                  
                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDateSelect(day)}
                      type="button"
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? 'text-white shadow-md'
                          : isToday
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? '#243F7B' : isToday ? '#D2BC99' : 'transparent'
                      }}
                    >
                      {day}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Calendar Footer */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange('');
                setSelectionStep('year');
                setSelectedYear(null);
                setSelectedMonth(null);
              }}
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
            >
              Clear
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setSelectionStep('year');
                setSelectedYear(null);
                setSelectedMonth(null);
              }}
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
              style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
            >
              Today
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomDatePicker;