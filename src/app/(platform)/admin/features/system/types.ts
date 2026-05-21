export type { BrandingConfig } from '@/types/branding'

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

