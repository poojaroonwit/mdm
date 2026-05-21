import type { BrandingConfig } from '@/types/branding'
import { defaultBrandingConfig } from '@/config/branding'

/**
 * Load branding configuration
 * 
 * Works both client-side and server-side:
 * - Client-side: Fetches from /api/admin/branding
 * - Server-side: Fetches directly from database
 * 
 * @returns Promise<BrandingConfig> - The branding configuration (returns default if failed)
 */
export async function loadBrandingConfig(): Promise<BrandingConfig> {
  try {
    // Check if we're on the server side
    if (typeof window === 'undefined') {
      // Server-side: fetch from database directly
      const { prisma } = await import('@/lib/db')
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'branding' }
      })

      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value)
          // Merge with defaults to ensure all required fields are present
          return { ...defaultBrandingConfig, ...parsed }
        } catch (e) {
          console.error('Failed to parse branding config:', e)
          return defaultBrandingConfig
        }
      }

      return defaultBrandingConfig
    } else {
      // Client-side: fetch from API
      const response = await fetch('/api/admin/branding', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch branding config:', response.statusText)
        return defaultBrandingConfig
      }

      const branding = await response.json()
      // Merge with defaults to ensure all required fields are present
      return { ...defaultBrandingConfig, ...branding }
    }
  } catch (error) {
    console.error('Error loading branding config:', error)
    return defaultBrandingConfig
  }
}
