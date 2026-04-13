/**
 * System Feature Types
 * Centralized type definitions for the system feature
 */

export interface SystemSettings {
  // General
  siteName: string
  siteDescription: string
  siteUrl: string
  logoUrl: string
  faviconUrl: string
  supportEmail: string

  // Organization
  orgName: string
  orgDescription: string
  orgAddress: string
  orgPhone: string
  orgEmail: string
  orgWebsite: string

  // Database
  dbHost: string
  dbPort: number
  dbName: string
  dbUser: string
  dbPassword: string

  // Email
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  wsProxyUrl: string
  cronApiKey: string
  schedulerApiKey: string
  serviceDeskWebhookSecret: string
  gitWebhookSecret: string
  minioPublicUrl: string

  // Security
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  requireTwoFactor: boolean
  enableLoginAlert: boolean

  // UI Protection
  uiProtectionEnabled: boolean

  // Features
  enableUserRegistration: boolean
  enableGuestAccess: boolean
  enableNotifications: boolean
  enableAnalytics: boolean
  requireAdminApproval: boolean
  requireEmailVerification: boolean
  enableAuditTrail: boolean
  deletePolicyDays: number

  // Storage
  maxFileSize: number
  allowedFileTypes: string[]
  storageProvider: 'local' | 's3' | 'supabase'
}


export interface BrandingConfig {
  // Application branding
  applicationLogo?: string
  applicationLogoType?: 'image' | 'icon'
  applicationLogoIcon?: string // Icon name from lucide-react
  applicationLogoIconColor?: string
  applicationLogoBackgroundColor?: string
  applicationName: string

  // Colors - flattened structure (no light/dark separation)
  // Each theme is either light or dark, determined by theme.themeMode
  primaryColor: string
  secondaryColor: string
  warningColor: string
  dangerColor: string
  uiBackgroundColor: string
  uiBorderColor: string
  bodyBackgroundColor: string
  topMenuBackgroundColor: string
  platformSidebarBackgroundColor: string
  secondarySidebarBackgroundColor: string
  topMenuTextColor: string
  platformSidebarTextColor: string
  secondarySidebarTextColor: string
  bodyTextColor?: string // Global text/foreground color for body content

  // Login background
  loginBackground: {
    type: 'color' | 'gradient' | 'image' | 'video'
    color?: string
    gradient?: {
      from: string
      to: string
      angle: number
    }
    image?: string
    video?: string
  }

  // Google Fonts API Key
  googleFontsApiKey?: string

  // Global styling (not applied to space modules)
  globalStyling: {
    fontFamily?: string // Google Font family name
    fontFamilyMono?: string // Monospaced font for prompts/parameters
    borderRadius: string // e.g., "0.5rem", "8px"
    borderColor: string // e.g., "#e2e8f0"
    borderWidth: string // e.g., "1px"
    buttonBorderRadius: string
    buttonBorderWidth: string
    inputBorderRadius: string
    inputBorderWidth: string
    selectBorderRadius: string
    selectBorderWidth: string
    textareaBorderRadius?: string
    textareaBorderWidth?: string
    transitionDuration?: string // e.g., "200ms"
    transitionTiming?: string // e.g., "cubic-bezier(0.4, 0, 0.2, 1)"
    shadowSm?: string
    shadowMd?: string
    shadowLg?: string
    shadowXl?: string

    // Sizing
    baseFontSize?: string
    inputHeight?: string
    inputPadding?: string
    inputFontSize?: string
    buttonHeight?: string
    buttonPadding?: string
    buttonFontSize?: string
  }

  // Drawer overlay settings
  drawerOverlay?: {
    color: string // e.g., "#000000"
    opacity: number // 0-100
    blur: number // 0-100 (in pixels)
  }

  // Drawer style configuration
  drawerStyle?: {
    type: 'normal' | 'modern' | 'floating' // Drawer presentation style
    margin?: string // Margin for modern/floating styles (e.g., "16px", "24px")
    borderRadius?: string // Border radius for modern/floating styles (e.g., "12px")
    width?: string // Custom width override (e.g., "500px", "600px")
    backgroundBlur?: number // Background blur in pixels (e.g., 10)
    backgroundOpacity?: number // Background opacity 0-100 (e.g., 95)
  }

