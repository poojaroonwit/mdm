/**
 * Business Intelligence Feature Utilities
 * Helper functions for business intelligence operations
 */

import { Dashboard, Report, DataSource, KernelServer } from './types'

/**
 * Check if dashboard is public
 */
export function isDashboardPublic(dashboard: Dashboard): boolean {
  return dashboard.isPublic === true
}

/**
 * Filter dashboards by space
 */
export function filterDashboardsBySpace(
  dashboards: Dashboard[],
  spaceId: string | 'all'
): Dashboard[] {
  if (spaceId === 'all') return dashboards
  return dashboards.filter(dashboard => dashboard.spaceId === spaceId)
}

/**
 * Sort dashboards by name
 */
export function sortDashboardsByName(
  dashboards: Dashboard[],
  order: 'asc' | 'desc' = 'asc'
): Dashboard[] {
  return [...dashboards].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Check if report is active
 */
export function isReportActive(report: Report): boolean {
  return report.isActive === true
}

/**
 * Check if report is scheduled
 */
export function isReportScheduled(report: Report): boolean {
  return report.type === 'scheduled'
}

/**
 * Filter reports by space
 */
export function filterReportsBySpace(
  reports: Report[],
  spaceId: string | 'all'
): Report[] {
  if (spaceId === 'all') return reports
  return reports.filter(report => report.spaceId === spaceId)
}

/**
 * Format report format display name
 */
export function formatReportFormat(format: Report['format']): string {
  const formatMap: Record<Report['format'], string> = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
    json: 'JSON',
  }
  return formatMap[format] || format
}

/**
 * Check if data source is active
 */
export function isDataSourceActive(dataSource: DataSource): boolean {
  return dataSource.isActive === true
}

/**
 * Filter data sources by type
 */
export function filterDataSourcesByType(
  dataSources: DataSource[],
  type: DataSource['type'] | 'all'
): DataSource[] {
  if (type === 'all') return dataSources
  return dataSources.filter(ds => ds.type === type)
}

/**
 * Get kernel status color
 */
export function getKernelStatusColor(status: KernelServer['status']): string {
  switch (status) {
    case 'online':
      return 'bg-green-600'
    case 'offline':
      return 'bg-gray-600'
    case 'error':
      return 'bg-red-600'
    case 'starting':
    case 'stopping':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Check if kernel is online
 */
export function isKernelOnline(kernel: KernelServer): boolean {
  return kernel.status === 'online'
}

/**
 * Filter kernels by status
 */
export function filterKernelsByStatus(
  kernels: KernelServer[],
  status: KernelServer['status'] | 'all'
): KernelServer[] {
  if (status === 'all') return kernels
  return kernels.filter(kernel => kernel.status === status)
}

/**
 * Filter kernels by language
 */
export function filterKernelsByLanguage(
  kernels: KernelServer[],
  language: string
): KernelServer[] {
  if (!language || language === 'all') return kernels
  return kernels.filter(kernel => kernel.language === language)
}

