export interface AnalyticsMetric {
  id: string
  name: string
  value: number
  previousValue: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  target?: number
  status: 'good' | 'warning' | 'critical'
}

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  threshold: {
    warning: number
    critical: number
  }
  status: 'good' | 'warning' | 'critical'
  description: string
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  userRetention: number
  averageSessionDuration: number
  bounceRate: number
  conversionRate: number
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  browserBreakdown: {
    chrome: number
    firefox: number
    safari: number
    edge: number
    other: number
  }
  geographicBreakdown: {
    [country: string]: number
  }
}

export interface PageAnalytics {
  pageId: string
  pageName: string
  views: number
  uniqueViews: number
  averageTimeOnPage: number
  bounceRate: number
  exitRate: number
  conversionRate: number
  loadTime: number
  performanceScore: number
  lastUpdated: string
}

export function getStatusColor(status: AnalyticsMetric['status']) {
  switch (status) {
    case 'good': return 'text-primary'
    case 'warning': return 'text-warning'
    case 'critical': return 'text-destructive'
  }
}

export function getPerformanceStatusSurfaceColor(status: PerformanceMetric['status']) {
  switch (status) {
    case 'good': return 'bg-primary/10 text-primary'
    case 'warning': return 'bg-warning/20 text-warning'
    case 'critical': return 'bg-destructive/10 text-destructive'
  }
}

export function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatPercentage(num: number) {
  return `${num.toFixed(1)}%`
}
