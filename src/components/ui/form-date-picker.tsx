"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { UseFormRegister, FieldPath, FieldValues } from "react-hook-form"

interface FormDatePickerProps<T extends FieldValues> {
  /**
   * The form register function from React Hook Form
   */
  register: UseFormRegister<T>
  
  /**
   * The field name to register
   */
  name: FieldPath<T>
  
  /**
   * Current value as ISO string (YYYY-MM-DD)
   */
  value?: string
  
  /**
   * Handler called when the date changes
   */
  onChange?: (value: string) => void
  
  /**
   * Label for the date picker
   */
  label: string
  
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string
  
  /**
   * Whether the date picker is disabled
   */
  disabled?: boolean
  
  /**
   * Whether the field is required
   */
  required?: boolean
  
  /**
   * Custom class name for the container
   */
  className?: string
  
  /**
   * Date format for display (default: "dd.MM.yyyy")
   */
  dateFormat?: string
  
  /**
   * Error message to display
   */
  error?: string
  
  /**
   * Caption layout for the calendar (dropdown, dropdown-months, dropdown-years, label)
   */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
}

export function FormDatePicker<T extends FieldValues>({
  register,
  name,
  value,
  onChange,
  label,
  placeholder = "dd.mm.yyyy",
  disabled = false,
  required = false,
  className,
  dateFormat = "dd.MM.yyyy",
  error,
  captionLayout = "label",
}: FormDatePickerProps<T>) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())
  
  // Convert ISO string to Date object for display
  const selectedDate = value ? new Date(value) : undefined
  
  // Month names for the calendar
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  // Calendar helper functions
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }
  
  // Handle date selection
  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${dayStr}`
    onChange?.(formattedDate)
    setIsCalendarOpen(false)
  }
  
  // Navigate months
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
  
  // Format display date
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder
    const [year, month, day] = dateString.split('-')
    return `${day}.${month}.${year}`
  }
  
  // Close calendar on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.calendar-container')) {
        setIsCalendarOpen(false)
      }
    }
    
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCalendarOpen])

  return (
    <div className={className} style={{ fontFamily: 'Inter, sans-serif' }}>
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
          {label} {required && '*'}
        </label>
      )}
      
      {/* Hidden input for form registration */}
      <input
        type="hidden"
        {...register(name)}
        value={value || ''}
      />
      
      <div className="relative calendar-container">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
          style={{ borderColor: error ? '#ef4444' : '#e5e7eb' }}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {formatDisplayDate(value || '')}
          </span>
          <CalendarIcon className="w-5 h-5" style={{ color: '#243F7B' }} />
        </motion.button>
        
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px]"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => navigateMonth('prev')}
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
                type="button"
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  onChange?.('')
                  setIsCalendarOpen(false)
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
              >
                Clear
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  const today = new Date()
                  setCurrentMonth(today.getMonth())
                  setCurrentYear(today.getFullYear())
                  handleDateSelect(today.getDate())
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
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
} 