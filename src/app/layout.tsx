import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { SpaceProvider } from '@/contexts/space-context'
import { DynamicFavicon } from '@/components/ui/dynamic-favicon'
import { Suspense } from 'react'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { GlobalErrorHandler } from '@/components/global-error-handler'
import { SecurityProvider } from '@/components/providers/SecurityProvider'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'

export const metadata: Metadata = {
  title: 'Unified Data Platform',
  description: 'Comprehensive unified data platform for event organizations',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <GlobalErrorHandler />
        <Providers>
          <DynamicFavicon />
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
        </Providers>
      </body>
    </html>
  )
}
