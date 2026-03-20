"use client"

// Polyfill for crypto.randomUUID in non-secure contexts (HTTP)
// crypto.randomUUID() only works in secure contexts (HTTPS or localhost)
if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function (): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { useThemeSafe } from "@/hooks/use-theme-safe"
import { Toaster } from "react-hot-toast"
import { NotificationProvider } from "@/contexts/notification-context"
import { QueryProvider } from "@/lib/providers/query-provider"
import { ThemeProvider } from "@/contexts/theme-context"
import { SessionTimeoutWatcher } from "@/components/providers/SessionTimeoutWatcher"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"


function ThemedToaster() {
  const { isDark, mounted } = useThemeSafe()

  if (!mounted) {
    return (
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    )
  }

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#fff' : '#000',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#1f2937' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#1f2937' : '#ffffff',
          },
        },
      }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Chat pages (/chat/*) manage their own theming. Force light mode so that
  // next-themes' blocking script does NOT inject class="dark" or
  // style="color-scheme: dark;" into the iframe's <html> element.
  const isChatRoute = pathname?.startsWith('/chat/')

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={!isChatRoute}
        forcedTheme={isChatRoute ? "light" : undefined}
        disableTransitionOnChange
        enableColorScheme={false}
      >
        <ThemeProvider>
          <QueryProvider>
            <NotificationProvider>
              <SessionTimeoutWatcher />
              {children}
              <ThemedToaster />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </NextThemeProvider>
    </SessionProvider>
  )
}
