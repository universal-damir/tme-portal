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
  minDate?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd.mm.yyyy',
  label,
  className = '',
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
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
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const parseDateInput = (input: string): string => {
    // Remove any non-digit characters except dots
    const cleaned = input.replace(/[^\d.]/g, '');
    
    // Try to parse dd.mm.yyyy format - only parse if we have a complete date
    const parts = cleaned.split('.');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      let [day, month, year] = parts;
      
      // Only parse if year is 4 digits (complete) or if it's exactly 2 digits and at end of complete input
      if (year.length === 4) {
        // Pad day and month with zeros if needed
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        // Validate date components
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
          // Create date to validate it's a real date
          const date = new Date(yearNum, monthNum - 1, dayNum);
          if (date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum) {
            return `${year}-${month}-${day}`;
          }
        }
      } else if (year.length === 2 && input.trim().endsWith(year)) {
        // Only auto-expand 2-digit years on blur or when user stops typing, not during typing
        // For now, don't auto-parse 2-digit years while typing
        return '';
      }
    }
    
    return '';
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    setInputValue(formatDisplayDate(formattedDate));
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Only allow digits and dots, limit to reasonable length
    let filtered = rawValue.replace(/[^\d.]/g, '').slice(0, 10);
    
    // Prevent multiple consecutive dots and more than 2 dots total
    filtered = filtered.replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
    const dotCount = (filtered.match(/\./g) || []).length;
    if (dotCount > 2) {
      // Remove extra dots from the end
      const lastDotIndex = filtered.lastIndexOf('.');
      filtered = filtered.substring(0, lastDotIndex) + filtered.substring(lastDotIndex + 1);
    }
    
    // Very minimal auto-formatting - just use what user typed
    setInputValue(filtered);
    
    // Try to parse the input and update the value if it's valid
    const parsedDate = parseDateInput(filtered);
    if (parsedDate) {
      onChange(parsedDate);
    } else if (filtered === '') {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Ensure that it is a number or dot and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
        (e.keyCode < 96 || e.keyCode > 105) && 
        e.keyCode !== 190 && e.keyCode !== 110) {
      e.preventDefault();
    }
  };

  const handleInputBlur = () => {
    // Try to complete 2-digit years on blur
    const parts = inputValue.split('.');
    if (parts.length === 3 && parts[2].length === 2) {
      const yearNum = parseInt(parts[2]);
      if (!isNaN(yearNum)) {
        // Convert 2-digit year to 4-digit year
        const fullYear = yearNum < 50 ? `20${parts[2]}` : `19${parts[2]}`;
        const completedInput = `${parts[0]}.${parts[1]}.${fullYear}`;
        
        // Try to parse the completed date
        const parsedDate = parseDateInput(completedInput);
        if (parsedDate) {
          setInputValue(completedInput);
          onChange(parsedDate);
          return;
        }
      }
    }
    
    // If input is invalid, revert to the last valid value
    if (value) {
      setInputValue(formatDisplayDate(value));
    } else if (!inputValue.trim()) {
      setInputValue('');
    }
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

  // Set current month/year and input value based on selected value
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      if (year && month) {
        setCurrentYear(year);
        setCurrentMonth(month - 1);
      }
      setInputValue(formatDisplayDate(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-12 rounded-lg border-2 border-gray-200 bg-white focus:outline-none transition-all duration-200 h-[42px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          autoComplete="off"
          maxLength={10}
        />
        <div className="absolute right-0 top-0 h-[42px] flex items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className={`h-full px-3 rounded-r-lg border-l transition-all duration-200 flex items-center justify-center`}
            style={{ 
              borderLeftColor: isOpen ? '#243F7B' : '#D2BC99',
              backgroundColor: isOpen ? '#D2BC99' : '#F5F1EB',
              borderColor: isOpen ? '#243F7B' : '#e5e7eb'
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: '#243F7B' }} />
          </motion.button>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px]"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateMonth('prev')}
              type="button"
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: '#243F7B' }} />
            </motion.button>
            
            <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
              {monthNames[currentMonth]} {currentYear}
            </h3>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateMonth('next')}
              type="button"
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
            >
              <ChevronRight className="w-5 h-5" style={{ color: '#243F7B' }} />
            </motion.button>
          </div>
          
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="text-center text-sm font-semibold py-2 w-10 h-8 flex items-center justify-center"
                style={{ color: '#243F7B' }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10 w-10" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentYear, currentMonth, day);
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isSelected = value === dateString;
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;
              
              // Check if date is before minDate
              const isDisabled = minDate && dateString < minDate;
              
              return (
                <motion.button
                  key={day}
                  whileHover={!isDisabled ? { scale: 1.1 } : {}}
                  whileTap={!isDisabled ? { scale: 0.9 } : {}}
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  type="button"
                  disabled={isDisabled}
                  className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center ${
                    isDisabled
                      ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                      : isSelected
                      ? 'text-white shadow-md'
                      : isToday
                      ? 'text-white border-2'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isDisabled ? '#f9fafb' : isSelected ? '#243F7B' : isToday ? '#D2BC99' : 'transparent',
                    borderColor: isToday ? '#243F7B' : 'transparent'
                  }}
                >
                  {day}
                </motion.button>
              );
            })}
          </div>
          
          {/* Calendar Footer */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInputValue('');
                onChange('');
                setIsOpen(false);
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
                handleDateSelect(today.getDate());
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