import { TemplateManager } from './template-manager'
import { TemplateGenerator } from './template-generator'
import { Template, DataModel } from './template-generator'

export interface SpacesEditorPage {
  id: string
  name: string
  displayName: string
  description: string
  templateId?: string
  isCustom: boolean
  path: string
  order: number
  isActive: boolean
  hidden?: boolean
  icon?: string
  permissions?: {
    roles?: string[] // e.g., ['owner', 'admin', 'member']
    userIds?: string[] // specific user IDs
    groupIds?: string[] // specific group IDs
  }
  components?: any[] // Page components for the editor
  createdAt: string
  updatedAt: string
}

export interface LoginPageConfig {
  backgroundType: 'color' | 'image' | 'gradient'
  backgroundColor?: string
  backgroundImage?: string
  gradient?: {
    from: string
    to: string
    angle: number
  }
  leftPanelWidth?: string // e.g., "70%"
  rightPanelWidth?: string // e.g., "30%"
  cardStyle?: {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    borderRadius?: number
    shadow?: boolean
  }
  title?: string
  description?: string
  showLogo?: boolean
  logoUrl?: string
}

export interface SpacesEditorConfig {
  id: string
  spaceId: string
  pages: SpacesEditorPage[]
  layoutConfig?: any
  sidebarConfig: {
    items: Array<{
      id: string
      type: 'page' | 'divider' | 'group' | 'text'
      name: string
      icon?: string
      color?: string
      pageId?: string
      children?: any[]
    }>
    background: string
    textColor: string
    fontSize: string
  }
  loginPageConfig?: LoginPageConfig
  postAuthRedirectPageId?: string // ID of page to redirect to after authentication
  version: string
  createdAt: string
  updatedAt: string
}

export interface Space {
  id: string
  name: string
  slug: string
  description?: string
  isDefault?: boolean
  is_active?: boolean
  icon?: string
  logoUrl?: string
  createdAt?: string
  updatedAt?: string
}

export class SpacesEditorManager {
  private static readonly STORAGE_KEY = 'spaces_editor_configs'
  private static readonly API_BASE = '/api/spaces-editor'

  private static canUseBrowserStorage() {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  private static readCachedConfig(spaceId: string): SpacesEditorConfig | null {
    if (!this.canUseBrowserStorage()) {
      return null
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return null
      }

      const configs: Record<string, SpacesEditorConfig> = JSON.parse(stored)
      return configs[spaceId] || null
    } catch (error) {
      console.warn('Error reading localStorage:', error)
      return null
    }
  }

