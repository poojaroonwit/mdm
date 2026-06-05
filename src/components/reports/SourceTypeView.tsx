'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  BarChart3,
  Power,
  Activity,
  Eye,
  ExternalLink,
  ChevronRight,
  Settings
} from 'lucide-react'
import type { Report, ReportSource } from '@/types/reports'

interface SourceTypeViewProps {
  reports: Report[]
  loading: boolean
  onSourceClick: (source: string) => void
}

const SOURCE_TYPES: Array<{
  id: ReportSource
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = [
  {
    id: 'BUILT_IN',
    name: 'Built-in Visualization',
    description: 'Reports created using the built-in visualization service',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  {
    id: 'POWER_BI',
    name: 'Power BI',
    description: 'Reports from Microsoft Power BI (API, SDK, or embed links)',
    icon: Power,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  {
    id: 'GRAFANA',
    name: 'Grafana',
    description: 'Dashboards from Grafana (SDK or embed links)',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  {
    id: 'LOOKER_STUDIO',
    name: 'Looker Studio',
    description: 'Reports from Google Looker Studio (API)',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  }
]

export function SourceTypeView({
  reports,
  loading,
  onSourceClick
}: SourceTypeViewProps) {
  const getReportCount = (source: ReportSource) => {
    return reports.filter(r => r.source === source).length
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading source types...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {SOURCE_TYPES.map((source) => {
        const Icon = source.icon
        const count = getReportCount(source.id)
        const isConfigured = count > 0

        return (
          <Card 
            key={source.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSourceClick(source.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${source.bgColor}`}>
                  <Icon className={`h-6 w-6 ${source.color}`} />
                </div>
                <StatusBadge
                  status={isConfigured ? 'configured' : 'not-configured'}
                  label={`${count} ${count === 1 ? 'report' : 'reports'}`}
                />
              </div>
              <CardTitle className="mt-4">{source.name}</CardTitle>
              <CardDescription>{source.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSourceClick(source.id)
                  }}
                >
                  View Reports
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                {source.id !== 'BUILT_IN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `/reports/integrations?source=${source.id.toLowerCase().replace('_', '-')}`
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

