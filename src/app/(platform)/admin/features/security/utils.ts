/**
 * Security Feature Utilities
 * Helper functions for security operations
 */

import { AuditLog, SecurityEvent, SecurityPolicy } from './types'
import { getResultStatusColor, getSeverityColor as getSharedSeverityColor } from '@/lib/status-colors'
import { filterBySearch, filterByValue, sortByDate } from '@/lib/filter-utils'

/**
 * Format security event severity badge color
 * Uses shared status color utility
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  return getSharedSeverityColor(severity)
}

/**
 * Format audit log status badge color
 * Uses shared status color utility
 */
export function getStatusColor(status: 'success' | 'error' | 'warning'): string {
  return getResultStatusColor(status)
}

/**
 * Filter audit logs by search query
 * Uses shared filter utility
 */
export function filterAuditLogs(logs: AuditLog[], query: string): AuditLog[] {
  return filterBySearch(logs, query, ['userName', 'action', 'resource', 'resourceType', 'ipAddress'])
}

/**
 * Filter audit logs by severity
 * Uses shared filter utility
 */
export function filterBySeverity(logs: AuditLog[], severity: 'low' | 'medium' | 'high' | 'critical' | 'all'): AuditLog[] {
  return filterByValue(logs, 'severity', severity === 'all' ? 'all' : severity as any)
}

/**
 * Filter audit logs by status
 * Uses shared filter utility
 */
export function filterByStatus(logs: AuditLog[], status: 'success' | 'error' | 'warning' | 'all'): AuditLog[] {
  return filterByValue(logs, 'status', status === 'all' ? 'all' : status as any)
}

/**
 * Sort audit logs by timestamp
 * Uses shared sort utility
 */
export function sortAuditLogs(logs: AuditLog[], order: 'asc' | 'desc' = 'desc'): AuditLog[] {
  return sortByDate(logs, 'timestamp', order)
}

/**
 * Check if security policy is active
 */
export function isPolicyActive(policy: SecurityPolicy): boolean {
  return policy.isActive === true
}

/**
 * Format security policy type display name
 */
export function formatPolicyType(type: SecurityPolicy['type']): string {
  const typeMap: Record<SecurityPolicy['type'], string> = {
    password: 'Password Policy',
    session: 'Session Policy',
    ip: 'IP Whitelist',
    rate_limit: 'Rate Limiting',
    '2fa': 'Two-Factor Authentication',
  }
  return typeMap[type] || type
}

/**
 * Get security event icon based on type
 */
export function getSecurityEventIcon(type: SecurityEvent['type']): string {
  const iconMap: Record<SecurityEvent['type'], string> = {
    login_attempt: 'LogIn',
    permission_denied: 'Shield',
    data_access: 'Database',
    config_change: 'Settings',
    user_action: 'User',
    failed_login: 'XCircle',
    suspicious_activity: 'AlertTriangle',
    password_change: 'Key',
    '2fa_enabled': 'Shield'
  }
  return iconMap[type] || 'AlertCircle'
}

