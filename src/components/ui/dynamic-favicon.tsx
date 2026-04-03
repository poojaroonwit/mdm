'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  const { data: session, status } = useSession()
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null)

  useEffect(() => {
    if (faviconUrl) {
      setCurrentFavicon(faviconUrl)
    } else {
      // Load favicon from settings
      const loadFavicon = async () => {
        // Skip if session is still loading
        if (status === 'loading') {
          return
        }

        try {
          const response = await fetch('/api/settings')
          if (!response.ok) return

          // Check if response is JSON
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            return
          }
          
          const settings = await response.json()
          
          if (settings.faviconUrl) {
            setCurrentFavicon(settings.faviconUrl)
          }
        } catch (error) {
          // Silently fail for dynamic favicon
        }
      }
      loadFavicon()
    }
  }, [faviconUrl, status, session?.user?.id])

  useEffect(() => {
    // Remove existing favicon links and preload links for favicons
    const existingLinks = document.querySelectorAll('link[rel*="icon"]')
    existingLinks.forEach(link => link.remove())
    
    // Also remove any preload links for favicons (check both as="image" and without as attribute)
    const allPreloadLinks = document.querySelectorAll('link[rel="preload"]')
    allPreloadLinks.forEach(link => {
      const href = link.getAttribute('href')
      const as = link.getAttribute('as')
      if (href && (
        href.includes('favicon') || 
        href.endsWith('.ico') || 
        (href.endsWith('.svg') && (as === 'image' || !as))
      )) {
        link.remove()
      }
    })

    if (currentFavicon) {
      // Create new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = currentFavicon
      link.type = currentFavicon.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'
      
      document.head.appendChild(link)

      // Also add apple-touch-icon for better mobile support
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = currentFavicon
      document.head.appendChild(appleLink)
    } else {
      // Set default favicon if none is configured
      const defaultLink = document.createElement('link')
      defaultLink.rel = 'icon'
      defaultLink.href = '/favicon.svg'
      defaultLink.type = 'image/svg+xml'
      document.head.appendChild(defaultLink)
    }
  }, [currentFavicon])

  return null // This component doesn't render anything
}
