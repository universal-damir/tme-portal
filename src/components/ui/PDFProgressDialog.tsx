"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface PDFProgressDialogProps {
  isVisible: boolean
  step: string
  progress: number
  title?: string
  color?: 'blue' | 'yellow' | 'green' | 'purple'
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    dots: 'bg-blue-500',
    progress: 'text-blue-600'
  },
  yellow: {
    bg: 'bg-yellow-100', 
    text: 'text-yellow-600',
    dots: 'bg-yellow-500',
    progress: 'text-yellow-600'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600', 
    dots: 'bg-green-500',
    progress: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    dots: 'bg-purple-500', 
    progress: 'text-purple-600'
  }
}

export const PDFProgressDialog: React.FC<PDFProgressDialogProps> = ({
  isVisible,
  step,
  progress,
  title = "Generating PDF Document",
  color = 'blue'
}) => {
  if (!isVisible) return null

  const colors = colorVariants[color]

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      
      {/* Progress dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 min-w-[400px] max-w-md">
        <div className="text-center space-y-6">
          {/* Header with icon */}
          <div className="flex flex-col items-center space-y-3">
            <div className={cn("rounded-full p-3", colors.bg)}>
              <svg className={cn("w-8 h-8", colors.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {title}
            </div>
          </div>
          
          {/* Current step */}
          <div className="text-sm text-gray-600 font-medium">
            {step}
          </div>
          
          {/* Progress bar with enhanced styling */}
          <div className="space-y-3">
            <Progress 
              value={progress} 
              className="w-full h-3 bg-gray-100" 
            />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Progress</span>
              <span className={cn("font-semibold", colors.progress)}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.dots)} style={{ animationDelay: '0ms' }}></div>
            <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.dots)} style={{ animationDelay: '150ms' }}></div>
            <div className={cn("w-2 h-2 rounded-full animate-bounce", colors.dots)} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </>
  )
}