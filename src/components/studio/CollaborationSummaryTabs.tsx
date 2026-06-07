import type { ReactNode } from 'react'
import { Activity, AlertCircle, MessageCircle, Settings, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CollaborationTab } from './collaborationModel'

interface CollaborationSummaryTabsProps {
  activeTab: CollaborationTab
  commentsCount: number
  onlineCount: number
  totalCollaborators: number
  unreadComments: number
  setActiveTab: (tab: CollaborationTab) => void
}

export function CollaborationSummaryTabs({
  activeTab,
  commentsCount,
  onlineCount,
  totalCollaborators,
  unreadComments,
  setActiveTab,
}: CollaborationSummaryTabsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="h-5 w-5 text-primary" />} value={totalCollaborators} label="Total Collaborators" />
        <SummaryCard icon={<Activity className="h-5 w-5 text-primary" />} value={onlineCount} label="Online Now" />
        <SummaryCard icon={<MessageCircle className="h-5 w-5 text-primary" />} value={commentsCount} label="Comments" />
        <SummaryCard icon={<AlertCircle className="h-5 w-5 text-warning" />} value={unreadComments} label="Unresolved" />
      </div>

      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'collaborators' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('collaborators')}
        >
          <Users className="h-4 w-4 mr-2" />
          Collaborators
        </Button>
        <Button
          variant={activeTab === 'comments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('comments')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Comments
          {unreadComments > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadComments}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'activity' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('activity')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Activity
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
