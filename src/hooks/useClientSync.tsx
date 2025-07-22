"use client"

import { useRef, useEffect } from 'react'
import { UseFormSetValue } from 'react-hook-form'
import { useSharedClient } from '@/contexts/SharedClientContext'

export interface UseClientSyncProps {
  watchedData: { 
    firstName?: string
    lastName?: string
    companyName?: string
    shortCompanyName?: string
    date?: string
  }
  setValue: UseFormSetValue<any>
  debounceMs?: number
}

export const useClientSync = ({ 
  watchedData, 
  setValue,
  debounceMs = 100
}: UseClientSyncProps) => {
  const { clientInfo, updateClientInfo } = useSharedClient()
  const initializedRef = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Initialize form with client context data
  useEffect(() => {
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName || clientInfo.companyName)) {
      setValue('firstName', clientInfo.firstName || '')
      setValue('lastName', clientInfo.lastName || '')
      setValue('companyName', clientInfo.companyName || '')
      setValue('shortCompanyName', clientInfo.shortCompanyName || '')
      setValue('date', clientInfo.date || new Date().toISOString().split('T')[0])
      initializedRef.current = true
    }
  }, [clientInfo, setValue])

  // Debounced update to client context
  useEffect(() => {
    const { firstName, lastName, companyName, shortCompanyName, date } = watchedData
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // Debounce the update to prevent rapid fire updates
    updateTimeoutRef.current = setTimeout(() => {
      updateClientInfo({
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
        shortCompanyName: shortCompanyName || '',
        date: date || new Date().toISOString().split('T')[0],
      })
    }, debounceMs)
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [
    watchedData.firstName, 
    watchedData.lastName, 
    watchedData.companyName,
    watchedData.shortCompanyName,
    watchedData.date,
    updateClientInfo,
    debounceMs
  ])
}