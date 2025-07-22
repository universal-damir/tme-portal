"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CompanyTypeSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  label?: string
  required?: boolean
  error?: string
  className?: string
}

const companyTypes = [
  { 
    value: 'TME FZCO', 
    label: 'TME FZCO',
    description: 'TME Free Zone Company' 
  },
  { 
    value: 'Management Consultants', 
    label: 'Management Consultants',
    description: 'Management Consulting Services'
  }
]

const CompanyTypeSelector = React.forwardRef<HTMLInputElement, CompanyTypeSelectorProps>(
  ({ 
    value, 
    onValueChange, 
    name, 
    label = "Company Type", 
    required, 
    error, 
    className,
    ...props 
  }, ref) => {
    const groupName = name || `company-type-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={cn("space-y-3", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyTypes.map((type) => (
            <label
              key={type.value}
              className={cn(
                "flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200",
                "hover:bg-gray-50 hover:border-gray-400",
                value === type.value 
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
                  : "border-gray-300 bg-white",
                error && "border-red-500"
              )}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name={groupName}
                  value={type.value}
                  checked={value === type.value}
                  onChange={(e) => onValueChange?.(e.target.value)}
                  className="sr-only"
                  ref={type.value === value ? ref : undefined}
                  {...props}
                />
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                  value === type.value 
                    ? "border-blue-500" 
                    : "border-gray-300"
                )}>
                  {value === type.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "font-semibold text-sm",
                    value === type.value 
                      ? "text-blue-900" 
                      : "text-gray-900"
                  )}>
                    {type.label}
                  </div>
                  <div className={cn(
                    "text-xs mt-1",
                    value === type.value 
                      ? "text-blue-700" 
                      : "text-gray-600"
                  )}>
                    {type.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
    )
  }
)

CompanyTypeSelector.displayName = "CompanyTypeSelector"

export { CompanyTypeSelector }