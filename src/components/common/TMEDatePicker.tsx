'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface TMEDatePickerProps {
  value: string
  onChange: (date: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export const TMEDatePicker: React.FC<TMEDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'dd.mm.yyyy',
  disabled = false,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // Initialize current month/year from value if provided
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T12:00:00')
      if (!isNaN(date.getTime())) {
        setCurrentMonth(date.getMonth())
        setCurrentYear(date.getFullYear())
      }
    }
  }, [value])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder
    const [year, month, day] = dateString.split('-')
    return `${day}.${month}.${year}`
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${dayStr}`
    onChange(formattedDate)
    setIsOpen(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    handleDateSelect(today.getDate())
  }

  const clearDate = () => {
    onChange('')
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <motion.button
        type="button"
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px] ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        onFocus={(e) => !disabled && (e.target.style.borderColor = '#243F7B')}
        onBlur={(e) => !disabled && (e.target.style.borderColor = '#e5e7eb')}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="w-5 h-5" style={{ color: '#243F7B' }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: '#243F7B' }} />
              </motion.button>
              
              <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('next')}
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
                const day = index + 1
                const date = new Date(currentYear, currentMonth, day)
                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                const isSelected = value === dateString
                const isToday = 
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getFullYear() === currentYear
                
                return (
                  <motion.button
                    key={day}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDateSelect(day)}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center ${
                      isSelected
                        ? 'text-white shadow-md'
                        : isToday
                        ? 'text-white border-2'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#243F7B' : isToday ? '#D2BC99' : 'transparent',
                      borderColor: isToday ? '#243F7B' : 'transparent'
                    }}
                  >
                    {day}
                  </motion.button>
                )
              })}
            </div>
            
            {/* Calendar Footer */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearDate}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
              >
                Clear
              </motion.button>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
              >
                Today
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}