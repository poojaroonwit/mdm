/**
 * Safe theme hook that handles hydration properly
 * Use this instead of useTheme directly when you need to check theme state
 * 
 * @example
 * ```tsx
 * const { isDark, theme, systemTheme, setTheme } = useThemeSafe()
 * 
 * if (!mounted) {
 *   return <Loading />
 * }
 * 
 * return <div className={isDark ? 'dark' : 'light'}>Content</div>
 * ```
 */
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { ThemeMode, ThemePreference, ThemeState } from '@/types/theme'

export interface UseThemeSafeResult extends ThemeState {
  theme?: ThemePreference
  systemTheme?: ThemeMode
  setTheme: (theme: ThemePreference) => void
}

export function useThemeSafe(): UseThemeSafeResult {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve the effective theme (handles 'system' mode)
  const resolvedTheme: ThemeMode = mounted
    ? (((theme === 'system' ? systemTheme : theme) as ThemeMode | undefined) ?? 'light')
    : 'light'

  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'

  return {
    theme: theme as ThemePreference | undefined,
    systemTheme: systemTheme as ThemeMode | undefined,
    resolvedTheme,
    isDark,
    isLight,
    setTheme: setTheme as (theme: ThemePreference) => void,
    mounted,
  }
}

