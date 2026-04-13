/**
 * Security Feature
 * Main export file for the security feature
 */

// Components
export { SecurityFeatures } from './components/SecurityFeatures'
export { SSOConfiguration } from './components/SSOConfiguration'
export { AuditLogs } from './components/AuditLogs'

// Types
export type {
  SecurityPolicy,
  SSOConfig,
  AuditLog,
  SecurityEvent,
  IPWhitelist,
  SecuritySettings,
} from './types'

// Utils
export {
  getSeverityColor,
  getStatusColor,
  filterAuditLogs,
  filterBySeverity,
  filterByStatus,
  sortAuditLogs,
  isPolicyActive,
  formatPolicyType,
  getSecurityEventIcon,
} from './utils'

