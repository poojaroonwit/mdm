import type { Theme } from './AdvancedStyling'

export function generateThemeCSS(theme: Theme, customCSS: string) {
  return `
:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-border: ${theme.colors.border};
  --color-accent: ${theme.colors.accent};
  
  --font-family: ${theme.typography.fontFamily};
  --font-size: ${theme.typography.fontSize}px;
  --font-weight: ${theme.typography.fontWeight};
  --line-height: ${theme.typography.lineHeight};
  
  --spacing-padding: ${theme.spacing.padding}px;
  --spacing-margin: ${theme.spacing.margin}px;
  --border-radius: ${theme.spacing.borderRadius}px;
  
  --shadow-enabled: ${theme.shadows.enabled ? '1' : '0'};
  --shadow-intensity: ${theme.shadows.intensity};
  --shadow-color: ${theme.shadows.color};
}

.dashboard-container {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  line-height: var(--line-height);
}

.dashboard-element {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-padding);
  margin: var(--spacing-margin);
  ${theme.shadows.enabled ? `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, ${theme.shadows.intensity});` : ''}
}

${customCSS}
    `.trim()
}
