import React from 'react'
import '../globals.css'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SpaceProvider } from '@/contexts/space-context'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'
import { SecurityProvider } from '@/components/providers/SecurityProvider'
import { Suspense } from 'react'
import { LoadingPage } from '@/components/ui/loading-spinner'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SecurityProvider>
      <SidebarProvider>
        <Suspense fallback={<LoadingPage />}>
          <SystemSettingsProvider>
            <SpaceProvider>
              {children}
            </SpaceProvider>
          </SystemSettingsProvider>
        </Suspense>
      </SidebarProvider>
    </SecurityProvider>
  )
}
