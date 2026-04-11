/**
 * Project Management Types
 * 
 * Comprehensive types for the project management module including
 * members, resources, associations, and ontology relationships.
 */

// ============================================================================
// Project Types
// ============================================================================

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: ProjectRole
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  joinedAt: string
  permissions?: string[]
}

export type ProjectRole = 
  | 'owner'
  | 'lead'
  | 'developer'
  | 'qa'
  | 'designer'
  | 'analyst'
  | 'stakeholder'
  | 'viewer'

export const PROJECT_ROLES: { value: ProjectRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Owner', description: 'Full control over the project' },
  { value: 'lead', label: 'Lead', description: 'Project lead with management permissions' },
  { value: 'developer', label: 'Developer', description: 'Can develop and contribute to the project' },
  { value: 'qa', label: 'QA', description: 'Quality assurance and testing' },
  { value: 'designer', label: 'Designer', description: 'UI/UX design responsibilities' },
  { value: 'analyst', label: 'Analyst', description: 'Business analysis and requirements' },
  { value: 'stakeholder', label: 'Stakeholder', description: 'Project stakeholder with read access' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to the project' },
]

export interface ProjectLink {
  id: string
  projectId: string
  type: LinkType
  name: string
  url: string
  description?: string
  icon?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export type LinkType = 
  | 'git_repository'
  | 'shared_drive'
  | 'documentation'
  | 'wiki'
  | 'confluence'
  | 'jira'
  | 'slack'
  | 'teams'
  | 'design'
  | 'figma'
  | 'api'
  | 'monitoring'
  | 'dashboard'
  | 'other'

export const LINK_TYPES: { value: LinkType; label: string; icon: string }[] = [
  { value: 'git_repository', label: 'Git Repository', icon: 'GitBranch' },
  { value: 'shared_drive', label: 'Shared Drive', icon: 'HardDrive' },
  { value: 'documentation', label: 'Documentation', icon: 'FileText' },
  { value: 'wiki', label: 'Wiki', icon: 'BookOpen' },
  { value: 'confluence', label: 'Confluence', icon: 'Layout' },
  { value: 'jira', label: 'Jira', icon: 'Trello' },
  { value: 'slack', label: 'Slack', icon: 'MessageSquare' },
  { value: 'teams', label: 'Teams', icon: 'Users' },
  { value: 'design', label: 'Design', icon: 'Palette' },
  { value: 'figma', label: 'Figma', icon: 'PenTool' },
  { value: 'api', label: 'API', icon: 'Server' },
  { value: 'monitoring', label: 'Monitoring', icon: 'Activity' },
  { value: 'dashboard', label: 'Dashboard', icon: 'BarChart' },
  { value: 'other', label: 'Other', icon: 'Link' },
]

// ============================================================================
// Resource Association Types
// ============================================================================

export interface ProjectAsset {
  id: string
  projectId: string
  assetType: AssetType
  assetId: string
  assetName: string
  assetDescription?: string
  metadata?: Record<string, any>
  createdAt: string
}

export type AssetType = 
  | 'vm'
  | 'container'
  | 'service'
  | 'storage'
  | 'database'
  | 'api_endpoint'
  | 'load_balancer'
  | 'network'
  | 'security_group'
  | 'certificate'
  | 'dns'

export const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: 'vm', label: 'Virtual Machine', icon: 'Monitor' },
  { value: 'container', label: 'Container', icon: 'Box' },
  { value: 'service', label: 'Service', icon: 'Server' },
  { value: 'storage', label: 'Storage', icon: 'HardDrive' },
  { value: 'database', label: 'Database', icon: 'Database' },
  { value: 'api_endpoint', label: 'API Endpoint', icon: 'Webhook' },
  { value: 'load_balancer', label: 'Load Balancer', icon: 'Scale' },
  { value: 'network', label: 'Network', icon: 'Network' },
  { value: 'security_group', label: 'Security Group', icon: 'Shield' },
  { value: 'certificate', label: 'Certificate', icon: 'Lock' },
  { value: 'dns', label: 'DNS', icon: 'Globe' },
]

export interface ProjectDataModel {
  id: string
  projectId: string
  dataModelId: string
  dataModel: {
    id: string
    name: string
    description?: string
    attributeCount?: number
  }
  relationship: DataModelRelationship
  createdAt: string
}

export type DataModelRelationship = 
  | 'primary'      // Primary data model for the project
  | 'secondary'    // Secondary/supporting data model
  | 'reference'    // Referenced data model
  | 'deprecated'   // Deprecated but still linked

export interface ProjectNotebook {
  id: string
  projectId: string
  notebookId: string
  notebook: {
    id: string
    name: string
    description?: string
    author: string
    updatedAt: string
  }
  purpose?: string
  createdAt: string
}

export interface ProjectChatbot {
  id: string
  projectId: string
  chatbotId: string
  chatbot: {
    id: string
    name: string
    description?: string
    isPublished: boolean
  }
  purpose?: string
  createdAt: string
}

export interface ProjectQuery {
  id: string
  projectId: string
  queryId: string
  queryName: string
  queryType: 'sql' | 'graphql' | 'rest' | 'custom'
  description?: string
  createdAt: string
}

