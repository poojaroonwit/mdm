import type { ReactNode } from 'react'
import { BarChart3, Calendar as CalendarIcon, Clock, Edit, Eye, Globe, Settings, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PagePublication, PublishingTab } from './pagePublishingModel'

interface PagePublishingSummaryTabsProps {
  activeTab: PublishingTab
  publications: PagePublication[]
  setActiveTab: (tab: PublishingTab) => void
}

export function PagePublishingSummaryTabs({ activeTab, publications, setActiveTab }: PagePublishingSummaryTabsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Globe className="h-5 w-5 text-primary" />}
          value={publications.filter(p => p.status === 'published').length}
          label="Published"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-primary" />}
          value={publications.filter(p => p.status === 'scheduled').length}
          label="Scheduled"
        />
        <SummaryCard
          icon={<Edit className="h-5 w-5 text-muted-foreground" />}
          value={publications.filter(p => p.status === 'draft').length}
          label="Drafts"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          value={publications.reduce((sum, p) => sum + p.analytics.views, 0)}
          label="Total Views"
        />
      </div>

      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
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
    </>
  )
}

function SummaryCard({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
