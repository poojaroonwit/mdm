'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'

export interface SystemSettings {
    siteName: string
    logoUrl?: string
    deletePolicyDays: number
    requireEmailVerification: boolean
    requireAdminApproval: boolean
    uiProtectionEnabled: boolean
}

interface SystemSettingsContextType {
    settings: SystemSettings
    isLoading: boolean
    error: string | null
    refreshSettings: () => Promise<void>
    updateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>
}

const defaultSettings: SystemSettings = {
    siteName: 'Unified Data Platform',
    logoUrl: '',
    deletePolicyDays: 30,
    requireEmailVerification: true,
    requireAdminApproval: false,
    uiProtectionEnabled: false
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000
let settingsCache: { settings: SystemSettings; fetchedAt: number } | null = null

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const inFlightFetchRef = useRef<AbortController | null>(null)

    const refreshSettings = useCallback(async (force = false) => {
        if (!force && settingsCache && Date.now() - settingsCache.fetchedAt < SETTINGS_CACHE_TTL_MS) {
            setSettings(settingsCache.settings)
            setIsLoading(false)
            setError(null)
            return
        }

        inFlightFetchRef.current?.abort()
        const controller = new AbortController()
        inFlightFetchRef.current = controller

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/system-settings', {
                signal: controller.signal,
            })
            const data = await response.json()

            if (data.success && data.settings) {
                const nextSettings = { ...defaultSettings, ...data.settings }
                settingsCache = {
                    settings: nextSettings,
                    fetchedAt: Date.now(),
                }
                setSettings(nextSettings)
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return
            }
            console.error('Failed to load system settings:', err)
            setError('Failed to load system settings')
        } finally {
            if (inFlightFetchRef.current === controller) {
                inFlightFetchRef.current = null
                setIsLoading(false)
            }
        }
    }, [])

    const updateSettings = useCallback(async (newSettings: Partial<SystemSettings>): Promise<boolean> => {
        try {
            setError(null)

            const mergedSettings = { ...settings, ...newSettings }

            const response = await fetch('/api/system-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: mergedSettings })
            })

            const data = await response.json()

            if (data.success && data.settings) {
                const nextSettings = { ...defaultSettings, ...data.settings }
                settingsCache = {
                    settings: nextSettings,
                    fetchedAt: Date.now(),
                }
                setSettings(nextSettings)
                return true
            }

            setError(data.error || 'Failed to save settings')
            return false
        } catch (err) {
            console.error('Failed to save system settings:', err)
            setError('Failed to save system settings')
            return false
        }
    }, [settings])

    // Load settings on mount
    useEffect(() => {
        refreshSettings()
    }, [refreshSettings])

    useEffect(() => {
        return () => {
            inFlightFetchRef.current?.abort()
        }
    }, [])

    // Prevent right-click if setting is enabled
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            if (settings.uiProtectionEnabled) {
                e.preventDefault()
                return false
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!settings.uiProtectionEnabled) return

            if (e.key === 'F12') {
                e.preventDefault()
            }

            if (
                e.ctrlKey &&
                (
                    e.key.toLowerCase() === 'u' ||
                    (e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
                )
            ) {
                e.preventDefault()
            }
        }

        window.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [settings.uiProtectionEnabled])

    const contextValue = useMemo<SystemSettingsContextType>(() => ({
        settings,
        isLoading,
        error,
        refreshSettings,
        updateSettings
    }), [error, isLoading, refreshSettings, settings, updateSettings])

    return (
        <SystemSettingsContext.Provider
            value={contextValue}
        >
            {children}
        </SystemSettingsContext.Provider>
    )
}

export function useSystemSettings() {
    const context = useContext(SystemSettingsContext)
    if (context === undefined) {
        throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
    }
    return context
}

// Safe hook that returns defaults if used outside provider
export function useSystemSettingsSafe() {
    const context = useContext(SystemSettingsContext)
    if (context === undefined) {
        return {
            settings: defaultSettings,
            isLoading: false,
            error: null,
            refreshSettings: async () => { },
            updateSettings: async () => false
        }
    }
    return context
}
