'use client'

import { useState, useEffect, useCallback } from 'react'
import { FALLBACK_MENU_CONFIG } from '@/lib/menu-fallback'

export interface MenuItemConfig {
    id: string
    slug: string
    name: string
    icon: string
    href: string
    section: string | null
    priority: number
    isBuiltin: boolean
    sourcePluginId: string | null
    requiredRoles: string[]
    isVisible: boolean
}

export interface MenuGroupConfig {
    id: string
    slug: string
    name: string
    icon: string
    priority: number
    items: MenuItemConfig[]
}

export interface MenuConfig {
    groups: MenuGroupConfig[]
}

export interface UseMenuConfigResult {
    menuConfig: MenuConfig | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

/**
 * Hook to fetch menu configuration from the database
 */
export function useMenuConfig(): UseMenuConfigResult {
    const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMenuConfig = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/admin/menu', { cache: 'no-store' })
            if (!response.ok) {
                throw new Error(`Failed to fetch menu config: ${response.status}`)
            }

            const data = await response.json()
            const groups = Array.isArray(data.menuConfig) ? data.menuConfig : []
            setMenuConfig(groups.length > 0 ? { groups } : FALLBACK_MENU_CONFIG)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load menu configuration'
            setError(message)
            console.error('Error fetching menu config:', err)
            setMenuConfig(FALLBACK_MENU_CONFIG)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMenuConfig()
    }, [fetchMenuConfig])

    return {
        menuConfig,
        loading,
        error,
        refetch: fetchMenuConfig,
    }
}
