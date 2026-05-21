import type { BrandingConfig } from '@/types/branding'

/**
 * Default branding configuration
 * 
 * Only application name and logo/icon are customizable.
 * All other styling comes from globals.css CSS variables.
 * 
 * Components should read directly from CSS variables in globals.css.
 * This config only provides defaults for required fields that reference CSS vars.
 */
export const defaultBrandingConfig: BrandingConfig = {
    // Only customizable fields - application name and logo/icon
    applicationName: 'Unified Data Platform',
    applicationLogo: '',
    applicationLogoType: 'image',
    applicationLogoIcon: '',
    
    // All colors reference CSS variables from globals.css (not customizable)
    applicationLogoIconColor: 'hsl(var(--ring))',
    applicationLogoBackgroundColor: 'hsl(var(--brand-body-bg))',
    primaryColor: 'hsl(var(--ring))',
    secondaryColor: 'hsl(var(--secondary))',
    warningColor: 'hsl(var(--brand-warning))',
    dangerColor: 'hsl(var(--destructive))',
    uiBackgroundColor: 'hsl(var(--brand-ui-bg))',
    uiBorderColor: 'hsl(var(--brand-ui-border))',
    topMenuBackgroundColor: 'hsl(var(--brand-top-menu-bg))',
    platformSidebarBackgroundColor: 'hsl(var(--brand-sidebar-primary-bg))',
    secondarySidebarBackgroundColor: 'hsl(var(--brand-sidebar-secondary-bg))',
    topMenuTextColor: 'hsl(var(--brand-top-menu-text))',
    platformSidebarTextColor: 'hsl(var(--brand-sidebar-primary-text))',
    secondarySidebarTextColor: 'hsl(var(--brand-sidebar-secondary-text))',
    bodyBackgroundColor: 'hsl(var(--brand-body-bg))',
    
    // Login background - uses default light gradient (not customizable)
    loginBackground: {
        type: 'gradient',
        gradient: {
            from: 'hsl(var(--brand-body-bg))',
            to: 'hsl(var(--muted))',
            angle: 135,
        },
    },
    
    // Global styling - all reference CSS variables (not customizable)
    globalStyling: {
        fontFamily: 'Inter, sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        borderRadius: 'var(--radius)',
        borderColor: 'hsl(var(--border))',
        borderWidth: '1px',
        buttonBorderRadius: 'var(--brand-button-radius)',
        buttonBorderWidth: '0px',
        inputBorderRadius: 'var(--brand-input-radius)',
        inputBorderWidth: '1px',
        selectBorderRadius: 'var(--brand-input-radius)',
        selectBorderWidth: '1px',
        textareaBorderRadius: 'var(--brand-input-radius)',
        textareaBorderWidth: '1px',
        transitionDuration: '150ms',
        transitionTiming: 'ease-in-out',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    
    // Drawer overlay - default values (not customizable)
    drawerOverlay: {
        color: '#000000',
        opacity: 40,
        blur: 4,
    },
    
    // Component styling - empty by default, components use CSS variables
    componentStyling: {},
}
