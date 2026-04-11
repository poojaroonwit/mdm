import type { Metadata, Viewport } from 'next'
import { DM_Sans, IBM_Plex_Sans_Thai } from 'next/font/google'
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

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans-thai',
})

export const metadata: Metadata = {
  title: 'Unified Data Platform',
  description: 'Comprehensive Unified Data Platform for event organizations',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${ibmPlexSansThai.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-dm-sans), "IBM Plex Sans Thai", sans-serif' }}
        suppressHydrationWarning
      >
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
