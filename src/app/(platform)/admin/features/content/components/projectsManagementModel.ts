export interface ProjectFieldDefinition {
  name: string
  displayName: string
  type: string
  isRequired?: boolean
  options?: Array<{
    label: string
    value: string
  }>
}

export interface ProjectRecord {
  id: string
  name: string
  description?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  spaceId: string
  metadata?: {
    customFields?: ProjectFieldDefinition[]
  } | null
  space?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    tickets: number
    milestones: number
  }
}

export const EMPTY_PROJECT_FORM = {
  name: '',
  description: '',
  status: 'PLANNING',
  startDate: '',
  endDate: '',
}

export type ProjectForm = typeof EMPTY_PROJECT_FORM

export function createFieldMachineName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}
