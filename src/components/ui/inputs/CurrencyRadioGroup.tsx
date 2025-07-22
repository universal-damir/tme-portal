"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CurrencyRadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  label?: string
  required?: boolean
  error?: string
  className?: string
  currencies?: Array<{ value: string; label: string; symbol: string }>
}

const defaultCurrencies = [
  { value: 'AED', label: 'AED', symbol: 'د.إ' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' }
]

const CurrencyRadioGroup = React.forwardRef<HTMLInputElement, CurrencyRadioGroupProps>(
  ({ 
    value, 
    onValueChange, 
    name, 
    label, 
    required, 
    error, 
    className,
    currencies = defaultCurrencies,
    ...props 
  }, ref) => {
    const groupName = name || `currency-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={cn("space-y-3", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="flex flex-wrap gap-3">
          {currencies.map((currency) => (
            <label
              key={currency.value}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200",
                "hover:bg-gray-50",
                value === currency.value 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-gray-300 bg-white text-gray-700",
                error && "border-red-500"
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={currency.value}
                checked={value === currency.value}
                onChange={(e) => onValueChange?.(e.target.value)}
                className="sr-only"
                ref={currency.value === value ? ref : undefined}
                {...props}
              />
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                value === currency.value 
                  ? "border-blue-500" 
                  : "border-gray-300"
              )}>
                {value === currency.value && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="font-medium">
                {currency.symbol} {currency.label}
              </span>
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

CurrencyRadioGroup.displayName = "CurrencyRadioGroup"

export { CurrencyRadioGroup }