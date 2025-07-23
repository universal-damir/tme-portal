'use client'

import { AuthProvider } from '@/contexts/AuthContext'

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}