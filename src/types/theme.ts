export type ThemeMode = 'light' | 'dark'

export type ThemePreference = ThemeMode | 'system'

export interface ThemeState {
  theme?: ThemePreference
  systemTheme?: ThemeMode
  resolvedTheme: ThemeMode
  isDark: boolean
  isLight: boolean
  mounted: boolean
}
