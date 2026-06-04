export type ReportSource =
  | 'BUILT_IN'
  | 'BUILT_IN_VISUALIZE'
  | 'CUSTOM_EMBED_LINK'
  | 'POWER_BI'
  | 'GRAFANA'
  | 'LOOKER_STUDIO'

export interface Report {
  id: string
  name: string
  description?: string
  source: ReportSource
  category_id?: string
  folder_id?: string
  owner?: string
  link?: string
  workspace?: string
  embed_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ReportCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface ReportFolder {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}
