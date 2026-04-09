'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  BarChart3,
  Settings,
  Users,
  FileText,
  Cloud,
  Table,
  ArrowLeft,
  Database as DatabaseIcon,
  Code,
  Server,
  Key,
  Monitor,
  Paperclip,
  Bell,
  Palette,
  Activity,
  Heart,
  FileText as FileTextIcon,
  Zap,
  HardDrive,
  BarChart3 as BarChart3Icon,
  Bot,
  MessageCircle,
  Layout,
  BookOpen,
  Building2,
  Kanban,
  TestTube,
  Clock,
  X,
  Trash2,
  History
} from 'lucide-react'
import { addRecentItem, getRecentItems, clearRecentItems, getRelativeTimeString, type RecentItem } from '@/lib/recent-items'
import { usePageTracking } from '@/hooks/usePageTracking'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { BigQueryInterface } from './admin/features/business-intelligence'
import { OutlineKnowledgeBase } from '@plugins/knowledge-base/src/components/OutlineKnowledgeBase'
import { MarketplaceHome } from '@/features/marketplace'
import { InfrastructureOverview } from '@/features/infrastructure'
import { NotificationCenter } from './admin/features/system'
import { SecurityFeatures } from './admin/features/security'
import { DatabaseManagement } from './admin/features/data'
import { CacheManagement, StorageManagement } from './admin/features/storage'
import { SpaceSelection, SpaceLayoutsAdmin } from './admin/features/spaces'
import { AIAnalyst, AIChatUI, KernelManagement } from './admin/features/business-intelligence'
import { DataModelManagement } from './admin/features/data'
import { SpaceSettingsAdmin } from './admin/features/spaces'
import { ChangeRequests } from './admin/features/content'
import { SQLLinting, SchemaMigrations, DataMasking } from './admin/features/data'
import { ProjectsManagement } from './admin/features/content'
import { DataGovernance } from './admin/features/data-governance'
import { QuickLinksSection } from '@/components/quick-links/QuickLinksSection'