  // Component-specific styling - flattened (no light/dark separation)
  componentStyling: {
    [componentId: string]: {
      backgroundColor?: string
      textColor?: string
      borderColor?: string
      borderRadius?: string
      borderTopLeftRadius?: string
      borderTopRightRadius?: string
      borderBottomRightRadius?: string
      borderBottomLeftRadius?: string
      borderWidth?: string
      borderStyle?: string
      // Individual border sides - separate color, width, and style for each side
      borderTopColor?: string
      borderRightColor?: string
      borderBottomColor?: string
      borderLeftColor?: string
      borderTopWidth?: string
      borderRightWidth?: string
      borderBottomWidth?: string
      borderLeftWidth?: string
      borderTopStyle?: string
      borderRightStyle?: string
      borderBottomStyle?: string
      borderLeftStyle?: string
      padding?: string
      paddingTop?: string
      paddingRight?: string
      paddingBottom?: string
      paddingLeft?: string
      margin?: string
      marginTop?: string
      marginRight?: string
      marginBottom?: string
      marginLeft?: string
      width?: string
      height?: string
      minWidth?: string
      maxWidth?: string
      minHeight?: string
      maxHeight?: string
      fontSize?: string
      fontWeight?: string
      fontStyle?: string
      fontFamily?: string
      letterSpacing?: string
      lineHeight?: string
      textAlign?: string
      textTransform?: string
      textDecoration?: string
      // Text decoration line styling (for underline, overline, line-through)
      textDecorationColor?: string
      textDecorationThickness?: string // Line weight/thickness
      textDecorationStyle?: string // solid, double, dotted, dashed, wavy
      textUnderlineOffset?: string // Margin/offset for underline
      textUnderlinePosition?: string // auto, under, left, right
      opacity?: string
      backdropFilter?: string // e.g., "blur(10px)"
      boxShadow?: string // e.g., "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      filter?: string // e.g., "brightness(1.1)"
      transform?: string // e.g., "scale(1.05)"
      cursor?: string // e.g., "pointer"
      outline?: string // e.g., "2px solid #007AFF"
      outlineColor?: string
      outlineWidth?: string
      gap?: string // for flex/grid layouts
      zIndex?: string
      overflow?: string // e.g., "hidden", "scroll", "auto"
      overflowX?: string
      overflowY?: string
      whiteSpace?: string // e.g., "nowrap", "pre", "pre-wrap"
      wordBreak?: string // e.g., "break-word", "break-all"
      textOverflow?: string // e.g., "ellipsis"
      visibility?: string // e.g., "visible", "hidden"
      pointerEvents?: string // e.g., "none", "auto"
      userSelect?: string // e.g., "none", "text", "all"
      transition?: string // e.g., "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
      position?: string // e.g., "absolute", "relative", "fixed"
      top?: string
      right?: string
      bottom?: string
      left?: string
      display?: string // e.g., "flex", "grid", "block"
      flexDirection?: string // e.g., "row", "column"
      flexWrap?: string // e.g., "wrap", "nowrap"
      justifyContent?: string // e.g., "center", "flex-start"
      alignItems?: string // e.g., "center", "flex-start"
      alignContent?: string // e.g., "center", "flex-start"
      gridTemplateColumns?: string
      gridTemplateRows?: string
      gridColumn?: string
      gridRow?: string
    }
  }
}

export interface TemplateItem {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  version: string
  scope?: 'global' | 'space'
  visibleToSpaces?: string[]
}

export interface NotificationTemplate {
  id: string
  key: string
  name: string
  type: 'email' | 'push' | 'sms' | 'webhook'
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationSettings {
  email: {
    enabled: boolean
    smtp: {
      host: string
      port: number
      username: string
      password: string
      secure: boolean
    }
    from: string
    replyTo: string
  }
  push: {
    enabled: boolean
    vapidKeys?: {
      publicKey: string
      privateKey: string
    }
  }
  sms: {
    enabled: boolean
    provider?: string
    apiKey?: string
    apiSecret?: string
  }
  webhook: {
    enabled: boolean
    url?: string
    secret?: string
  }
}

