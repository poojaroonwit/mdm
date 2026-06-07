export interface APIKey {
  id: string
  provider: string
  name: string
  description?: string
  website?: string
  icon?: string
  apiKey: string | null
  status: 'active' | 'inactive' | 'error' | 'pending'
  isConfigured: boolean
  createdAt: string
  updatedAt: string
}

export function maskAPIKey(key: string | null) {
  if (!key || key === '***') return '***'
  if (key.length <= 8) return '***'
  return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
}
