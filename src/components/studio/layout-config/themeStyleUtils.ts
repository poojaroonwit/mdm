'use client'

import type { BrandingConfig } from '@/types/branding'
import { ComponentStyle } from './types'

/**
 * Maps widget component types to theme component styling keys
 */
export function getThemeComponentKey(componentType: string): string | null {
  const mapping: Record<string, string> = {
    'input': 'text-input',
    'select': 'select',
    'button': 'button',
    'card': 'card',
    'table': 'card', // Tables use card styling
    'tabs': 'card', // Tabs use card styling
    'modal': 'card', // Modals use card styling
    'tooltip': 'card', // Tooltips use card styling
  }
  
  return mapping[componentType] || null
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export async function getThemeComponentStyle(componentType: string): Promise<ComponentStyle | undefined> {
  try {
    let brandingConfig: BrandingConfig | null = null
    const response = await fetch('/api/admin/branding')
    if (response.ok) {
      const data = await response.json()
      brandingConfig = data.branding as BrandingConfig
    }
    
    if (!brandingConfig) return undefined

    const componentKey = getThemeComponentKey(componentType)
    
    if (!componentKey || !brandingConfig.componentStyling) return undefined
    
    const themeComponentStyle = brandingConfig.componentStyling[componentKey]
    if (!themeComponentStyle) return undefined
    
    // Convert theme component style to ComponentStyle format
    const componentStyle: ComponentStyle = {}
    
    // Background color
    if (themeComponentStyle.backgroundColor) {
      componentStyle.backgroundColor = themeComponentStyle.backgroundColor
    }
    
    // Text color
    if (themeComponentStyle.textColor) {
      componentStyle.textColor = themeComponentStyle.textColor
    }
    
    // Border
    if (themeComponentStyle.borderColor) {
      componentStyle.borderColor = themeComponentStyle.borderColor
    }
    if (themeComponentStyle.borderWidth) {
      // Convert string like "0.5px" to number
      const borderWidth = parseFloat(themeComponentStyle.borderWidth)
      if (!isNaN(borderWidth)) {
        componentStyle.borderWidth = borderWidth
      }
    }
    if (themeComponentStyle.borderRadius) {
      // Convert string like "8px" to number (extract numeric value)
      const borderRadius = typeof themeComponentStyle.borderRadius === 'string' 
        ? parseFloat(themeComponentStyle.borderRadius.replace(/[^0-9.]/g, '')) 
        : themeComponentStyle.borderRadius
      if (!isNaN(borderRadius)) {
        componentStyle.borderRadius = borderRadius
      }
    }
    
    // Padding (convert object to number if needed)
    if (themeComponentStyle.padding) {
      if (typeof themeComponentStyle.padding === 'number') {
        componentStyle.padding = themeComponentStyle.padding
      } else if (typeof themeComponentStyle.padding === 'string') {
        // Try to parse padding string
        const padding = parseFloat(themeComponentStyle.padding)
        if (!isNaN(padding)) {
          componentStyle.padding = padding
        }
      }
    }
    
    // Font size
    if (themeComponentStyle.fontSize) {
      if (typeof themeComponentStyle.fontSize === 'string') {
        const fontSize = parseFloat(themeComponentStyle.fontSize)
        if (!isNaN(fontSize)) {
          componentStyle.fontSize = fontSize
        }
      } else if (typeof themeComponentStyle.fontSize === 'number') {
        componentStyle.fontSize = themeComponentStyle.fontSize
      }
    }
    
    // Font weight
    if (themeComponentStyle.fontWeight) {
      const fontWeight = themeComponentStyle.fontWeight
      if (fontWeight === 'normal' || fontWeight === 'medium' || fontWeight === 'semibold' || fontWeight === 'bold') {
        componentStyle.fontWeight = fontWeight
      } else if (typeof fontWeight === 'string') {
        // Map common string values to valid types
        const weightMap: Record<string, 'normal' | 'medium' | 'semibold' | 'bold'> = {
          '400': 'normal',
          '500': 'medium',
          '600': 'semibold',
          '700': 'bold',
          'normal': 'normal',
          'medium': 'medium',
          'semibold': 'semibold',
          'bold': 'bold'
        }
        const mapped = weightMap[fontWeight.toLowerCase()]
        if (mapped) {
          componentStyle.fontWeight = mapped
        }
      }
    }
    
    // Opacity (from global styling if available)
    if (brandingConfig.globalStyling) {
      // Opacity might be in widget properties, not theme
      // We'll handle this separately if needed
    }
    
    // Shadow (from boxShadow)
    if (themeComponentStyle.boxShadow) {
      componentStyle.shadow = true
    }
    
    return componentStyle
  } catch (error) {
    console.error('Error getting theme component style:', error)
    return undefined
  }
}

/**
 * Gets theme component style synchronously (cached version)
 * Use this when you have the theme config already loaded
 */
export function getThemeComponentStyleSync(
  brandingConfig: BrandingConfig | undefined,
  componentType: string
): ComponentStyle | undefined {
  if (!brandingConfig || !brandingConfig.componentStyling) return undefined
  
  const componentKey = getThemeComponentKey(componentType)
  if (!componentKey) return undefined
  
  const themeComponentStyle = brandingConfig.componentStyling[componentKey]
  if (!themeComponentStyle) return undefined
  
  // Convert theme component style to ComponentStyle format
  const componentStyle: ComponentStyle = {}
  
  // Background color
  if (themeComponentStyle.backgroundColor) {
    componentStyle.backgroundColor = themeComponentStyle.backgroundColor
  }
  
  // Text color
  if (themeComponentStyle.textColor) {
    componentStyle.textColor = themeComponentStyle.textColor
  }
  
  // Border
  if (themeComponentStyle.borderColor) {
    componentStyle.borderColor = themeComponentStyle.borderColor
  }
  if (themeComponentStyle.borderWidth) {
    const borderWidth = parseFloat(themeComponentStyle.borderWidth)
    if (!isNaN(borderWidth)) {
      componentStyle.borderWidth = borderWidth
    }
  }
  if (themeComponentStyle.borderRadius) {
    // Convert string like "8px" to number (extract numeric value)
    const borderRadius = typeof themeComponentStyle.borderRadius === 'string' 
      ? parseFloat(themeComponentStyle.borderRadius.replace(/[^0-9.]/g, '')) 
      : themeComponentStyle.borderRadius
    if (!isNaN(borderRadius)) {
      componentStyle.borderRadius = borderRadius
    }
  }
  
  // Padding
  if (themeComponentStyle.padding) {
    if (typeof themeComponentStyle.padding === 'number') {
      componentStyle.padding = themeComponentStyle.padding
    } else if (typeof themeComponentStyle.padding === 'string') {
      const padding = parseFloat(themeComponentStyle.padding)
      if (!isNaN(padding)) {
        componentStyle.padding = padding
      }
    }
  }
  
  // Font size
  if (themeComponentStyle.fontSize) {
    if (typeof themeComponentStyle.fontSize === 'string') {
      const fontSize = parseFloat(themeComponentStyle.fontSize)
      if (!isNaN(fontSize)) {
        componentStyle.fontSize = fontSize
      }
    } else if (typeof themeComponentStyle.fontSize === 'number') {
      componentStyle.fontSize = themeComponentStyle.fontSize
    }
  }
  
  // Font weight
  if (themeComponentStyle.fontWeight) {
    const fontWeight = themeComponentStyle.fontWeight
    if (fontWeight === 'normal' || fontWeight === 'medium' || fontWeight === 'semibold' || fontWeight === 'bold') {
      componentStyle.fontWeight = fontWeight
    } else if (typeof fontWeight === 'string') {
      // Map common string values to valid types
      const weightMap: Record<string, 'normal' | 'medium' | 'semibold' | 'bold'> = {
        '400': 'normal',
        '500': 'medium',
        '600': 'semibold',
        '700': 'bold',
        'normal': 'normal',
        'medium': 'medium',
        'semibold': 'semibold',
        'bold': 'bold'
      }
      const mapped = weightMap[fontWeight.toLowerCase()]
      if (mapped) {
        componentStyle.fontWeight = mapped
      }
    }
  }
  
  // Shadow
  if (themeComponentStyle.boxShadow) {
    componentStyle.shadow = true
  }
  
  return componentStyle
}

