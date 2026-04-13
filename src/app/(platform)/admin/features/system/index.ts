/**
 * System Feature
 * Main export file for the system feature
 */

// Components
export { SystemSettings } from './components/SystemSettings'

export { PageTemplatesAdmin } from './components/PageTemplatesAdmin'
export { NotificationCenter } from './components/NotificationCenter'

// Types
export type {
  SystemSettings as SystemSettingsType,
  BrandingConfig,
  TemplateItem,
  NotificationTemplate,
  NotificationSettings,
} from './types'

// Utils
export {
  filterTemplatesByScope,
  filterTemplatesByCategory,
  getAllTemplateCategories,
  isNotificationTemplateActive,
  filterNotificationTemplatesByType,
  sortNotificationTemplatesByName,
  formatNotificationType,
} from './utils'

