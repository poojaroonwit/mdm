/**
 * Mobile Content Converter
 * 
 * Converts internal page builder data to AEM-like mobile schema format.
 * This enables the data management platform to serve content to mobile apps.
 */

import {
  Component,
  Page,
  MobileApp,
  Navigation,
  NavigationItem,
  ThemeConfig,
  MOBILE_SCHEMA_VERSION,
} from './mobile-content-schema'
import { SpacesEditorConfig, SpacesEditorPage } from './space-studio-manager'
import { convertWidget, type InternalWidget } from './mobile-widget-converter'

/**
 * Partial branding config interface
 * We use a flexible type since the config may have optional fields
 */
export interface PartialBrandingConfig {
  applicationName?: string
  applicationLogo?: string
  primaryColor?: string
  secondaryColor?: string
  warningColor?: string
  dangerColor?: string
  bodyBackgroundColor?: string
  bodyTextColor?: string
  topMenuBackgroundColor?: string
  globalStyling?: {
    fontFamily?: string
    [key: string]: any
  }
  loginBackground?: {
    type?: string
    image?: string
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Generate content hash for cache invalidation
 * Works in both browser and server environments
 */
function generateContentHash(content: any): string {
  const str = JSON.stringify(content)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Convert internal page to mobile schema page
 */
export function convertPage(internalPage: SpacesEditorPage): Page {
  const components: Component[] = []
  
  // Convert page components
  if (internalPage.components && Array.isArray(internalPage.components)) {
    for (const widget of internalPage.components) {
      components.push(convertWidget(widget as InternalWidget))
    }
  }
  
  const page: Page = {
    id: internalPage.id,
    name: internalPage.name,
    title: internalPage.displayName || internalPage.name,
    description: internalPage.description,
    path: internalPage.path || `/${internalPage.name}`,
    icon: internalPage.icon,
    components,
    createdAt: internalPage.createdAt,
    updatedAt: internalPage.updatedAt,
  }
  
  // Add header configuration if available
  if (internalPage.hidden !== true) {
    page.header = {
      visible: true,
      title: internalPage.displayName || internalPage.name,
      showBackButton: true,
    }
  }
  
  // Add permissions if available
  if (internalPage.permissions) {
    page.requiresAuth = true
    if (internalPage.permissions.roles) {
      page.permissions = internalPage.permissions.roles
    }
  }
  
  return page
}

/**
 * Convert sidebar items to navigation items
 */
function convertNavigationItems(items: any[]): NavigationItem[] {
  return items.map(item => {
    const navItem: NavigationItem = {
      id: item.id,
      type: item.type === 'divider' ? 'divider' : item.type === 'group' ? 'group' : 'page',
      label: item.name,
      icon: item.icon,
    }
    
    if (item.pageId) {
      navItem.pageId = item.pageId
    }
    
    if (item.children && item.children.length > 0) {
      navItem.children = convertNavigationItems(item.children)
    }
    
    if (item.color) {
      navItem.badge = {
        text: '',
        color: item.color,
      }
    }
    
    return navItem
  })
}

/**
 * Convert branding config to theme config
 */
function convertTheme(branding: PartialBrandingConfig | undefined, mode: 'light' | 'dark'): ThemeConfig {
  const defaultLight: ThemeConfig = {
    mode: 'light',
    colors: {
      primary: '#1e40af',
      secondary: '#8B5CF6',
      background: '#F5F5F7',
      surface: '#FFFFFF',
      text: '#1D1D1F',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#1e40af',
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      baseFontSize: 16,
      headingScale: 1.25,
    },
    spacing: {
      base: 8,
      scale: 1.5,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      full: 9999,
    },
  }
  
  const defaultDark: ThemeConfig = {
    mode: 'dark',
    colors: {
      primary: '#60A5FA',
      secondary: '#A78BFA',
      background: '#000000',
      surface: '#1C1C1E',
      text: '#F5F5F7',
      textSecondary: '#9CA3AF',
      border: '#3A3A3C',
      error: '#F87171',
      warning: '#FBBF24',
      success: '#34D399',
      info: '#60A5FA',
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      baseFontSize: 16,
      headingScale: 1.25,
    },
    spacing: {
      base: 8,
      scale: 1.5,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      full: 9999,
    },
  }
  
  if (!branding) {
    return mode === 'dark' ? defaultDark : defaultLight
  }
  
  // Build theme from branding config
  const theme: ThemeConfig = mode === 'dark' ? { ...defaultDark } : { ...defaultLight }
  
  theme.colors = {
    ...theme.colors,
    primary: branding.primaryColor || theme.colors.primary,
    secondary: branding.secondaryColor || theme.colors.secondary,
    background: branding.bodyBackgroundColor || theme.colors.background,
    surface: branding.topMenuBackgroundColor || theme.colors.surface,
    text: branding.bodyTextColor || theme.colors.text,
    error: branding.dangerColor || theme.colors.error,
    warning: branding.warningColor || theme.colors.warning,
  }
  
  if (branding.globalStyling?.fontFamily) {
    theme.typography = {
      ...theme.typography!,
      fontFamily: branding.globalStyling.fontFamily,
    }
  }
  
  return theme
}

/**
 * Convert complete spaces editor config to mobile app schema
 */
export function convertToMobileApp(
  config: SpacesEditorConfig,
  branding: PartialBrandingConfig | undefined,
  options: {
    appId: string
    appName: string
    appVersion: string
    baseUrl: string
    organizationId?: string
  }
): MobileApp {
  // Convert all pages
  const pages = config.pages
    .filter(p => p.isActive !== false)
    .map(convertPage)
  
  // Build navigation
  const navigation: Navigation = {
    initialPage: config.postAuthRedirectPageId || (pages[0]?.id || ''),
    drawer: config.sidebarConfig?.items 
      ? convertNavigationItems(config.sidebarConfig.items)
      : [],
  }
  
  // Add login page if configured
  if (config.loginPageConfig) {
    navigation.loginPage = 'login'
  }
  
  // Build bottom tabs from active pages (first 5)
  const tabPages = pages.slice(0, 5)
  if (tabPages.length > 0) {
    navigation.bottomTabs = tabPages.map(p => ({
      id: `tab-${p.id}`,
      type: 'page' as const,
      label: p.title,
      icon: p.icon,
      pageId: p.id,
    }))
  }
  
  // Build themes
  const lightTheme = convertTheme(branding, 'light')
  const darkTheme = convertTheme(branding, 'dark')
  
  const mobileApp: MobileApp = {
    schemaVersion: MOBILE_SCHEMA_VERSION,
    appId: options.appId,
    name: options.appName,
    version: options.appVersion,
    organizationId: options.organizationId,
    spaceId: config.spaceId,
    theme: {
      light: lightTheme,
      dark: darkTheme,
    },
    navigation,
    pages,
    api: {
      baseUrl: options.baseUrl,
      timeout: 30000,
      retryCount: 3,
    },
    auth: {
      type: 'jwt',
      loginEndpoint: '/api/auth/signin',
      refreshEndpoint: '/api/auth/refresh',
      logoutEndpoint: '/api/auth/signout',
      tokenStorage: 'secure',
    },
    features: {
      darkMode: true,
      offlineSupport: false,
      pushNotifications: false,
      analytics: false,
    },
    localization: {
      defaultLocale: 'en',
      supportedLocales: ['en'],
    },
    updatedAt: new Date().toISOString(),
  }
  
  // Generate content hash
  mobileApp.contentHash = generateContentHash(mobileApp)
  
  return mobileApp
}

/**
 * Export options for page builder
 */
export interface ExportResult {
  success: boolean
  data?: MobileApp | Page | Component
  format: 'json' | 'yaml'
  size: number
  error?: string
}

/**
 * Export page or app to mobile schema
 */
export function exportToMobileSchema(
  config: SpacesEditorConfig,
  branding: PartialBrandingConfig | undefined,
  options: {
    format: 'full' | 'page' | 'component'
    pageIds?: string[]
    outputFormat?: 'json' | 'yaml'
    minify?: boolean
    appId: string
    appName: string
    appVersion: string
    baseUrl: string
    organizationId?: string
  }
): ExportResult {
  try {
    let data: MobileApp | Page | Component
    
    if (options.format === 'full') {
      data = convertToMobileApp(config, branding, {
        appId: options.appId,
        appName: options.appName,
        appVersion: options.appVersion,
        baseUrl: options.baseUrl,
        organizationId: options.organizationId,
      })
    } else if (options.format === 'page') {
      const pageIds = options.pageIds || []
      const pages = config.pages.filter(p => pageIds.includes(p.id))
      
      if (pages.length === 0) {
        return {
          success: false,
          format: options.outputFormat || 'json',
          size: 0,
          error: 'No pages found with the specified IDs',
        }
      }
      
      // Return first page for single export, or wrap in container
      if (pages.length === 1) {
        data = convertPage(pages[0])
      } else {
        // Return as mobile app with only selected pages
        const fullApp = convertToMobileApp(config, branding, {
          appId: options.appId,
          appName: options.appName,
          appVersion: options.appVersion,
          baseUrl: options.baseUrl,
          organizationId: options.organizationId,
        })
        fullApp.pages = pages.map(convertPage)
        data = fullApp
      }
    } else {
      // Component export - export all components from all pages as a flat list
      const components: Component[] = []
      for (const page of config.pages) {
        if (page.components) {
          for (const widget of page.components) {
            components.push(convertWidget(widget as InternalWidget))
          }
        }
      }
      
      // Wrap in container component
      data = {
        id: 'export-container',
        type: 'container',
        name: 'Exported Components',
        children: components,
      }
    }
    
    const jsonString = options.minify 
      ? JSON.stringify(data)
      : JSON.stringify(data, null, 2)
    
    return {
      success: true,
      data,
      format: options.outputFormat || 'json',
      size: jsonString.length,
    }
  } catch (error) {
    return {
      success: false,
      format: options.outputFormat || 'json',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error during export',
    }
  }
}
