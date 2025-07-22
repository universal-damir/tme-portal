"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /**
   * The selected date
   */
  value?: Date
  
  /**
   * Handler called when the date changes
   */
  onSelect?: (date: Date | undefined) => void
  
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string
  
  /**
   * Whether the date picker is disabled
   */
  disabled?: boolean
  
  /**
   * Custom class name for the trigger button
   */
  className?: string
  
  /**
   * Date format for display (default: "dd.MM.yyyy")
   */
  dateFormat?: string
  
  /**
   * Whether to show outside days
   */
  showOutsideDays?: boolean
  
  /**
   * Calendar caption layout - use "dropdown" for dropdown navigation
   */
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  
  /**
   * From date for date range restrictions
   */
  fromDate?: Date
  
  /**
   * To date for date range restrictions  
   */
  toDate?: Date
  
  /**
   * From year for dropdown (default: 1900)
   */
  fromYear?: number
  
  /**
   * To year for dropdown (default: current year + 10)
   */
  toYear?: number
}

export function DatePicker({
  value,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  dateFormat = "dd.MM.yyyy",
  showOutsideDays = true,
  captionLayout = "dropdown",
  fromDate,
  toDate,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onSelect?.(date)
            setOpen(false)
          }}
          showOutsideDays={showOutsideDays}
          captionLayout={captionLayout}
          fromDate={fromDate}
          toDate={toDate}
          fromYear={fromYear}
          toYear={toYear}
          initialFocus
          className="rounded-md border shadow-sm"
        />
      </PopoverContent>
    </Popover>
  )
} 