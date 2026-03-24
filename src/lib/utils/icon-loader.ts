/**
 * Dynamic Icon Loader for Lucide React
 * 
 * This utility provides lazy-loading capabilities for Lucide icons to reduce
 * initial bundle size and memory usage. Instead of importing all 1000+ icons
 * at once, icons are loaded on-demand and cached.
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react'
import type { LucideProps } from 'lucide-react'

type IconComponent = ComponentType<LucideProps>
type LazyIconComponent = LazyExoticComponent<IconComponent>

// Cache for loaded icons to prevent re-importing
const iconCache = new Map<string, LazyIconComponent>()

// Cache for icon metadata (just the names, very lightweight)
let iconNames: string[] | null = null

/**
 * Dynamically load a Lucide icon by name
 * @param iconName - Name of the icon (e.g., 'Home', 'User', 'Settings')
 * @returns Lazy-loaded icon component or null if not found
 */
export function loadIcon(iconName: string): LazyIconComponent | null {
    // Return cached icon if available
    if (iconCache.has(iconName)) {
        return iconCache.get(iconName)!
    }

    try {
        // Create lazy component that dynamically imports the specific icon
        const LazyIcon = lazy(async () => {
            try {
                // Check for Heroicons prefix
                if (iconName.startsWith('ho-') || iconName.startsWith('hs-')) {
                    const [prefix, ...rest] = iconName.split('-')
                    const realName = rest.join('-')
                    
                    let module;
                    if (prefix === 'ho') {
                        module = await import('@heroicons/react/24/outline');
                    } else {
                        module = await import('@heroicons/react/24/solid');
                    }
                    const Icon = module[realName] as IconComponent
                    
                    if (!Icon) {
                        console.warn(`Icon "${realName}" not found in ${path}`)
                        const lucideModule = await import(`lucide-react`)
                        return { default: lucideModule.HelpCircle as IconComponent }
                    }
                    
                    return { default: Icon }
                }

                // Dynamic import of specific icon only
                const module = await import(`lucide-react`)
                const Icon = module[iconName as keyof typeof module] as IconComponent

                if (!Icon) {
                    console.warn(`Icon "${iconName}" not found in lucide-react`)
                    // Return a fallback icon
                    return { default: module.HelpCircle as IconComponent }
                }

                return { default: Icon }
            } catch (error) {
                console.error(`Failed to load icon "${iconName}":`, error)
                // Return a fallback
                const module = await import(`lucide-react`)
                return { default: module.HelpCircle as IconComponent }
            }
        })

        iconCache.set(iconName, LazyIcon)
        return LazyIcon
    } catch (error) {
        console.error(`Error creating lazy icon for "${iconName}":`, error)
        return null
    }
}

/**
 * Get all available icon names (lightweight - doesn't load the actual icons)
 * This is used for icon pickers and search functionality
 */
export async function getIconNames(): Promise<string[]> {
    if (iconNames) {
        return iconNames
    }

    try {
        const names: string[] = [];

        // 1. Load Lucide icon names
        let lucideModule;
        try {
            lucideModule = await import('lucide-react');
            const lucideNames = Object.keys(lucideModule).filter((key) => {
                return key[0] === key[0]?.toUpperCase() &&
                    key !== 'createLucideIcon' &&
                    key !== 'Icon' &&
                    typeof lucideModule[key as keyof typeof lucideModule] !== 'string'
            })
            names.push(...lucideNames);
        } catch (e) {
            console.warn('Failed to load lucide-react module for icon names', e);
        }


        // 2. Load Heroicons Outline names
        try {
            const hoModule = await import('@heroicons/react/24/outline')
            const hoNames = Object.keys(hoModule)
                .filter(key => key[0] === key[0].toUpperCase())
                .map(name => `ho-${name}`)
            names.push(...hoNames)
        } catch (e) {
            console.warn('Failed to load Heroicons Outline names', e)
        }

        // 3. Load Heroicons Solid names
        try {
            const hsModule = await import('@heroicons/react/24/solid')
            const hsNames = Object.keys(hsModule)
                .filter(key => key[0] === key[0].toUpperCase())
                .map(name => `hs-${name}`)
            names.push(...hsNames)
        } catch (e) {
            console.warn('Failed to load Heroicons Solid names', e)
        }

        iconNames = names;
        return names;
    } catch (error) {
        console.error('Failed to load icon names:', error)
        return []
    }
}

/**
 * Preload a set of commonly used icons to improve perceived performance
 * Call this during app initialization for icons used in the initial render
 */
export function preloadIcons(iconNames: string[]): void {
    iconNames.forEach((name) => {
        loadIcon(name)
    })
}

/**
 * Clear the icon cache (useful for testing or memory management)
 */
export function clearIconCache(): void {
    iconCache.clear()
    iconNames = null
}

/**
 * Check if an icon exists in the Lucide library
 */
export async function isValidIcon(iconName: string): Promise<boolean> {
    const names = await getIconNames()
    return names.includes(iconName)
}