  private static writeCachedConfig(config: SpacesEditorConfig) {
    if (!this.canUseBrowserStorage()) {
      return
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const configs: Record<string, SpacesEditorConfig> = stored ? JSON.parse(stored) : {}
      configs[config.spaceId] = config
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs))
    } catch (error) {
      console.warn('Error writing localStorage:', error)
    }
  }

  /**
   * Get all spaces from the API
   * @returns Promise resolving to an array of Space objects
   */
  static async getSpaces(): Promise<Space[]> {
    const response = await fetch('/api/spaces?page=1&limit=100', {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch spaces: ${response.statusText}`)
      return []
    }
    
    try {
      const data = await response.json()
      return data.spaces || []
    } catch (error) {
      console.error('Error parsing spaces response:', error)
      return []
    }
  }

  /**
   * Get spaces editor configuration for a space
   */
  static async getSpacesEditorConfig(spaceId: string): Promise<SpacesEditorConfig | null> {
    try {
      const response = await fetch(`${this.API_BASE}/${spaceId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        const apiConfig = data.config
        if (apiConfig) {
          this.writeCachedConfig(apiConfig)
        }

        return apiConfig || null
      }
    } catch (error) {
      console.warn('Failed to fetch spaces editor config from API, using local cache if available:', error)
    }

    return this.readCachedConfig(spaceId)
  }

  /**
   * Save spaces editor configuration
   */
  static async saveSpacesEditorConfig(config: SpacesEditorConfig): Promise<void> {
    const nextConfig = { ...config, updatedAt: new Date().toISOString() }

    try {
      const response = await fetch(`${this.API_BASE}/${config.spaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(nextConfig),
      })

      if (!response.ok) {
        throw new Error(`Failed to save spaces editor config to API (${response.status})`)
      }
      this.writeCachedConfig(nextConfig)
    } catch (error) {
      this.writeCachedConfig(nextConfig)
      console.warn('Failed to save spaces editor config to API, using local cache:', error)
    }
  }

  /**
   * Create default spaces editor configuration
   */
  static async createDefaultConfig(spaceId: string): Promise<SpacesEditorConfig> {
    const config: SpacesEditorConfig = {
      id: `config_${spaceId}_${Date.now()}`,
      spaceId,
      pages: [],
      layoutConfig: {},
      sidebarConfig: {
        items: [],
        background: '#ffffff',
        textColor: '#374151',
        fontSize: '14px'
      },
      loginPageConfig: {
        backgroundType: 'gradient',
        backgroundColor: '#1e40af',
        gradient: {
          from: '#1e40af',
          to: '#1e40af',
          angle: 135
        },
        leftPanelWidth: '70%',
        rightPanelWidth: '30%',
        cardStyle: {
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
          borderRadius: 8,
          shadow: true
        },
        title: 'Sign in',
        description: 'Access this workspace',
        showLogo: false
      },
      postAuthRedirectPageId: undefined,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.saveSpacesEditorConfig(config)
    return config
  }

  /**
   * Get only the layout configuration for a space
   */
  static async getLayoutConfig(spaceId: string): Promise<any | null> {
    const config = await this.getSpacesEditorConfig(spaceId)
    return config?.layoutConfig || null
  }

  /**
   * Save only the layout configuration for a space
   */
  static async saveLayoutConfig(spaceId: string, layoutConfig: any): Promise<void> {
    const config = (await this.getSpacesEditorConfig(spaceId)) || (await this.createDefaultConfig(spaceId))
    const next: SpacesEditorConfig = {
      ...config,
      layoutConfig,
      updatedAt: new Date().toISOString(),
    }
    await this.saveSpacesEditorConfig(next)
  }

  /**
   * Get all pages for a space
   */
  static async getPages(spaceId: string): Promise<SpacesEditorPage[]> {
    const config = await this.getSpacesEditorConfig(spaceId)
    return config?.pages || []
  }

  /**
   * Create a new page
   */
  static async createPage(spaceId: string, pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> {
    const config = await this.getSpacesEditorConfig(spaceId) || await this.createDefaultConfig(spaceId)
    
    const newPage: SpacesEditorPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: pageData.name || 'new-page',
      displayName: pageData.displayName || 'New Page',
      description: pageData.description || 'A new page',
      templateId: pageData.templateId,
      isCustom: pageData.isCustom ?? true,
      path: pageData.path || (pageData.name ? `/${pageData.name}` : '/new-page'),
      order: config.pages.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    config.pages.push(newPage)
    await this.saveSpacesEditorConfig(config)
    return newPage
  }

  /**
   * Update a page
   */
  static async updatePage(spaceId: string, pageId: string, updates: Partial<SpacesEditorPage>): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    const pageIndex = config.pages.findIndex(p => p.id === pageId)
    if (pageIndex >= 0) {
      config.pages[pageIndex] = {
        ...config.pages[pageIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await this.saveSpacesEditorConfig(config)
    }
  }

  /**
   * Delete a page
   */
  static async deletePage(spaceId: string, pageId: string): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    config.pages = config.pages.filter(p => p.id !== pageId)
    await this.saveSpacesEditorConfig(config)
  }

  /**
   * Get templates available for a space
   */
  static async getAvailableTemplates(spaceId: string): Promise<Template[]> {
    // Get all templates
    const allTemplates = await TemplateManager.getTemplates()
    
    // Filter templates that are relevant to this space
    // For now, return all templates, but this could be filtered by space-specific criteria
    return allTemplates
  }

  /**
   * Assign a template to a page
   */
  static async assignTemplateToPage(spaceId: string, pageId: string, templateId: string): Promise<void> {
    await this.updatePage(spaceId, pageId, { templateId })
  }

  /**
   * Create a page from template
   */
  static async createPageFromTemplate(spaceId: string, templateId: string, pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> {
    const template = await TemplateManager.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    const newPage = await this.createPage(spaceId, {
      ...pageData,
      templateId,
      isCustom: false
    })

    return newPage
  }

  /**
   * Clear spaces editor configuration (remove all pages)
   */
  static async clearSpacesEditorConfig(spaceId: string): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    const clearedConfig: SpacesEditorConfig = {
      ...config,
      pages: [],
      sidebarConfig: {
        ...config.sidebarConfig,
        items: []
      },
      updatedAt: new Date().toISOString()
    }

    await this.saveSpacesEditorConfig(clearedConfig)
  }

  /**
   * Reset spaces editor configuration to default (empty)
   */
  static async resetSpacesEditorConfig(spaceId: string): Promise<SpacesEditorConfig> {
    // Clear existing config
    await this.clearSpacesEditorConfig(spaceId)
    
    // Create new default config
    return await this.createDefaultConfig(spaceId)
  }
}
