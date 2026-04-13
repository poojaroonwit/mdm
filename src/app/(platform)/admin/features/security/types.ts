/**
 * Security Feature Types
 * Centralized type definitions for the security feature
 */

export interface SecurityPolicy {
  id: string
  name: string
  type: 'password' | 'session' | 'ip' | 'rate_limit' | '2fa'
  isActive: boolean
  settings: Record<string, any>
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface SSOConfig {
  // Enable/Disable toggles
  googleEnabled: boolean
  azureEnabled: boolean
  
  // Google SSO
  googleClientId: string
  googleClientSecret: string
  
  // Azure AD SSO
  azureTenantId: string
  azureClientId: string
  azureClientSecret: string
  azureAllowedDomains: string[]
  azureAllowSignup: boolean
  azureRequireEmailVerified: boolean
  azureDefaultRole: string
  azureGroupRoleMappings: AzureGroupRoleMapping[]
}

export interface AzureGroupRoleMapping {
  groupId: string
  name?: string
  role: string
}

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  action: string
  resource: string
  resourceType: string
  spaceId?: string
  spaceName?: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'error' | 'warning'
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityEvent {
  id: string
  type: 'login_attempt' | 'permission_denied' | 'data_access' | 'config_change' | 'user_action' | 'failed_login' | 'suspicious_activity' | 'password_change' | '2fa_enabled'
  timestamp: Date
  userId?: string
  userName?: string
  description?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
}

export interface IPWhitelist {
  id: string
  ipAddress: string
  description?: string
  isActive?: boolean
  createdAt: Date
  createdBy?: string
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expirationDays: number
  }
  sessionPolicy: {
    timeoutMinutes: number
    maxConcurrentSessions: number
    requireReauth: boolean
  }
  twoFactorAuth: {
    enabled: boolean
    requiredForAdmins: boolean
    backupCodesEnabled: boolean
  }
}

