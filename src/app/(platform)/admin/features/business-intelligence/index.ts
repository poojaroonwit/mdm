/**
 * Business Intelligence Feature
 * Main export file for the business intelligence feature
 */

// Components
export { BusinessIntelligence } from './components/BusinessIntelligence'
export { MergedBIReports } from './components/MergedBIReports'
export { AIAnalyst } from '@plugins/ai-assistant/src/components/AIAnalyst'
export { AIChatUI } from '@plugins/ai-assistant/src/components/AIChatUI'
export { KernelManagement } from '@plugins/data-science/src/components/KernelManagement'
export { BigQueryInterface } from '@plugins/sql-query/src/components/BigQueryInterface'
export { BigQueryInterfaceGranular } from '@plugins/sql-query/src/components/BigQueryInterfaceGranular'
export { DataScienceNotebook } from '@plugins/data-science/src/components/DataScienceNotebook'

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

