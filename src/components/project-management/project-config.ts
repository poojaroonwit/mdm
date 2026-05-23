export interface ProjectFieldOption {
  label: string
  value: string
}

export interface ProjectFieldDefinition {
  name: string
  displayName: string
  type: string
  isRequired?: boolean
  options?: ProjectFieldOption[]
  attributeType?: 'system' | 'project'
  sharing?: {
    mode: 'individual' | 'shared'
    projectIds?: string[]
  }
}

export interface ProjectStatusDefinition {
  value: string
  label: string
  accent: string
}

export interface ProjectTicketCardConfig {
  description?: boolean
  dueDate?: boolean
  estimate?: boolean
  assignee?: boolean
  labels?: boolean
  spaces?: boolean
  attributes?: boolean
  attributeNames?: string[]
}

export interface ProjectTicketConfig {
  statuses?: ProjectStatusDefinition[]
  cardFields?: ProjectTicketCardConfig
}

export interface ProjectMetadataShape {
  icon?: string
  thumbnailUrl?: string
  customFields?: ProjectFieldDefinition[]
  ticketConfig?: ProjectTicketConfig
  [key: string]: any
}

export const DEFAULT_PROJECT_STATUSES: ProjectStatusDefinition[] = [
  { value: 'BACKLOG', label: 'Backlog', accent: '#64748b' },
  { value: 'TODO', label: 'To Do', accent: '#2563eb' },
  { value: 'IN_PROGRESS', label: 'In Progress', accent: '#f97316' },
  { value: 'IN_REVIEW', label: 'In Review', accent: '#7c3aed' },
  { value: 'DONE', label: 'Done', accent: '#16a34a' },
]

export const DEFAULT_CARD_FIELDS: ProjectTicketCardConfig = {
  description: true,
  dueDate: true,
  estimate: true,
  assignee: true,
  labels: true,
  spaces: true,
  attributes: true,
  attributeNames: [],
}

export function createFieldMachineName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function createStatusValue(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'STATUS'
}

export function stripHtmlTags(value: string | null | undefined) {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeFieldOptions(options: unknown): ProjectFieldOption[] {
  if (!Array.isArray(options)) return []

  return options
    .map((option) => {
      if (typeof option === 'string') {
        const trimmed = option.trim()
        return trimmed ? { label: trimmed, value: trimmed } : null
      }

      if (option && typeof option === 'object') {
        const rawLabel = typeof (option as any).label === 'string'
          ? (option as any).label.trim()
          : typeof (option as any).value === 'string'
            ? (option as any).value.trim()
            : ''
        const rawValue = typeof (option as any).value === 'string'
          ? (option as any).value.trim()
          : rawLabel

        if (!rawLabel || !rawValue) return null
        return { label: rawLabel, value: rawValue }
      }

      return null
    })
    .filter((option): option is ProjectFieldOption => Boolean(option))
}

export function normalizeProjectFields(fields: unknown): ProjectFieldDefinition[] {
  if (!Array.isArray(fields)) return []

  return fields
    .map((field) => {
      if (!field || typeof field !== 'object') return null

      const displayName = typeof (field as any).displayName === 'string'
        ? (field as any).displayName.trim()
        : typeof (field as any).name === 'string'
          ? (field as any).name.trim()
          : ''

      const name = typeof (field as any).name === 'string' && (field as any).name.trim()
        ? createFieldMachineName((field as any).name)
        : createFieldMachineName(displayName)

      if (!name || !displayName) return null

      return {
        name,
        displayName,
        type: typeof (field as any).type === 'string' ? (field as any).type : 'TEXT',
        isRequired: Boolean((field as any).isRequired),
        options: normalizeFieldOptions((field as any).options),
        attributeType: (field as any).attributeType === 'system' ? 'system' : 'project',
        sharing: {
          mode: (field as any).sharing?.mode === 'shared' ? 'shared' : 'individual',
          projectIds: Array.isArray((field as any).sharing?.projectIds)
            ? (field as any).sharing.projectIds.filter((id: unknown) => typeof id === 'string')
            : [],
        },
      }
    })
    .filter((field): field is ProjectFieldDefinition => Boolean(field))
}

export function normalizeProjectStatuses(statuses: unknown): ProjectStatusDefinition[] {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return DEFAULT_PROJECT_STATUSES
  }

  const normalized = statuses
    .map((status) => {
      if (!status || typeof status !== 'object') return null
      const label = typeof (status as any).label === 'string'
        ? (status as any).label.trim()
        : typeof (status as any).value === 'string'
          ? (status as any).value.trim()
          : ''
      const value = typeof (status as any).value === 'string' && (status as any).value.trim()
        ? createStatusValue((status as any).value)
        : createStatusValue(label)

      if (!label || !value) return null

      return {
        value,
        label,
        accent: typeof (status as any).accent === 'string' && (status as any).accent.trim()
          ? (status as any).accent
          : '#64748b',
      }
    })
    .filter((status): status is ProjectStatusDefinition => Boolean(status))

  return normalized.length > 0 ? normalized : DEFAULT_PROJECT_STATUSES
}

export function normalizeProjectMetadata(metadata: unknown): ProjectMetadataShape {
  const safeMetadata = metadata && typeof metadata === 'object'
    ? { ...(metadata as Record<string, any>) }
    : {}

  return {
    ...safeMetadata,
    icon: typeof safeMetadata.icon === 'string' ? safeMetadata.icon : '',
    thumbnailUrl: typeof safeMetadata.thumbnailUrl === 'string' ? safeMetadata.thumbnailUrl : '',
    customFields: normalizeProjectFields(safeMetadata.customFields),
    ticketConfig: {
      statuses: normalizeProjectStatuses(safeMetadata.ticketConfig?.statuses),
      cardFields: {
        ...DEFAULT_CARD_FIELDS,
        ...(safeMetadata.ticketConfig?.cardFields || {}),
        attributeNames: Array.isArray(safeMetadata.ticketConfig?.cardFields?.attributeNames)
          ? safeMetadata.ticketConfig.cardFields.attributeNames.filter((name: unknown) => typeof name === 'string')
          : [],
      },
    },
  }
}
