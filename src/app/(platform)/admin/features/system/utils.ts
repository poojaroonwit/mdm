/**
 * System Feature Utilities
 * Helper functions for system operations
 */

import { TemplateItem, NotificationTemplate } from './types'

/**
 * Filter templates by scope
 */
export function filterTemplatesByScope(
  templates: TemplateItem[],
  scope: 'all' | 'global' | 'space'
): TemplateItem[] {
  if (scope === 'all') return templates
  return templates.filter(t => (t.scope || 'global') === scope)
}

/**
 * Filter templates by category
 */
export function filterTemplatesByCategory(
  templates: TemplateItem[],
  category: string
): TemplateItem[] {
  if (!category || category === 'all') return templates
  return templates.filter(t => t.category === category)
}

/**
 * Get all unique categories from templates
 */
export function getAllTemplateCategories(templates: TemplateItem[]): string[] {
  const categorySet = new Set<string>()
  templates.forEach(template => {
    if (template.category) {
      categorySet.add(template.category)
    }
  })
  return Array.from(categorySet).sort()
}

/**
 * Check if notification template is active
 */
export function isNotificationTemplateActive(template: NotificationTemplate): boolean {
  return template.isActive === true
}

/**
 * Filter notification templates by type
 */
export function filterNotificationTemplatesByType(
  templates: NotificationTemplate[],
  type: NotificationTemplate['type'] | 'all'
): NotificationTemplate[] {
  if (type === 'all') return templates
  return templates.filter(template => template.type === type)
}

/**
 * Sort notification templates by name
 */
export function sortNotificationTemplatesByName(
  templates: NotificationTemplate[],
  order: 'asc' | 'desc' = 'asc'
): NotificationTemplate[] {
  return [...templates].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Format notification type display name
 */
export function formatNotificationType(type: NotificationTemplate['type']): string {
  const typeMap: Record<NotificationTemplate['type'], string> = {
    email: 'Email',
    push: 'Push Notification',
    sms: 'SMS',
    webhook: 'Webhook',
  }
  return typeMap[type] || type
}

