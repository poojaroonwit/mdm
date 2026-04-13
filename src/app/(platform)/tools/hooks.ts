'use client'

import { useContext, createContext } from 'react'

// Context to share breadcrumb actions from child pages
const BreadcrumbActionsContext = createContext<{
  setBreadcrumbActions: (actions: React.ReactNode) => void
} | null>(null)

export function useBreadcrumbActions() {
  const context = useContext(BreadcrumbActionsContext)
  if (!context) {
    return { setBreadcrumbActions: () => {} }
  }
  return context
}

export { BreadcrumbActionsContext }

