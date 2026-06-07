export interface ChatKitColorAccent {
  primary?: string
  level?: number // 0-4 intensity level
  icon?: string // Icon color (separate from primary accent)
}

export interface ChatKitSurfaceColors {
  background?: string
  foreground?: string
  [key: string]: any
}

export interface ChatKitColor {
  accent?: ChatKitColorAccent
  background?: string
  text?: string
  secondary?: string
  border?: string
  surface?: string | ChatKitSurfaceColors
  [key: string]: any
}

export interface ChatKitTypography {
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  [key: string]: any
}

export interface ChatKitTheme {
  colorScheme?: 'light' | 'dark' | 'system' // 'system' = auto-detect browser preference
  color?: ChatKitColor
  radius?: 'pill' | 'round' | 'soft' | 'sharp'
  density?: 'compact' | 'normal' | 'spacious'
  typography?: ChatKitTypography
  // Legacy support
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  [key: string]: any
}

export interface ChatKitComposerTool {
  id?: string
  label?: string
  shortLabel?: string // Shorter label variant for compact display
  icon?: string
  pinned?: boolean
  type?: string
  accept?: string // For file_upload tools: e.g., "image/*", "video/*", ".pdf,.doc"
  placeholderOverride?: string // Override placeholder text for this specific tool
  [key: string]: any
}

export interface ChatKitComposer {
  placeholder?: string
  tools?: ChatKitComposerTool[]
  [key: string]: any
}

export interface ChatKitHeaderButton {
  icon?: string
  label?: string
  onClick?: () => void
  [key: string]: any
}

export interface ChatKitHeader {
  customButtonLeft?: ChatKitHeaderButton[]
  [key: string]: any
}

export interface ChatKitStartScreenPrompt {
  name?: string
  label?: string
  prompt: string
  icon?: string
  [key: string]: any
}

export interface ChatKitStartScreen {
  greeting?: string
  prompts?: ChatKitStartScreenPrompt[]
}

export interface ChatKitEntities {
  onTagSearch?: (query: string) => Promise<any[]>
  onRequestPreview?: (entity: any) => Promise<any>
  [key: string]: any
}

export interface ChatKitDisclaimer {
  text?: string
  [key: string]: any
}

export interface ChatKitThreadItemActions {
  feedback?: boolean
  retry?: boolean
  [key: string]: any
}

export interface ChatKitModelPicker {
  enabled?: boolean
  [key: string]: any
}

export interface ChatKitPersonaPicker {
  enabled?: boolean
  personas?: Array<{
    id?: string
    name?: string
    description?: string
    systemPrompt?: string
    [key: string]: any
  }>
  [key: string]: any
}

export interface ChatKitOptions {
  theme?: ChatKitTheme
  locale?: string
  composer?: ChatKitComposer
  header?: ChatKitHeader
  startScreen?: ChatKitStartScreen
  entities?: ChatKitEntities
  disclaimer?: ChatKitDisclaimer
  threadItemActions?: ChatKitThreadItemActions
  modelPicker?: ChatKitModelPicker
  personaPicker?: ChatKitPersonaPicker
  getStarted?: ChatKitGetStarted
  [key: string]: any
}

export interface ChatKitGetStarted {
  enabled?: boolean
  icon?: string
  image?: string
  title?: string
  subTitle?: string
  description?: string
  buttonText?: string
  marginBottom?: string
  [key: string]: any
}

export interface DifyFile {
  type: 'image' | 'document' | 'audio' | 'video'
  transfer_method: 'remote_url' | 'local_file'
  url?: string // For remote_url
  upload_file_id?: string // For local_file
  [key: string]: any
}

export interface DifyOptions {
  apiBaseUrl?: string // Dify API base URL (e.g., http://ncc-dify.qsncc.com)
  responseMode?: 'streaming' | 'blocking' // Response mode: streaming or blocking
  user?: string // User identifier
  conversationId?: string // Conversation ID for continuing conversations
  inputs?: Record<string, any> // Input variables for the workflow/app
  [key: string]: any
}
