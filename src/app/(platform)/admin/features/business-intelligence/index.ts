/**
 * Business Intelligence Feature
 * Main export file for the business intelligence feature
 */

// Components
export { BusinessIntelligence } from './components/BusinessIntelligence'
export { MergedBIReports } from './components/MergedBIReports'
export { AIAnalyst, AIChatUI } from '@/features/plugin-adapters/ai-assistant'
export { KernelManagement, DataScienceNotebook } from '@/features/plugin-adapters/data-science'
export { BigQueryInterface, BigQueryInterfaceGranular } from '@/features/plugin-adapters/sql-query'

// Types
export type {
  Dashboard,
  DashboardWidget,
  FilterConfig,
  Report,
  DataSource,
  ChartTemplate,
  KernelServer,
  KernelTemplate,
} from './types'

// Utils
export {
  isDashboardPublic,
  filterDashboardsBySpace,
  sortDashboardsByName,
  isReportActive,
  isReportScheduled,
  filterReportsBySpace,
  formatReportFormat,
  isDataSourceActive,
  filterDataSourcesByType,
  getKernelStatusColor,
  isKernelOnline,
  filterKernelsByStatus,
  filterKernelsByLanguage,
} from './utils'

