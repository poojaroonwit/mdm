import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, RefreshCw } from 'lucide-react'

interface BusinessIntelligenceHeaderProps {
  isLoading: boolean
  selectedSpace: string
  spaces: Array<{ id: string; name: string }>
  loadDashboards: () => void
  setSelectedSpace: (spaceId: string) => void
}

export function BusinessIntelligenceHeader({
  isLoading,
  selectedSpace,
  spaces,
  loadDashboards,
  setSelectedSpace
}: BusinessIntelligenceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Business Intelligence & Reporting
        </h2>
        <p className="text-muted-foreground">
          Create dashboards, build reports, and analyze data across spaces
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedSpace} onValueChange={setSelectedSpace}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by space" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            {spaces.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadDashboards} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}
