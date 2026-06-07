'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FALLBACK_MENU_CONFIG } from '@/lib/menu-fallback'

export interface MenuItemConfig {
    id: string
    slug: string
    name: string
    description?: string
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

const REQUIRED_ITEMS: Array<{ groupSlug: string; item: MenuItemConfig }> = [
    {
        groupSlug: 'tools',
        item: {
            id: 'project-management',
            slug: 'project-management',
            name: 'Project Management',
            icon: 'Kanban',
            href: '/tools/projects',
            section: 'Workspace',
            priority: 5,
            isBuiltin: true,
            sourcePluginId: null,
            requiredRoles: ['USER'],
            isVisible: true,
        },
    },
]

function ensureRequiredMenuItems(config: MenuConfig): MenuConfig {
    const groups = [...config.groups]

    for (const requirement of REQUIRED_ITEMS) {
        const groupIndex = groups.findIndex((group) => group.slug === requirement.groupSlug)
        if (groupIndex === -1) continue

        const group = groups[groupIndex]
        const exists = group.items.some(
            (item) => item.href === requirement.item.href || item.slug === requirement.item.slug
        )

        if (exists) continue

        groups[groupIndex] = {
            ...group,
            items: [...group.items, requirement.item].sort((a, b) => a.priority - b.priority),
        }
    }

    return { groups }
}

/**
 * Hook to fetch menu configuration from the database
 */
export function useMenuConfig(): UseMenuConfigResult {
    const { status } = useSession()
    const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMenuConfig = useCallback(async () => {
        if (status !== 'authenticated') {
            setMenuConfig(ensureRequiredMenuItems(FALLBACK_MENU_CONFIG))
            setError(status === 'unauthenticated' ? 'Authentication required. Please sign in.' : null)
            setLoading(status === 'loading')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/admin/menu', { cache: 'no-store' })
            if (!response.ok) {
                throw new Error(`Failed to fetch menu config: ${response.status}`)
            }

            const data = await response.json()
            const groups = Array.isArray(data.menuConfig) ? data.menuConfig : []
            const nextConfig = groups.length > 0 ? { groups } : FALLBACK_MENU_CONFIG
            setMenuConfig(ensureRequiredMenuItems(nextConfig))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load menu configuration'
            setError(message)
            console.error('Error fetching menu config:', err)
            setMenuConfig(ensureRequiredMenuItems(FALLBACK_MENU_CONFIG))
        } finally {
            setLoading(false)
        }
    }, [status])

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
