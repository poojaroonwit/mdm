export interface PagePublication {
  id: string
  pageId: string
  pageName: string
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'error'
  version: string
  publishedAt?: string
  scheduledAt?: string
  publishedBy: string
  publishedTo: string[]
  visibility: 'public' | 'private' | 'restricted'
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  analytics: {
    views: number
    uniqueViews: number
    bounceRate: number
    avgTimeOnPage: number
    lastViewed?: string
  }
  performance: {
    loadTime: number
    score: number
    issues: string[]
  }
  permissions: {
    canView: string[]
    canEdit: string[]
    canPublish: string[]
  }
}

export type PublishingTab = 'overview' | 'schedule' | 'analytics' | 'settings'
