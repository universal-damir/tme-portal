"use client"

import * as React from "react"
import { Eye, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PDFActionButtonsProps {
  onPreview: () => void
  onDownload: () => void
  disabled?: boolean
  isGenerating?: boolean
  previewLabel?: string
  downloadLabel?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
  className?: string
}

const sizeClasses = {
  sm: {
    button: "px-4 py-3 rounded-xl text-sm",
    icon: "h-4 w-4",
    loader: "h-4 w-4"
  },
  md: {
    button: "px-6 py-3 rounded-xl text-base",
    icon: "h-5 w-5", 
    loader: "h-5 w-5"
  },
  lg: {
    button: "px-8 py-4 rounded-2xl text-lg font-semibold",
    icon: "h-6 w-6",
    loader: "h-6 w-6"
  }
}

export const PDFActionButtons: React.FC<PDFActionButtonsProps> = ({
  onPreview,
  onDownload,
  disabled = false,
  isGenerating = false,
  previewLabel = "Preview PDF",
  downloadLabel = "Download PDF",
  size = 'lg',
  variant = 'default',
  className
}) => {
  const isDisabled = disabled || isGenerating
  const sizes = sizeClasses[size]

  const buttonBaseClass = cn(
    "text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    "inline-flex items-center space-x-3 justify-center",
    sizes.button
  )

  if (variant === 'compact') {
    return (
      <div className={cn("flex gap-3 justify-center items-center max-w-4xl mx-auto", className)}>
        <button
          type="button"
          onClick={onPreview}
          disabled={isDisabled}
          className={cn(
            buttonBaseClass,
            "flex-1 bg-gradient-to-r from-purple-600 to-pink-600",
            "space-x-2"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className={cn("animate-spin", sizes.loader)} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Eye className={sizes.icon} />
              <span>{previewLabel}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDisabled}
          className={cn(
            buttonBaseClass,
            "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600",
            "space-x-2"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className={cn("animate-spin", sizes.loader)} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className={sizes.icon} />
              <span>{downloadLabel}</span>
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={cn("text-center", className)}>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          type="button"
          onClick={onPreview}
          disabled={isDisabled}
          className={cn(
            buttonBaseClass,
            "bg-gradient-to-r from-purple-600 to-pink-600"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className={cn("animate-spin", sizes.loader)} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Eye className={sizes.icon} />
              <span>{previewLabel}</span>
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={onDownload}
          disabled={isDisabled}
          className={cn(
            buttonBaseClass,
            "bg-gradient-to-r from-blue-600 to-indigo-600"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className={cn("animate-spin", sizes.loader)} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className={sizes.icon} />
              <span>{downloadLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}