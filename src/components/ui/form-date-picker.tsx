"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { UseFormRegister, FieldPath, FieldValues } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  placeholder = "Pick a date",
  disabled = false,
  required = false,
  className,
  dateFormat = "dd.MM.yyyy",
  error,
  captionLayout = "label",
}: FormDatePickerProps<T>) {
  const [open, setOpen] = React.useState(false)
  
  // Convert ISO string to Date object for display
  const selectedDate = value ? new Date(value) : undefined
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      onChange?.(localDateString)
    } else {
      onChange?.('')
    }
    setOpen(false)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      
      {/* Hidden input for form registration */}
      <input
        type="hidden"
        {...register(name)}
        value={value || ''}
      />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal px-4 py-3 h-auto border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-900",
              !selectedDate && "text-gray-500",
              error && "border-red-300 focus:ring-red-500"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {selectedDate ? (
              format(selectedDate, dateFormat)
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            showOutsideDays={true}
            initialFocus
            className="rounded-md border shadow-sm"
            captionLayout={captionLayout}
          />
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
} 