import { BarChart3, Eye, Settings, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AnalyticsDashboardTab = 'overview' | 'performance' | 'users' | 'pages' | 'settings'

interface AnalyticsDashboardTabsProps {
  activeTab: AnalyticsDashboardTab
  setActiveTab: (tab: AnalyticsDashboardTab) => void
}

export function AnalyticsDashboardTabs({ activeTab, setActiveTab }: AnalyticsDashboardTabsProps) {
  return (
    <div className="flex space-x-1 bg-muted rounded-lg p-1">
      <Button
        variant={activeTab === 'overview' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab('overview')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Overview
      </Button>
      <Button
        variant={activeTab === 'performance' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab('performance')}
      >
        <Zap className="h-4 w-4 mr-2" />
        Performance
      </Button>
      <Button
        variant={activeTab === 'users' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab('users')}
      >
        <Users className="h-4 w-4 mr-2" />
        Users
      </Button>
      <Button
        variant={activeTab === 'pages' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab('pages')}
      >
        <Eye className="h-4 w-4 mr-2" />
        Pages
      </Button>
      <Button
        variant={activeTab === 'settings' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab('settings')}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  )
}
