/**
 * Data Governance Feature
 * Main export file for the data governance feature using OpenMetadata
 */

// Components
export { DataGovernance } from './components/DataGovernance'
export { PlatformGovernanceConfig } from './components/PlatformGovernanceConfig'
export { DataProfiling } from './components/DataProfiling'
export { TestSuites } from './components/TestSuites'
export { Collaboration } from './components/Collaboration'
export { IngestionManagement } from './components/IngestionManagement'
export { WebhooksAlerts } from './components/WebhooksAlerts'

// Types
export type {
  OpenMetadataConfig,
  DataAsset,
  QualityCheck,
  DataPolicy,
  PolicyRule,
  DataClassification,
  DataLineage,
  GovernanceMetrics,
  DataDomain,
  ClassificationScheme,
  ClassificationCategory,
  QualityRule,
  RetentionPolicy,
  AccessControlRule,
  DataSteward,
  BusinessGlossaryTerm,
} from './types'

// Note: PlatformGovernanceConfig type is not exported here to avoid conflict with the component.
// Import it directly from './types' if needed.

// Utils
export {
  getAssetTypeIcon,
  getQualityStatusColor,
  getClassificationColor,
  calculateGovernanceMetrics,
  formatFQN,
  isAssetCompliant,
  filterAssetsByType,
  filterAssetsByTag,
  sortAssetsByName,
  getQualityCheckStatus,
} from './utils'

