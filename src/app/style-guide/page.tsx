'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronDown, Check } from 'lucide-react'

export default function StyleGuidePage() {
  const [selectedDropdown, setSelectedDropdown] = useState('')
  const [selectedRadio, setSelectedRadio] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleCheckboxChange = (value: string) => {
    setCheckedItems(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
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
          <div className="grid grid-cols-2 gap-6">
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
                    style={{ focusBorderColor: '#243F7B' }}
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
                      style={{ focusBorderColor: '#243F7B' }}
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

        {/* Radio Buttons and Checkboxes */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                          selectedRadio === option 
                            ? 'border-4' 
                            : 'border-2 border-gray-300'
                        }`}
                        style={{ 
                          borderColor: selectedRadio === option ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {selectedRadio === option && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-full h-full rounded-full"
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
          </div>
        </motion.section>

        {/* Date Picker */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#243F7B' }}>
            Date Picker
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
              Select Date
            </label>
            <div className="relative">
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.section>

        {/* Interactive Demo */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
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
          transition={{ duration: 0.5, delay: 0.8 }}
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