// ============================================================================
// Full Project Type
// ============================================================================

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  spaceId: string
  createdBy: string
  metadata?: ProjectMetadata
  createdAt: string
  updatedAt: string
  
  // Relations
  space?: {
    id: string
    name: string
    slug: string
  }
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  members?: ProjectMember[]
  links?: ProjectLink[]
  assets?: ProjectAsset[]
  dataModels?: ProjectDataModel[]
  notebooks?: ProjectNotebook[]
  chatbots?: ProjectChatbot[]
  queries?: ProjectQuery[]
  tickets?: any[]
  milestones?: any[]
  
  // Counts
  _count?: {
    tickets: number
    milestones: number
    members: number
    links: number
    assets: number
    dataModels: number
  }
}

export type ProjectStatus = 
  | 'PLANNING'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'PLANNING', label: 'Planning', color: 'blue' },
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'yellow' },
  { value: 'COMPLETED', label: 'Completed', color: 'gray' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
]

export interface ProjectMetadata {
  // Git Configuration
  gitRepositories?: {
    name: string
    url: string
    branch?: string
    type?: 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'other'
  }[]
  
  // Shared Drives
  sharedDrives?: {
    name: string
    url: string
    type?: 'google_drive' | 'onedrive' | 'sharepoint' | 'dropbox' | 'other'
    permissions?: string
  }[]
  
  // Tags and Categories
  tags?: string[]
  category?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  
  // Budget and Tracking
  budget?: {
    allocated?: number
    spent?: number
    currency?: string
  }
  
  // Custom Fields
  customFields?: Record<string, any>
}

// ============================================================================
// Ontology Types
// ============================================================================

export interface OntologyNode {
  id: string
  type: OntologyNodeType
  name: string
  description?: string
  metadata?: Record<string, any>
  
  // Position for graph visualization
  x?: number
  y?: number
  
  // Styling
  color?: string
  icon?: string
  size?: number
}

export type OntologyNodeType = 
  | 'project'
  | 'data_model'
  | 'data_table'
  | 'field'
  | 'vm'
  | 'container'
  | 'storage'
  | 'service'
  | 'notebook'
  | 'query'
  | 'ai_agent'
  | 'user'
  | 'ticket'
  | 'milestone'
  | 'space'

export interface OntologyEdge {
  id: string
  source: string
  target: string
  type: OntologyEdgeType
  label?: string
  metadata?: Record<string, any>
  
  // Styling
  color?: string
  width?: number
  style?: 'solid' | 'dashed' | 'dotted'
}

export type OntologyEdgeType = 
  | 'contains'
  | 'belongs_to'
  | 'references'
  | 'depends_on'
  | 'associated_with'
  | 'created_by'
  | 'assigned_to'
  | 'uses'
  | 'produces'
  | 'reads_from'
  | 'writes_to'
  | 'inherits'
  | 'implements'

export interface OntologyGraph {
  nodes: OntologyNode[]
  edges: OntologyEdge[]
  metadata?: {
    title?: string
    description?: string
    generatedAt?: string
    nodeCount?: number
    edgeCount?: number
  }
}

export const ONTOLOGY_NODE_COLORS: Record<OntologyNodeType, string> = {
  project: '#1e40af',      // Blue
  data_model: '#8B5CF6',   // Purple
  data_table: '#6366F1',   // Indigo
  field: '#A855F7',        // Violet
  vm: '#10B981',           // Emerald
  container: '#14B8A6',    // Teal
  storage: '#F59E0B',      // Amber
  service: '#EF4444',      // Red
  notebook: '#EC4899',     // Pink
  query: '#06B6D4',        // Cyan
  ai_agent: '#F97316',     // Orange
  user: '#6B7280',         // Gray
  ticket: '#22C55E',       // Green
  milestone: '#84CC16',    // Lime
  space: '#0EA5E9',        // Sky
}

export const ONTOLOGY_NODE_ICONS: Record<OntologyNodeType, string> = {
  project: 'FolderKanban',
  data_model: 'Layers',
  data_table: 'Table',
  field: 'Hash',
  vm: 'Monitor',
  container: 'Box',
  storage: 'HardDrive',
  service: 'Server',
  notebook: 'BookOpen',
  query: 'Search',
  ai_agent: 'Bot',
  user: 'User',
  ticket: 'Ticket',
  milestone: 'Flag',
  space: 'Layout',
}

// ============================================================================
// API Types
// ============================================================================

export interface CreateProjectInput {
  name: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
  spaceId: string
  metadata?: ProjectMetadata
  members?: {
    userId: string
    role: ProjectRole
  }[]
  links?: Omit<ProjectLink, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
  metadata?: ProjectMetadata
}

export interface ProjectSearchParams {
  spaceId?: string
  status?: ProjectStatus
  search?: string
  tags?: string[]
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface OntologySearchParams {
  query?: string
  nodeTypes?: OntologyNodeType[]
  spaceId?: string
  projectId?: string
  depth?: number // How many levels of relationships to traverse
  limit?: number
}
