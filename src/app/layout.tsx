import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SidebarProvider } from '@/contexts/sidebar-context'

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
