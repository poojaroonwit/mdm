import { AlertCircle, Archive, Clock, Edit, Globe } from 'lucide-react'
import type { PagePublication } from './pagePublishingModel'

export function getPublishingStatusColor(status: PagePublication['status']) {
  switch (status) {
    case 'draft': return 'bg-muted text-muted-foreground'
    case 'scheduled': return 'bg-primary/10 text-primary'
    case 'published': return 'bg-primary/10 text-primary'
    case 'archived': return 'bg-warning/20 text-warning'
    case 'error': return 'bg-destructive/10 text-destructive'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function getPublishingStatusIcon(status: PagePublication['status']) {
  switch (status) {
    case 'draft': return <Edit className="h-4 w-4" />
    case 'scheduled': return <Clock className="h-4 w-4" />
    case 'published': return <Globe className="h-4 w-4" />
    case 'archived': return <Archive className="h-4 w-4" />
    case 'error': return <AlertCircle className="h-4 w-4" />
    default: return <Edit className="h-4 w-4" />
  }
}
