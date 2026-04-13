/**
 * Data Governance Feature Types
 * Centralized type definitions for the data governance feature using OpenMetadata
 */

export interface OpenMetadataConfig {
  host: string
  apiVersion: string
  authProvider: 'basic' | 'jwt' | 'oauth' | 'saml'
  authConfig: {
    username?: string
    password?: string
    jwtToken?: string
    clientId?: string
    clientSecret?: string
  }
  isEnabled: boolean
  lastSync?: Date
}

export interface DataAsset {
  id: string
  name: string
  fullyQualifiedName: string
  description?: string
  type: 'table' | 'database' | 'dashboard' | 'pipeline' | 'topic' | 'mlmodel'
  service: string
  tags: string[]
  owner?: {
    id: string
    name: string
    type: 'user' | 'team'
  }
  lineage?: {
    upstream: DataAsset[]
    downstream: DataAsset[]
  }
  quality?: {
    score: number
    checks: QualityCheck[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface QualityCheck {
  id: string
  name: string
  type: 'column' | 'table' | 'custom'
  status: 'passed' | 'failed' | 'warning'
  result: any
  executedAt: Date
}

export interface DataPolicy {
  id: string
  name: string
  description?: string
  rules: PolicyRule[]
  appliesTo: string[] // Asset FQNs
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PolicyRule {
  id: string
  name: string
  type: 'access' | 'retention' | 'masking' | 'quality' | 'classification'
  condition: string
  action: string
  priority: number
}

export interface DataClassification {
  id: string
  name: string
  category: 'public' | 'internal' | 'confidential' | 'restricted'
  sensitivity: number // 1-5
  tags: string[]
}

export interface DataLineage {
  source: DataAsset
  target: DataAsset
  edgeType: 'transforms' | 'contains' | 'upstream' | 'downstream'
  description?: string
}

export interface GovernanceMetrics {
  totalAssets: number
  assetsWithPolicies: number
  assetsWithQualityChecks: number
  averageQualityScore: number
  policyComplianceRate: number
  dataClassificationCoverage: number
}

export interface DataDomain {
  id: string
  name: string
  description?: string
  owner?: {
    id: string
    name: string
    type: 'user' | 'team'
  }
  tags: string[]
  assets: string[] // Asset FQNs
  policies: string[] // Policy IDs
  createdAt: Date
  updatedAt: Date
}

export interface PlatformGovernanceConfig {
  dataDomains: DataDomain[]
  classificationSchemes: ClassificationScheme[]
  qualityRules: QualityRule[]
  retentionPolicies: RetentionPolicy[]
  accessControlRules: AccessControlRule[]
  dataStewards: DataSteward[]
  businessGlossary: BusinessGlossaryTerm[]
}

export interface ClassificationScheme {
  id: string
  name: string
  categories: ClassificationCategory[]
  isDefault: boolean
  createdAt: Date
}

export interface ClassificationCategory {
  id: string
  name: string
  level: number
  parentId?: string
  sensitivity: number // 1-5
  color: string
  description?: string
}

export interface QualityRule {
  id: string
  name: string
  description?: string
  type: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'timeliness' | 'uniqueness' | 'custom'
  condition: string
  threshold: number
  severity: 'error' | 'warning' | 'info'
  appliesTo: string[] // Asset types or FQNs
  isActive: boolean
  createdAt: Date
}

export interface RetentionPolicy {
  id: string
  name: string
  description?: string
  retentionPeriod: number // in days
  retentionUnit: 'days' | 'months' | 'years'
  action: 'archive' | 'delete' | 'anonymize'
  appliesTo: string[] // Asset FQNs or domains
  isActive: boolean
  createdAt: Date
}

export interface AccessControlRule {
  id: string
  name: string
  description?: string
  principal: string // User/Team/Role ID
  resource: string // Asset FQN or domain
  permissions: string[] // read, write, delete, etc.
  conditions?: Record<string, any>
  isActive: boolean
  createdAt: Date
}

export interface DataSteward {
  id: string
  userId: string
  userName: string
  domains: string[] // Domain IDs
  assets: string[] // Asset FQNs
  responsibilities: string[]
  createdAt: Date
}

export interface BusinessGlossaryTerm {
  id: string
  name: string
  definition: string
  category?: string
  relatedTerms: string[]
  tags: string[]
  owner?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

