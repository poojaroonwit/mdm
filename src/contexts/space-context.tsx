'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface Space {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_by: string
  created_by_name?: string
  member_count?: number
  user_role?: string
  slug?: string
  features?: {
    assignments?: boolean
    bulk_activity?: boolean
    workflows?: boolean
    dashboard?: boolean
  }
  enable_assignments?: boolean
  enable_bulk_activity?: boolean
  enable_workflows?: boolean
  enable_dashboard?: boolean
  sidebar_config?: {
    style?: {
      backgroundType?: 'color' | 'image' | 'gradient'
      backgroundColor?: string
      backgroundImage?: string | null
      gradient?: { from?: string; to?: string; angle?: number }
      fontColor?: string
      size?: 'small' | 'medium' | 'large'
    }
    menu?: Array<{
      title: string
      href?: string
      icon?: string
      children?: Array<{ title: string; href: string; icon?: string }>
    }>
  }
}

interface SpaceContextType {
  currentSpace: Space | null
  spaces: Space[]
  setCurrentSpace: (space: Space | null) => void
  refreshSpaces: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined)

const defaultSidebarStyle = {
  backgroundType: 'color' as const,
  backgroundColor: '#ffffff',
  backgroundImage: null,
  gradient: { from: '#ffffff', to: '#f3f4f6', angle: 180 },
  fontColor: '#374151',
  size: 'medium' as const,
}

function normalizeSidebarConfig(sidebarConfig: Space['sidebar_config'] | undefined) {
  const style = sidebarConfig?.style

  if (!style) {
    return {
      style: defaultSidebarStyle,
      menu: sidebarConfig?.menu || []
    }
  }

  const isLegacyDefault =
    style.backgroundType === 'color' &&
    style.backgroundColor === '#0f172a' &&
    style.fontColor === '#ffffff'

  const isLegacyGradientDefault =
    style.backgroundType === 'gradient' &&
    style.gradient?.from === '#0f172a' &&
    style.gradient?.to === '#1e293b' &&
    style.fontColor === '#ffffff'

  if (isLegacyDefault || isLegacyGradientDefault) {
    return {
      style: {
        ...defaultSidebarStyle,
        backgroundType: style.backgroundType,
      },
      menu: sidebarConfig?.menu || []
    }
  }

  return {
    style: {
      ...defaultSidebarStyle,
      ...style,
      gradient: {
        ...defaultSidebarStyle.gradient,
        ...(style.gradient || {})
      }
    },
    menu: sidebarConfig?.menu || []
  }
}

export function SpaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSpaces = async () => {
    // Don't fetch if user is not authenticated
    if (status === 'unauthenticated' || !session?.user?.id) {
      setIsLoading(false)
      setError('Authentication required. Please sign in.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Small utility to fetch with timeout
      const fetchWithTimeout = async (url: string, options: RequestInit & { timeoutMs?: number } = {}) => {
        const { timeoutMs = 8000, ...rest } = options
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeoutMs)
        try {
          return await fetch(url, { ...rest, signal: controller.signal })
        } finally {
          clearTimeout(id)
        }
      }

      // One retry on AbortError or network error
      const doFetch = async () => {
        try {
          return await fetchWithTimeout('/api/spaces?page=1&limit=50', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            timeoutMs: 8000
          })
        } catch (e: any) {
          // If aborted or failed once, retry once with a longer timeout
          return await fetchWithTimeout('/api/spaces?page=1&limit=50', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            timeoutMs: 12000
          })
        }
      }

      const response = await doFetch()
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please sign in to view spaces.')
        }
        throw new Error('Failed to fetch spaces')
      }

      // Check if response is HTML (likely a redirect to login page)
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Authentication required. Please sign in.')
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        throw new Error('Invalid response format. Please try again.')
      }
      
      // Add default values for missing fields (features, sidebar_config, etc.)
      const spacesWithDefaults = (data.spaces || []).map((space: any) => ({
        ...space,
        features: space.features || { assignments: true, bulk_activity: true, workflows: true, dashboard: true },
        sidebar_config: normalizeSidebarConfig(space.sidebar_config),
        enable_assignments: space.features?.assignments ?? true,
        enable_bulk_activity: space.features?.bulk_activity ?? true,
        enable_workflows: space.features?.workflows ?? true,
        enable_dashboard: space.features?.dashboard ?? true,
      }))
      setSpaces(spacesWithDefaults)
      
      // Try to select via slug from URL if present
      if (spacesWithDefaults && spacesWithDefaults.length > 0) {
        const path = typeof window !== 'undefined' ? window.location.pathname : ''
        const firstSeg = path.split('/').filter(Boolean)[0] || ''
        const bySlug = firstSeg && spacesWithDefaults.find((s: Space) => (s.slug || '').toLowerCase() === firstSeg.toLowerCase())
        if (!currentSpace && bySlug) {
          setCurrentSpace(bySlug)
        } else if (!currentSpace) {
          // Fallback: default space or first
          const defaultSpace = spacesWithDefaults.find((space: Space) => space.is_default)
          setCurrentSpace(defaultSpace || spacesWithDefaults[0])
        }
      }
    } catch (err) {
      console.error('Error fetching spaces:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out while loading spaces. Please retry.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch spaces')
      }
      setSpaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSpaces = async () => {
    await fetchSpaces()
  }

  // Load spaces on mount with delay to prevent blocking initial render
  useEffect(() => {
    // Only fetch if user is authenticated
    if (status === 'authenticated' && session?.user?.id) {
      // Add a small delay to allow the page to render first
      const timer = setTimeout(() => {
        fetchSpaces()
      }, 100)
      
      return () => clearTimeout(timer)
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
      setError('Authentication required. Please sign in.')
    }
  }, [status, session?.user?.id])

  // Save current space to localStorage
  useEffect(() => {
    if (currentSpace) {
      localStorage.setItem('current-space-id', currentSpace.id)
    }
  }, [currentSpace])

  // Load current space from localStorage on mount
  useEffect(() => {
    const savedSpaceId = localStorage.getItem('current-space-id')
    if (savedSpaceId && spaces.length > 0) {
      const savedSpace = spaces.find(space => space.id === savedSpaceId)
      if (savedSpace) {
        setCurrentSpace(savedSpace)
      }
    }
  }, [spaces])

  return (
    <SpaceContext.Provider value={{
      currentSpace,
      spaces,
      setCurrentSpace,
      refreshSpaces,
      isLoading,
      error
    }}>
      {children}
    </SpaceContext.Provider>
  )
}

export function useSpace() {
  const context = useContext(SpaceContext)
  if (context === undefined) {
    throw new Error('useSpace must be used within a SpaceProvider')
  }
  return context
}
