"use client"

import { useState } from 'react'
import { toast } from 'sonner'

export interface PDFProgress {
  step: string
  progress: number
  isVisible: boolean
}

export interface UsePDFGenerationProps<T> {
  generatePDF: (data: T) => Promise<Blob>
  generatePDFWithFilename?: (data: T) => Promise<{ blob: Blob; filename: string }>
  generateFamilyPDF?: (data: T) => Promise<Blob>
  validateData: (data: T) => { isValid: boolean; errors: string[] }
  progressColor?: 'blue' | 'yellow' | 'green' | 'purple'
  // Optional props for activity logging
  activityLogging?: {
    resource: string // e.g., 'golden_visa', 'cost_overview'
    client_name: string // e.g., 'Novalic Damir' or 'Company Name'
    document_type: string // e.g., 'Golden Visa', 'Cost Overview'
  }
}

export interface UsePDFGenerationReturn {
  isGenerating: boolean
  pdfProgress: PDFProgress
  generatePDFDocument: (data: any, options?: { 
    download?: boolean
    preview?: boolean 
    generateFamily?: boolean
  }) => Promise<void>
}

export const usePDFGeneration = <T,>({ 
  generatePDF,
  generatePDFWithFilename,
  generateFamilyPDF,
  validateData,
  progressColor = 'blue',
  activityLogging
}: UsePDFGenerationProps<T>): UsePDFGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfProgress, setPdfProgress] = useState<PDFProgress>({
    step: '',
    progress: 0,
    isVisible: false
  })

  const updateProgress = (step: string, progress: number) => {
    setPdfProgress({ step, progress, isVisible: true })
  }

  const generatePDFDocument = async (
    data: T, 
    options: { 
      download?: boolean
      preview?: boolean 
      generateFamily?: boolean
    } = { download: true, preview: false }
  ): Promise<void> => {
    // Validate data first
    const validation = validateData(data)
    if (!validation.isValid) {
      toast.error('Validation Failed', {
        description: validation.errors.join(', ')
      })
      return
    }

    setIsGenerating(true)
    updateProgress('Preparing document...', 10)

    const loadingToast = toast.loading('Generating PDF...', {
      description: 'This may take a few moments for complex documents.',
    })

    try {
      let blob: Blob
      let filename = 'document.pdf'

      if (options.generateFamily && generateFamilyPDF) {
        updateProgress('Generating family document...', 30)
        blob = await generateFamilyPDF(data)
        filename = 'family-document.pdf'
      } else if (generatePDFWithFilename) {
        updateProgress('Generating document with metadata...', 30)
        const result = await generatePDFWithFilename(data)
        blob = result.blob
        filename = result.filename
      } else {
        updateProgress('Generating document...', 30)
        blob = await generatePDF(data)
      }

      updateProgress('Finalizing document...', 80)

      if (options.preview) {
        // Create blob URL for preview
        const url = URL.createObjectURL(blob)
        updateProgress('Opening preview...', 95)
        
        // Open in new tab for preview
        const previewWindow = window.open(url, '_blank')
        if (!previewWindow) {
          throw new Error('Preview window blocked. Please allow pop-ups for this site.')
        }
        
        // Clean up blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        // Download the file
        updateProgress('Downloading...', 95)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Log PDF download activity if logging data is provided
        if (activityLogging) {
          try {
            await fetch('/api/user/activities', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'pdf_downloaded',
                resource: activityLogging.resource,
                details: {
                  filename: filename,
                  client_name: activityLogging.client_name,
                  document_type: activityLogging.document_type
                }
              })
            });
          } catch (error) {
            console.error('Failed to log PDF download activity:', error);
          }
        }
      }

      updateProgress('Complete!', 100)
      
      toast.dismiss(loadingToast)
      toast.success(options.preview ? 'Preview Generated' : 'PDF Generated Successfully', {
        description: options.preview ? 'Document opened in new tab' : `${filename} has been downloaded`,
        action: options.preview ? undefined : {
          label: 'Generate Again',
          onClick: () => generatePDFDocument(data, options)
        }
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.dismiss(loadingToast)
      toast.error(options.preview ? 'Preview Generation Failed' : 'PDF Generation Failed', {
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        action: {
          label: 'Retry',
          onClick: () => generatePDFDocument(data, options)
        }
      })
    } finally {
      setIsGenerating(false)
      setPdfProgress({ step: '', progress: 0, isVisible: false })
    }
  }

  return {
    isGenerating,
    pdfProgress,
    generatePDFDocument
  }
}