import { BrandingConfig } from '../../types'

// Helper to get or initialize component styling
export const getComponentStyling = (branding: BrandingConfig, componentId: string) => {
    // Input and selection components default background color
    const inputSelectionComponents = ['text-input', 'select', 'multi-select', 'textarea']
    const defaultBackgroundColor = inputSelectionComponents.includes(componentId) ? '#f7f7f7' : ''

    if (!branding.componentStyling[componentId]) {
        return {
            light: {
                backgroundColor: defaultBackgroundColor,
                textColor: '',
                borderColor: '',
                borderRadius: '',
                borderWidth: '',
                padding: '',
                fontSize: '',
                fontWeight: '',
            },
            dark: {
                backgroundColor: defaultBackgroundColor,
                textColor: '',
                borderColor: '',
                borderRadius: '',
                borderWidth: '',
                padding: '',
                fontSize: '',
                fontWeight: '',
            },
        }
    }

    // Ensure input/selection components have default background if empty
    const styling = branding.componentStyling[componentId] as any
    if (inputSelectionComponents.includes(componentId)) {
        return {
            light: {
                ...(styling?.light || {}),
                backgroundColor: styling?.light?.backgroundColor || defaultBackgroundColor,
            },
            dark: {
                ...(styling?.dark || {}),
                backgroundColor: styling?.dark?.backgroundColor || defaultBackgroundColor,
            },
        }
    }

    return styling
}

// Helper to update component styling
export const updateComponentStyling = (
    branding: BrandingConfig,
    setBranding: (branding: BrandingConfig) => void,
    componentId: string,
    mode: 'light' | 'dark',
    field: string,
    value: string
) => {
    const current = getComponentStyling(branding, componentId)
    setBranding({
        ...branding,
        componentStyling: {
            ...branding.componentStyling,
            [componentId]: {
                ...current,
                [mode]: {
                    ...current[mode],
                    [field]: value,
                },
            },
        },
    })
}
