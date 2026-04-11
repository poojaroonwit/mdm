import { ChatbotConfig } from '../../types'
import { convertToHex, isLightColor } from './themeUtils'

export const buildChatKitTheme = (chatbot: ChatbotConfig) => {
    const chatkitOptions = chatbot.chatkitOptions || {}
    const validTheme: any = {}

    if (chatkitOptions.theme) {
        // Validate colorScheme - handle 'system' by detecting browser preference
        const colorScheme = chatkitOptions.theme.colorScheme as 'light' | 'dark' | 'system' | undefined
        if (colorScheme) {
            if (colorScheme === 'system') {
                // Detect system preference for light/dark mode
                const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                validTheme.colorScheme = prefersDark ? 'dark' : 'light'
            } else if (colorScheme === 'light' || colorScheme === 'dark') {
                validTheme.colorScheme = colorScheme
            }
        }

        // Validate density
        if (chatkitOptions.theme.density &&
            ['compact', 'normal', 'spacious'].includes(chatkitOptions.theme.density)) {
            validTheme.density = chatkitOptions.theme.density
        }

        // Validate radius
        if (chatkitOptions.theme.radius &&
            ['pill', 'round', 'soft', 'sharp'].includes(chatkitOptions.theme.radius)) {
            validTheme.radius = chatkitOptions.theme.radius
        }
    }

    // Build color object with validation
    const colorObj: any = {}
    let hasColor = false

    if (chatkitOptions.theme?.color) {
        // Accent color (required) - ChatKit expects hex format
        const accentPrimaryRaw = chatkitOptions.theme.color.accent?.primary || chatbot.primaryColor || '#1e40af'
        const accentPrimaryHex = convertToHex(accentPrimaryRaw) || '#1e40af'
        const accentLevel = chatkitOptions.theme.color.accent?.level ?? 2

        // Validate accent level (0-3) per ChatKit schema
        const validLevel = typeof accentLevel === 'number' && accentLevel >= 0 && accentLevel <= 3
            ? accentLevel
            : 2

        colorObj.accent = {
            primary: accentPrimaryHex,
            level: validLevel as 0 | 1 | 2 | 3,
        }
        hasColor = true

        // NOTE: Icon color is NOT supported by ChatKit's accent color schema
        // Passing 'icon' property to accent causes "Invalid input at theme" error
        // Icon color configuration should be handled via CSS overrides instead

        // Surface colors - ChatKit supports SurfaceColors with background and foreground
        if (chatkitOptions.theme.color.surface) {
            const surface = chatkitOptions.theme.color.surface
            if (typeof surface === 'object' && surface !== null) {
                const surfaceObj: any = {}

                // Get background
                let bgHex: string | null = null
                if (surface.background) {
                    bgHex = convertToHex(surface.background)
                    if (bgHex) surfaceObj.background = bgHex
                }

                // Get foreground
                let fgHex: string | null = null
                if (surface.foreground) {
                    fgHex = convertToHex(surface.foreground)
                    if (fgHex) surfaceObj.foreground = fgHex
                }

                // If we have one but not the other, try to fill in gaps
                // If we have a background but no foreground, calculate a high-contrast foreground
                if (surfaceObj.background && !surfaceObj.foreground) {
                    surfaceObj.foreground = isLightColor(surfaceObj.background) ? '#000000' : '#ffffff'
                }

                // If we have a foreground but no background, fallback to configured background or default
                if (surfaceObj.foreground && !surfaceObj.background) {
                    // Try to use existing flat properties first
                    const fallbackBg = convertToHex(chatbot.backgroundColor || chatbot.messageBoxColor || '')
                    surfaceObj.background = fallbackBg || (isLightColor(surfaceObj.foreground) ? '#000000' : '#ffffff')
                }

                // Only add if we have at least one valid color (which essentially means both due to fallbacks above)
                // But specifically check validity constraints - if the schema STRICTLY requires both, we should only add if both exist.
                if (surfaceObj.background && surfaceObj.foreground) {
                    colorObj.surface = surfaceObj
                }
            } else if (typeof surface === 'string') {
                // Legacy support: if surface is a string, convert to object with background
                const surfaceHex = convertToHex(surface)
                if (surfaceHex) {
                    // Start with background
                    const sObj = {
                        background: surfaceHex,
                        foreground: isLightColor(surfaceHex) ? '#000000' : '#ffffff'
                    }
                    colorObj.surface = sObj
                }
            }
        }
    } else {
        // Default color if none provided - convert to hex as ChatKit requires hex format
        const primaryHex = convertToHex(chatbot.primaryColor) || '#1e40af'
        colorObj.accent = {
            primary: primaryHex,
            level: 2,
        }
        hasColor = true
    }

    // Map explicitly defined colors from chatkitOptions.theme.color if they exist
    if (chatkitOptions.theme?.color) {
        const c = chatkitOptions.theme.color
        
        // ChatKit typically only supports 'accent' and 'surface' in theme.color
        // Map explicitly defined background to surface.background if it exists
        if (c.background) {
            const bg = convertToHex(c.background)
            if (bg) {
                if (!colorObj.surface) colorObj.surface = { background: bg, foreground: '#000000' }
                else colorObj.surface.background = bg
            }
        }
        
        // Map foreground to surface.foreground if it exists
        if ((c as any).foreground || (c as any).text) {
            const fg = convertToHex((c as any).foreground || (c as any).text)
            if (fg) {
                if (!colorObj.surface) colorObj.surface = { background: '#ffffff', foreground: fg }
                else colorObj.surface.foreground = fg
            }
        }
    }

    // Background & Text & Surface
    // If surface is not already defined in the theme options (or was partially defined), try to map from flat properties
    if (!colorObj.surface && (chatbot.backgroundColor || chatbot.messageBoxColor)) {
        const bg = convertToHex(chatbot.backgroundColor || chatbot.messageBoxColor || '')
        // Use userMessageFontColor as primary text color fallback if fontColor is not set
        const fg = convertToHex(chatbot.fontColor || chatbot.userMessageFontColor || '')

        if (bg) {
            const derivedFg = fg || (isLightColor(bg) ? '#000000' : '#ffffff')
            colorObj.surface = {
                background: bg,
                foreground: derivedFg
            }
        }
    }


    // Final cleanup: Ensure required fields or valid literal types are used
    if (colorObj.accent || colorObj.surface) {
        validTheme.color = colorObj
    }

    // Add typography if present and valid - ChatKit schema is strict
    if (chatkitOptions.theme?.typography || chatbot.fontFamily) {
        const typographyObj: any = {}
        const typo = chatkitOptions.theme?.typography || {}

        // Include fontFamily
        if (typeof typo.fontFamily === 'string' && typo.fontFamily.trim() !== '') {
            typographyObj.fontFamily = typo.fontFamily.trim()
        } else if (chatbot.fontFamily) {
            typographyObj.fontFamily = chatbot.fontFamily
        }

        // ChatKit only supports baseSize (14-18), fontSources, fontFamily, fontFamilyMono
        // Map fontSize to baseSize if it matches the range
        const sizeVal = typo.baseSize || typo.fontSize
        if (sizeVal !== undefined) {
            const size = parseInt(sizeVal.toString())
            if (size >= 14 && size <= 18) {
                typographyObj.baseSize = size as 14 | 15 | 16 | 17 | 18
            }
        }

        // Removed potential unsupported keys: fontWeight, lineHeight, letterSpacing

        // Only add typography if it has properties
        if (Object.keys(typographyObj).length > 0) {
            validTheme.typography = typographyObj
        }
    }

    // Determine default color scheme based on background color
    // Only infer if not explicitly set in ChatKit options
    if (!validTheme.colorScheme && chatbot.messageBoxColor) {
        const isLight = isLightColor(chatbot.messageBoxColor)
        validTheme.colorScheme = isLight ? 'light' : 'dark'
    }

    // Fallback: Use Platform UI background color (messageBoxColor) as surface background if not set in ChatKit options
    if (!validTheme.color?.surface && chatbot.messageBoxColor) {
        const bgHex = convertToHex(chatbot.messageBoxColor)
        // Use fontColor for foreground or default to high-contrast color based on background brightness
        const defaultFg = isLightColor(chatbot.messageBoxColor) ? '#000000' : '#ffffff'
        const fgHex = convertToHex(chatbot.fontColor || '') || defaultFg

        if (bgHex && fgHex) {
            if (!validTheme.color) validTheme.color = {}
            validTheme.color.surface = {
                background: bgHex,
                foreground: fgHex
            }
        }
    }

    // Radius & Density - must be specific literals
    if (chatkitOptions.theme?.radius) {
        const r = chatkitOptions.theme.radius
        if (['pill', 'round', 'soft', 'sharp'].includes(r)) {
            validTheme.radius = r as any
        }
    }
    
    if (chatkitOptions.theme?.density) {
        const d = chatkitOptions.theme.density
        if (['compact', 'normal', 'spacious'].includes(d)) {
            validTheme.density = d as any
        }
    }

    // Debug theme for invalid input error
    if (Object.keys(validTheme).length > 0) {
        console.log('[ChatKitTheme] Generated Theme:', JSON.stringify(validTheme, null, 2))
        return validTheme
    }
    return undefined
}
