'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronDown, Check, ChevronLeft, ChevronRight, ChevronUp, Edit, Trash2, Eye, LogIn, LogOut, UserPlus, FileText, Settings } from 'lucide-react'

export default function StyleGuidePage() {
  const [selectedDropdown, setSelectedDropdown] = useState('')
  const [selectedRadio, setSelectedRadio] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: '',
    to: ''
  })
  const [isRangeCalendarOpen, setIsRangeCalendarOpen] = useState(false)
  const [rangeCurrentMonth, setRangeCurrentMonth] = useState(new Date().getMonth())
  const [rangeCurrentYear, setRangeCurrentYear] = useState(new Date().getFullYear())
  const [rangeTempSelection, setRangeTempSelection] = useState<string | null>(null)
  const [rangeSelectionStep, setRangeSelectionStep] = useState<'year' | 'month' | 'day'>('year')
  const [rangeSelectedYear, setRangeSelectedYear] = useState<number | null>(null)
  const [rangeSelectedMonth, setRangeSelectedMonth] = useState<number | null>(null)
  const [toggleStates, setToggleStates] = useState({
    toggle1: false,
    toggle2: true,
    toggle3: false
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const handleCheckboxChange = (value: string) => {
    setCheckedItems(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }

  const handleToggleChange = (toggleKey: keyof typeof toggleStates) => {
    setToggleStates(prev => ({
      ...prev,
      [toggleKey]: !prev[toggleKey]
    }))
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${dayStr}`
    setSelectedDate(formattedDate)
    setIsCalendarOpen(false)
  }

  const handleRangeDateSelect = (day: number) => {
    const date = new Date(rangeCurrentYear, rangeCurrentMonth, day)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${dayStr}`
    
    if (!selectedDateRange.from || (selectedDateRange.from && selectedDateRange.to)) {
      // Start new selection
      setSelectedDateRange({ from: formattedDate, to: '' })
      setRangeTempSelection(formattedDate)
    } else if (selectedDateRange.from && !selectedDateRange.to) {
      // Complete the range
      const fromDate = new Date(selectedDateRange.from + 'T12:00:00')
      const toDate = new Date(formattedDate + 'T12:00:00')
      
      if (toDate >= fromDate) {
        setSelectedDateRange({ from: selectedDateRange.from, to: formattedDate })
        setRangeTempSelection(null)
        setIsRangeCalendarOpen(false)
      } else {
        // If selected date is before 'from', swap them
        setSelectedDateRange({ from: formattedDate, to: selectedDateRange.from })
        setRangeTempSelection(null)
        setIsRangeCalendarOpen(false)
      }
    }
  }

  const isDateInRange = (dateString: string) => {
    if (!selectedDateRange.from) return false
    
    const date = new Date(dateString + 'T12:00:00')
    const fromDate = new Date(selectedDateRange.from + 'T12:00:00')
    
    if (selectedDateRange.to) {
      const toDate = new Date(selectedDateRange.to + 'T12:00:00')
      return date >= fromDate && date <= toDate
    } else if (rangeTempSelection) {
      const tempDate = new Date(rangeTempSelection + 'T12:00:00')
      const startDate = date <= tempDate ? date : tempDate
      const endDate = date <= tempDate ? tempDate : date
      return date >= startDate && date <= endDate
    }
    
    return false
  }

  const isRangeEndpoint = (dateString: string) => {
    return dateString === selectedDateRange.from || dateString === selectedDateRange.to
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

  const navigateRangeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (rangeCurrentMonth === 0) {
        setRangeCurrentMonth(11)
        setRangeCurrentYear(rangeCurrentYear - 1)
      } else {
        setRangeCurrentMonth(rangeCurrentMonth - 1)
      }
    } else {
      if (rangeCurrentMonth === 11) {
        setRangeCurrentMonth(0)
        setRangeCurrentYear(rangeCurrentYear + 1)
      } else {
        setRangeCurrentMonth(rangeCurrentMonth + 1)
      }
    }
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'dd.mm.yyyy'
    const [year, month, day] = dateString.split('-')
    return `${day}.${month}.${year}`
  }

  const formatDateRange = () => {
    if (!selectedDateRange.from && !selectedDateRange.to) {
      return 'dd.mm.yyyy - dd.mm.yyyy'
    }
    
    const fromFormatted = selectedDateRange.from ? formatDisplayDate(selectedDateRange.from) : 'dd.mm.yyyy'
    const toFormatted = selectedDateRange.to ? formatDisplayDate(selectedDateRange.to) : 'dd.mm.yyyy'
    
    return `${fromFormatted} - ${toFormatted}`
  }

  const dropdownOptions = [
    'Option 1',
    'Option 2', 
    'Option 3',
    'Option 4'
  ]

  const radioOptions = [
    'Radio Option 1',
    'Radio Option 2',
    'Radio Option 3'
  ]

  const checkboxOptions = [
    'Checkbox Option 1',
    'Checkbox Option 2',
    'Checkbox Option 3'
  ]

  const tableData = [
    { id: 1, name: 'Ahmed Al-Rashid', email: 'ahmed@example.com', company: 'Al-Rashid Trading LLC', status: 'Active', date: '15.07.2025' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', company: 'Johnson Consulting FZ', status: 'Pending', date: '18.07.2025' },
    { id: 3, name: 'Mohammed Hassan', email: 'mohammed@example.com', company: 'Hassan Industries LLC', status: 'Active', date: '20.07.2025' },
    { id: 4, name: 'Lisa Chen', email: 'lisa@example.com', company: 'Chen Tech Solutions', status: 'Inactive', date: '22.07.2025' },
    { id: 5, name: 'Omar Khalil', email: 'omar@example.com', company: 'Khalil Group FZ-LLC', status: 'Active', date: '25.07.2025' }
  ]

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig) return tableData
    
    return [...tableData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [sortConfig])

  const activityData = [
    { id: 1, type: 'login', title: 'Login Success', time: '26.07.2025 11:50', category: 'Auth', icon: LogIn },
    { id: 2, type: 'logout', title: 'Logout', time: '26.07.2025 11:49', category: 'Auth', icon: LogOut },
    { id: 3, type: 'login', title: 'Login Success', time: '26.07.2025 11:44', category: 'Auth', icon: LogIn },
    { id: 4, type: 'login', title: 'Login Success', time: '26.07.2025 10:46', category: 'Auth', icon: LogIn },
    { id: 5, type: 'logout', title: 'Logout', time: '24.07.2025 16:48', category: 'Auth', icon: LogOut },
    { id: 6, type: 'user', title: 'New User Registration', time: '24.07.2025 14:32', category: 'User', icon: UserPlus },
    { id: 7, type: 'document', title: 'Document Generated', time: '24.07.2025 12:15', category: 'System', icon: FileText },
    { id: 8, type: 'settings', title: 'Settings Updated', time: '23.07.2025 09:22', category: 'System', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#243F7B' }}>
            TME Design System Style Guide
          </h1>
          <p className="text-lg text-gray-600">
            A comprehensive showcase of the new design system components
          </p>
        </motion.div>

        {/* Color Palette */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Color Palette
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-lg text-white" style={{ backgroundColor: '#243F7B' }}>
              <h3 className="text-xl font-semibold mb-2">Primary Blue</h3>
              <p className="text-sm opacity-90">#243F7B</p>
              <p className="text-sm opacity-75">Use for primary actions, headers, and emphasis</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}>
              <h3 className="text-xl font-semibold mb-2">Secondary Beige</h3>
              <p className="text-sm opacity-90">#D2BC99</p>
              <p className="text-sm opacity-75">Use for secondary actions and accents</p>
            </div>
          </div>

          {/* Section Background Colors - Golden Visa Focus */}
          <div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#243F7B' }}>
              Golden Visa Section Colors
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Simple monochromatic background colors for key Golden Visa sections with clear visual distinction
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TME Professional Service Fee */}
              <div className="p-6 rounded-lg border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold mb-1" style={{ color: '#243F7B' }}>TME Professional Service Fee</h4>
                    <p className="text-xs text-gray-500">Professional consultation fees</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <p><span className="font-medium">Background:</span> #F8FAFC</p>
                  <p><span className="font-medium">Border:</span> #E2E8F0</p>
                  <p><span className="font-medium">Class:</span> bg-slate-50 border-slate-200</p>
                </div>
                
                {/* Example Usage */}
                <div className="mt-4 p-3 rounded border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                  <p className="text-xs font-medium text-gray-700">TME Professional Service Fee (AED)</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#243F7B' }}>4,820</p>
                </div>
              </div>

              {/* Spouse Visa */}
              <div className="p-6 rounded-lg border" style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold mb-1" style={{ color: '#243F7B' }}>Spouse Visa</h4>
                    <p className="text-xs text-gray-500">Dependent spouse visa fees</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <p><span className="font-medium">Background:</span> #F1F5F9</p>
                  <p><span className="font-medium">Border:</span> #CBD5E1</p>
                  <p><span className="font-medium">Class:</span> bg-slate-100 border-slate-300</p>
                </div>
                
                {/* Example Usage */}
                <div className="mt-4 p-3 rounded border" style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }}>
                  <p className="text-xs font-medium text-gray-700">TME Service Fee - Spouse (AED)</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#243F7B' }}>3,490</p>
                </div>
              </div>

              {/* Children Visa */}
              <div className="p-6 rounded-lg border" style={{ backgroundColor: '#E2E8F0', borderColor: '#94A3B8' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold mb-1" style={{ color: '#243F7B' }}>Children Visa</h4>
                    <p className="text-xs text-gray-500">Dependent children visa fees</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <p><span className="font-medium">Background:</span> #E2E8F0</p>
                  <p><span className="font-medium">Border:</span> #94A3B8</p>
                  <p><span className="font-medium">Class:</span> bg-slate-200 border-slate-400</p>
                </div>
                
                {/* Example Usage */}
                <div className="mt-4 p-3 rounded border" style={{ backgroundColor: '#E2E8F0', borderColor: '#94A3B8' }}>
                  <p className="text-xs font-medium text-gray-700">TME Service Fee per Child (AED)</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#243F7B' }}>2,930</p>
                </div>
              </div>
            </div>

            {/* Color Progression Explanation */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold mb-3" style={{ color: '#243F7B' }}>Monochromatic Approach</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <h5 className="font-medium mb-3">Design Logic:</h5>
                  <ul className="space-y-2 text-xs">
                    <li>• <strong>TME Services:</strong> Lightest gray (slate-50) - most important</li>
                    <li>• <strong>Spouse:</strong> Medium-light gray (slate-100) - secondary importance</li>
                    <li>• <strong>Children:</strong> Medium gray (slate-200) - third level</li>
                    <li>• Progressive darkness creates visual hierarchy</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-3">Benefits:</h5>
                  <ul className="space-y-2 text-xs">
                    <li>• Simple, professional, and cohesive</li>
                    <li>• Clear visual distinction without distraction</li>
                    <li>• Maintains TME brand consistency</li>
                    <li>• Easy to implement and maintain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Typography */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Typography
          </h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#243F7B' }}>
                Heading 1 - Inter Bold
              </h1>
            </div>
            <div>
              <h2 className="text-3xl font-semibold" style={{ color: '#243F7B' }}>
                Heading 2 - Inter Semibold
              </h2>
            </div>
            <div>
              <h3 className="text-2xl font-medium" style={{ color: '#243F7B' }}>
                Heading 3 - Inter Medium
              </h3>
            </div>
            <div>
              <p className="text-lg text-gray-700">
                Body Large - Inter Regular (18px)
              </p>
            </div>
            <div>
              <p className="text-base text-gray-700">
                Body Regular - Inter Regular (16px)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Body Small - Inter Regular (14px)
              </p>
            </div>
          </div>
        </motion.section>

        {/* Buttons */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Buttons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Primary Buttons
              </h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#243F7B' }}
                >
                  Primary Large
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#243F7B' }}
                >
                  Primary Medium
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-3 py-1.5 rounded-md font-medium text-white text-sm transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#243F7B' }}
                >
                  Primary Small
                </motion.button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Secondary Buttons
              </h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                >
                  Secondary Large
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                >
                  Secondary Medium
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-3 py-1.5 rounded-md font-medium text-sm transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                >
                  Secondary Small
                </motion.button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Outline Buttons
              </h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-lg font-semibold bg-white border-2 transition-all duration-200 hover:shadow-lg"
                  style={{ borderColor: '#243F7B', color: '#243F7B' }}
                >
                  Outline Large
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-lg font-medium bg-white border-2 transition-all duration-200 hover:shadow-lg"
                  style={{ borderColor: '#243F7B', color: '#243F7B' }}
                >
                  Outline Medium
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-3 py-1.5 rounded-md font-medium bg-white border-2 text-sm transition-all duration-200 hover:shadow-lg"
                  style={{ borderColor: '#243F7B', color: '#243F7B' }}
                >
                  Outline Small
                </motion.button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Disabled States
              </h3>
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gray-400 cursor-not-allowed"
                >
                  Disabled Primary
                </button>
                <button
                  disabled
                  className="w-full px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  Disabled Secondary
                </button>
                <button
                  disabled
                  className="w-full px-3 py-1.5 rounded-md font-medium bg-white border-2 border-gray-300 text-gray-400 text-sm cursor-not-allowed"
                >
                  Disabled Outline
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Form Components */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Form Components
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Inputs */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Text Inputs
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                    Standard Input
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    placeholder="Enter text here..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                    Email Input
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    placeholder="Enter email address..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                    Password Input
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="password"
                    placeholder="Enter password..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                    Textarea
                  </label>
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    placeholder="Enter longer text here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 resize-none"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Dropdown Menu
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                    Select Option
                  </label>
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200"
                    >
                      <span className={selectedDropdown ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedDropdown || 'Choose an option...'}
                      </span>
                      <motion.div
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </motion.button>
                    
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                      >
                        {dropdownOptions.map((option) => (
                          <motion.button
                            key={option}
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            onClick={() => {
                              setSelectedDropdown(option)
                              setIsDropdownOpen(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                          >
                            {option}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Radio Buttons, Checkboxes and Toggle Switches */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Radio Buttons */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Radio Buttons
              </h3>
              <div className="space-y-3">
                {radioOptions.map((option) => (
                  <motion.label
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name="radio-group"
                        value={option}
                        checked={selectedRadio === option}
                        onChange={(e) => setSelectedRadio(e.target.value)}
                        className="sr-only"
                      />
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: selectedRadio === option ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {selectedRadio === option && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Checkboxes
              </h3>
              <div className="space-y-3">
                {checkboxOptions.map((option) => (
                  <motion.label
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={checkedItems.includes(option)}
                        onChange={() => handleCheckboxChange(option)}
                        className="sr-only"
                      />
                      <div 
                        className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                          checkedItems.includes(option)
                            ? 'border-2'
                            : 'border-2 border-gray-300'
                        }`}
                        style={{ 
                          borderColor: checkedItems.includes(option) ? '#243F7B' : '#d1d5db',
                          backgroundColor: checkedItems.includes(option) ? '#243F7B' : 'white'
                        }}
                      >
                        {checkedItems.includes(option) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Toggle Switches
              </h3>
              <div className="space-y-4">
                {/* Basic Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                  <span className="text-gray-700">Enable notifications</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleChange('toggle1')}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      toggleStates.toggle1 ? 'shadow-md' : ''
                    }`}
                    style={{ 
                      backgroundColor: toggleStates.toggle1 ? '#243F7B' : '#e5e7eb' 
                    }}
                  >
                    <motion.div
                      animate={{ 
                        x: toggleStates.toggle1 ? 24 : 2,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </motion.button>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                  <span className="text-gray-700">Dark mode</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleChange('toggle2')}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      toggleStates.toggle2 ? 'shadow-md' : ''
                    }`}
                    style={{ 
                      backgroundColor: toggleStates.toggle2 ? '#243F7B' : '#e5e7eb' 
                    }}
                  >
                    <motion.div
                      animate={{ 
                        x: toggleStates.toggle2 ? 24 : 2,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </motion.button>
                </div>

                {/* Larger Toggle with Icon */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                  <span className="text-gray-700">Auto-save documents</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleChange('toggle3')}
                    className={`relative w-14 h-7 rounded-full transition-all duration-200 ${
                      toggleStates.toggle3 ? 'shadow-md' : ''
                    }`}
                    style={{ 
                      backgroundColor: toggleStates.toggle3 ? '#243F7B' : '#e5e7eb' 
                    }}
                  >
                    <motion.div
                      animate={{ 
                        x: toggleStates.toggle3 ? 28 : 2,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center"
                    >
                      {toggleStates.toggle3 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: '#243F7B' }}
                        />
                      )}
                    </motion.div>
                  </motion.button>
                </div>

                {/* Disabled Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg opacity-50 cursor-not-allowed">
                  <span className="text-gray-500">Disabled option</span>
                  <button
                    disabled
                    className="relative w-12 h-6 rounded-full bg-gray-300 cursor-not-allowed"
                  >
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Date Pickers */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Date Pickers
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Single Date Picker */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Single Date Picker
              </h3>
              <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                Select Date
              </label>
              <div className="relative">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                  {formatDisplayDate(selectedDate)}
                </span>
                <Calendar className="w-5 h-5" style={{ color: '#243F7B' }} />
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
                      const isSelected = selectedDate === dateString
                      const isToday = 
                        new Date().getDate() === day &&
                        new Date().getMonth() === currentMonth &&
                        new Date().getFullYear() === currentYear
                      
                      return (
                        <motion.button
                          key={day}
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedDate('')
                        setIsCalendarOpen(false)
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
                    >
                      Clear
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
            </div>

            {/* Date Range Picker */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Date Range Picker
              </h3>
              <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                Select Date Range
              </label>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setIsRangeCalendarOpen(!isRangeCalendarOpen)
                    if (!isRangeCalendarOpen) {
                      setRangeSelectionStep('year')
                      setRangeSelectedYear(null)
                      setRangeSelectedMonth(null)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <span className={(selectedDateRange.from || selectedDateRange.to) ? 'text-gray-900' : 'text-gray-500'}>
                    {formatDateRange()}
                  </span>
                  <Calendar className="w-5 h-5" style={{ color: '#243F7B' }} />
                </motion.button>
                
                {isRangeCalendarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 w-full"
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
                            const year = new Date().getFullYear() - 10 + i
                            return (
                              <motion.button
                                key={year}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setRangeSelectedYear(year)
                                  setRangeSelectionStep('month')
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
                            )
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
                                setRangeSelectedMonth(index)
                                setRangeCurrentMonth(index)
                                setRangeCurrentYear(rangeSelectedYear!)
                                setRangeSelectionStep('day')
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
                            const day = index + 1
                            const date = new Date(rangeCurrentYear, rangeCurrentMonth, day)
                            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                            const isSelected = isRangeEndpoint(dateString)
                            const isInRange = isDateInRange(dateString)
                            const isToday = 
                              new Date().getDate() === day &&
                              new Date().getMonth() === rangeCurrentMonth &&
                              new Date().getFullYear() === rangeCurrentYear
                            
                            return (
                              <motion.button
                                key={day}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  const date = new Date(rangeCurrentYear, rangeCurrentMonth, day)
                                  const year = date.getFullYear()
                                  const month = String(date.getMonth() + 1).padStart(2, '0')
                                  const dayStr = String(date.getDate()).padStart(2, '0')
                                  const formattedDate = `${year}-${month}-${dayStr}`
                                  
                                  if (!selectedDateRange.from || (selectedDateRange.from && selectedDateRange.to)) {
                                    setSelectedDateRange({ from: formattedDate, to: '' })
                                    setRangeTempSelection(formattedDate)
                                    setRangeSelectionStep('year') // Reset for "to" date selection
                                  } else if (selectedDateRange.from && !selectedDateRange.to) {
                                    const fromDate = new Date(selectedDateRange.from + 'T12:00:00')
                                    const toDate = new Date(formattedDate + 'T12:00:00')
                                    
                                    if (toDate >= fromDate) {
                                      setSelectedDateRange({ from: selectedDateRange.from, to: formattedDate })
                                      setRangeTempSelection(null)
                                      setIsRangeCalendarOpen(false)
                                      setRangeSelectionStep('year')
                                    } else {
                                      setSelectedDateRange({ from: formattedDate, to: selectedDateRange.from })
                                      setRangeTempSelection(null)
                                      setIsRangeCalendarOpen(false)
                                      setRangeSelectionStep('year')
                                    }
                                  }
                                }}
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
                            )
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
                          setSelectedDateRange({ from: '', to: '' })
                          setRangeTempSelection(null)
                          setRangeSelectionStep('year')
                          setRangeSelectedYear(null)
                          setRangeSelectedMonth(null)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150"
                      >
                        Clear
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const today = new Date()
                          setRangeCurrentMonth(today.getMonth())
                          setRangeCurrentYear(today.getFullYear())
                          setRangeSelectionStep('year')
                          setRangeSelectedYear(null)
                          setRangeSelectedMonth(null)
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
            </div>
          </div>
        </motion.section>

        {/* Data Table */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Data Table
          </h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                Client Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your clients and business registrations
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'company', label: 'Company' },
                      { key: 'status', label: 'Status' },
                      { key: 'date', label: 'Date' },
                      { key: 'actions', label: 'Actions' }
                    ].map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-4 text-left text-sm font-semibold border-b border-gray-200 ${
                          column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-150' : ''
                        }`}
                        style={{ color: '#243F7B' }}
                        onClick={() => column.key !== 'actions' && handleSort(column.key)}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{column.label}</span>
                          {column.key !== 'actions' && (
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 ${
                                  sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                                    ? 'text-blue-600' 
                                    : 'text-gray-400'
                                }`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${
                                  sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                                    ? 'text-blue-600' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTableData.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" 
                               style={{ backgroundColor: '#243F7B' }}>
                            {row.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.email}</td>
                      <td className="px-6 py-4 text-gray-900">{row.company}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          row.status === 'Active' 
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'Pending'
                            ? 'text-white'
                            : 'bg-red-100 text-red-800'
                        }`}
                        style={row.status === 'Pending' ? { backgroundColor: '#D2BC99' } : {}}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                            title="View"
                          >
                            <Eye className="w-4 h-4" style={{ color: '#243F7B' }} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" style={{ color: '#D2BC99' }} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors duration-150"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Showing 1 to 5 of 5 entries
                </span>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150"
                    style={{ color: '#243F7B' }}
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors duration-150"
                    style={{ backgroundColor: '#243F7B' }}
                  >
                    1
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150"
                    style={{ color: '#243F7B' }}
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Activity Feed */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Activity Feed
          </h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                Recent Activity
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Latest system activities and user actions
              </p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {activityData.map((activity, index) => {
                const IconComponent = activity.icon
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.type === 'login' ? 'bg-green-100' :
                        activity.type === 'logout' ? 'bg-red-100' :
                        activity.type === 'user' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-4 h-4 ${
                          activity.type === 'login' ? 'text-green-600' :
                          activity.type === 'logout' ? 'text-red-600' :
                          activity.type === 'user' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <span className="text-xs font-medium px-2 py-1 rounded-full" 
                                style={{ 
                                  backgroundColor: '#f3f4f6', 
                                  color: '#243F7B' 
                                }}>
                            {activity.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Activity Feed Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-center text-sm font-medium py-2 rounded-lg transition-colors duration-150"
                style={{ color: '#243F7B' }}
              >
                View All Activities
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Increment Components */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Increment Components
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Increment */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Basic Increment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-[42px] rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-semibold"
                      style={{ borderColor: '#243F7B', color: '#243F7B' }}
                    >
                      -
                    </motion.button>
                    <input
                      type="number"
                      value="1"
                      readOnly
                      className="w-20 h-[42px] px-3 py-2 rounded-lg border-2 border-gray-200 text-center focus:outline-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-[42px] rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-semibold"
                      style={{ borderColor: '#243F7B', color: '#243F7B' }}
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Styled Increment */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Styled Increment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Amount
                  </label>
                  <div className="flex items-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-[42px] px-4 rounded-l-lg font-semibold text-white transition-all duration-200"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      -
                    </motion.button>
                    <input
                      type="number"
                      value="5"
                      readOnly
                      className="w-20 h-[42px] px-3 py-2 border-t-2 border-b-2 text-center focus:outline-none"
                      style={{ borderColor: '#243F7B' }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-[42px] px-4 rounded-r-lg font-semibold text-white transition-all duration-200"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rounded Increment */}
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                Rounded Increment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Items
                  </label>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      -
                    </motion.button>
                    <div className="w-16 text-center">
                      <span className="text-2xl font-bold" style={{ color: '#243F7B' }}>3</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Increment Examples */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-6" style={{ color: '#243F7B' }}>
              Advanced Increment Components
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Large Increment with Label */}
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h4 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                  Investment Amount (AED)
                </h4>
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-lg font-bold text-xl transition-all duration-200 flex items-center justify-center"
                    style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                  >
                    -
                  </motion.button>
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      value="100,000"
                      readOnly
                      className="w-32 h-12 px-4 text-center text-xl font-bold rounded-lg border-2 focus:outline-none"
                      style={{ borderColor: '#243F7B', color: '#243F7B' }}
                    />
                    <span className="text-xs text-gray-500 mt-1">Minimum: 50,000</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-lg font-bold text-xl transition-all duration-200 flex items-center justify-center"
                    style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                  >
                    +
                  </motion.button>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1 text-xs rounded-md transition-all duration-200"
                    style={{ backgroundColor: '#f3f4f6', color: '#243F7B' }}
                  >
                    +10K
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1 text-xs rounded-md transition-all duration-200"
                    style={{ backgroundColor: '#f3f4f6', color: '#243F7B' }}
                  >
                    +50K
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 py-1 text-xs rounded-md transition-all duration-200"
                    style={{ backgroundColor: '#f3f4f6', color: '#243F7B' }}
                  >
                    +100K
                  </motion.button>
                </div>
              </div>

              {/* Multi-Value Increment */}
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h4 className="text-lg font-medium mb-4" style={{ color: '#243F7B' }}>
                  Family Members
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Adults</span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-md font-medium transition-all duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f1f5f9', color: '#243F7B' }}
                      >
                        -
                      </motion.button>
                      <span className="w-8 text-center font-semibold" style={{ color: '#243F7B' }}>2</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-md font-medium transition-all duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f1f5f9', color: '#243F7B' }}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Children</span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-md font-medium transition-all duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f1f5f9', color: '#243F7B' }}
                      >
                        -
                      </motion.button>
                      <span className="w-8 text-center font-semibold" style={{ color: '#243F7B' }}>1</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-md font-medium transition-all duration-200 flex items-center justify-center"
                        style={{ backgroundColor: '#f1f5f9', color: '#243F7B' }}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium" style={{ color: '#243F7B' }}>Total Family Size: 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Interactive Demo */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Interactive Demo Form
          </h2>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-6" style={{ color: '#243F7B' }}>
              Sample Contact Form
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                  Full Name
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                  Email Address
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                Message
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 resize-none"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            <div className="mt-6 flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#243F7B' }}
              >
                Send Message
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
              >
                Clear Form
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-center py-8 border-t border-gray-200"
        >
          <p className="text-gray-600">
            TME Design System v1.0 - Built with React, Tailwind CSS, and Framer Motion
          </p>
        </motion.footer>
      </div>
    </div>
  )
}