// Map tab IDs to their new route paths
const getRouteForTab = (tab: string): string => {
  const routeMap: Record<string, string> = {
    'overview': '/',
    'bigquery': '/tools/bigquery',
    'notebook': '/tools/notebook',
    'ai-analyst': '/tools/ai-analyst',
    'ai-chat-ui': '/tools/ai-chat-ui',
    'knowledge-base': '/knowledge',
    'marketplace': '/marketplace',
    'infrastructure': '/infrastructure',
    'projects': '/tools/projects',
    'bi': '/tools/bi',
    'storage': '/tools/storage',
    'data-governance': '/tools/data-governance',
    'users': '/system/users',
    'roles': '/system/roles',
    'permission-tester': '/system/permission-tester',
    'space-layouts': '/system/space-layouts',
    'space-settings': '/system/space-settings',
    'assets': '/system/assets',
    'data': '/system/data',
    'attachments': '/system/attachments',
    'kernels': '/system/kernels',
    'logs': '/system/logs',
    'audit': '/system/audit',
    'database': '/system/database',
    'change-requests': '/system/change-requests',
    'sql-linting': '/system/sql-linting',
    'schema-migrations': '/system/schema-migrations',
    'data-masking': '/system/data-masking',
    'cache': '/system/cache',
    'backup': '/system/backup',
    'security': '/system/security',
    'settings': '/system/settings',
    'page-templates': '/system/page-templates',
    'notifications': '/system/notifications',

    'api': '/system/api',
    'space-selection': '/admin/space-selection',
  }
  return routeMap[tab] || '/'
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  // Auto-track page navigation
  usePageTracking()

  useEffect(() => {
    // Add error boundary for client-side errors
    const handleError = (event: ErrorEvent) => {
      console.error('Admin page error:', event.error)
      setError(event.error?.message || 'An error occurred')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Redirect old query parameter URLs to new route structure
  useEffect(() => {
    const urlTab = searchParams?.get('tab')
    if (urlTab && pathname === '/') {
      const newRoute = getRouteForTab(urlTab)
      if (newRoute !== '/') {
        router.replace(newRoute)
        return
      }
    }
  }, [searchParams, pathname, router])

  // Load recent items (show up to 12)
  useEffect(() => {
    setRecentItems(getRecentItems(12))
  }, [])

  // Refresh recent items when pathname changes
  useEffect(() => {
    setRecentItems(getRecentItems(12))
  }, [pathname])

  // Track tab changes as recent items
  useEffect(() => {
    if (activeTab && activeTab !== 'overview') {
      const tabConfig = {
        bigquery: { name: 'SQL Query', icon: 'Database', color: '#2563eb' },
        notebook: { name: 'Data Science Notebooks', icon: 'BarChart3', color: '#16a34a' },
        'ai-analyst': { name: 'Chat with AI', icon: 'MessageCircle', color: '#9333ea' },
        'ai-chat-ui': { name: 'Agent Embed GUI', icon: 'Bot', color: '#10b981' },
        'knowledge-base': { name: 'Knowledge Base', icon: 'BookOpen', color: '#14b8a6' },
        'space-layouts': { name: 'Space Layouts', icon: 'Layout', color: '#4f46e5' },
        'space-settings': { name: 'Space Settings', icon: 'Building2', color: '#0891b2' },
        settings: { name: 'System Settings', icon: 'Settings', color: '#6b7280' },
        'data-governance': { name: 'Data Governance', icon: 'Shield', color: '#059669' },
      }[activeTab]

      if (tabConfig) {
        const route = getRouteForTab(activeTab)
        addRecentItem({
          id: activeTab,
          type: 'tool',
          name: tabConfig.name,
          tabId: activeTab,
          url: route,
          icon: tabConfig.icon,
          color: tabConfig.color,
        })
        // Refresh recent items
        setRecentItems(getRecentItems(8))
      }
    }
  }, [activeTab])

  // Sync activeTab with URL (?tab=...) - only for homepage
  useEffect(() => {
    if (pathname === '/') {
      const urlTab = searchParams?.get('tab')
      if (urlTab && urlTab !== activeTab) {
        setActiveTab(urlTab)
      } else if (!urlTab) {
        setActiveTab('overview')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname])

  const handleTabChange = (tab: string) => {
    const route = getRouteForTab(tab)
    if (route === '/') {
      // For homepage, use query parameter
      setActiveTab(tab)
      const params = new URLSearchParams(Array.from(searchParams?.entries?.() || []))
      params.set('tab', tab)
      router.replace(`?${params.toString()}`)
    } else {
      // For other routes, navigate to the new route
      router.push(route)
    }
  }

  const handleRecentItemClick = (item: RecentItem) => {
    if (item.url) {
      router.push(item.url)
    } else if (item.tabId) {
      handleTabChange(item.tabId)
    }
  }

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      Database,
      BarChart3,
      Bot,
      MessageCircle,
      BookOpen,
      Layout,
      Paperclip,
      Users,
      Building2,
      Settings,
      Monitor,
      Kanban,
    }
    return iconMap[iconName || 'Monitor'] || Monitor
  }

  const handleBackToSpaces = () => {
    router.push('/spaces')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error loading Unified Data Platform</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button variant="outline" onClick={handleBackToSpaces}>
              Back to Spaces
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      <div>
        {/* Homepage Content */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Recent Pages Section - Enhanced */}
            {recentItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Recent Pages</h2>
                    <span className="text-sm text-muted-foreground">({recentItems.length})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearRecentItems()
                      setRecentItems([])
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {recentItems.map((item) => {
                    const IconComponent = getIconComponent(item.icon)
                    return (
                      <div
                        role="button"
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleRecentItemClick(item)}
                        className="flex flex-col items-start gap-2 p-3 rounded-lg border hover:bg-accent hover:border-accent-foreground/20 transition-all group min-h-[100px] h-full cursor-pointer"
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div
                            className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm transition-all group-hover:scale-110"
                            style={{
                              backgroundColor: item.color || '#6b7280',
                            }}
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="w-full text-left">
                          <p className="text-sm font-medium text-foreground truncate w-full group-hover:text-accent-foreground transition-colors">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getRelativeTimeString(item.accessedAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Data Platform Collection Section */}
            <QuickLinksSection />


          </div>
        )
        }
        {activeTab === 'bi' && <BigQueryInterface />}
        {activeTab === 'space-selection' && <SpaceSelection />}
        {activeTab === 'bigquery' && <BigQueryInterface />}
        {activeTab === 'ai-analyst' && <AIAnalyst />}
        {activeTab === 'ai-chat-ui' && <AIChatUI />}
        {activeTab === 'knowledge-base' && <OutlineKnowledgeBase />}
        {
          activeTab === 'marketplace' && (
            <MarketplaceHome
              spaceId={selectedSpace || undefined}
              showSpaceSelector={true}
            />
          )
        }
        {
          activeTab === 'infrastructure' && (
            <InfrastructureOverview
              spaceId={selectedSpace || undefined}
              showSpaceSelector={true}
            />
          )
        }

        {activeTab === 'data-governance' && <DataGovernance />}
      </div >
    </PlatformLayout >
  )
}
