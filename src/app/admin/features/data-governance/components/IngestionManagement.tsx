'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  Plus,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Settings,
  Zap
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

interface IngestionPipeline {
  id: string
  name: string
  displayName?: string
  description?: string
  service: {
    id: string
    type: string
    name: string
  }
  sourceConfig: {
    config: Record<string, any>
  }
  openMetadataServerConnection: {
    config: Record<string, any>
  }
  airflowConfig?: {
    config: Record<string, any>
  }
  enabled: boolean
  status?: 'running' | 'idle' | 'failed' | 'queued'
  lastRun?: Date
  lastRunStatus?: 'success' | 'failed'
  nextRun?: Date
}

function IngestionPipelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40 mt-1" />
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-5 w-10 rounded-full mx-2" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function IngestionManagement() {
  const [pipelines, setPipelines] = useState<IngestionPipeline[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPipeline, setSelectedPipeline] = useState<IngestionPipeline | null>(null)

  const [newPipeline, setNewPipeline] = useState({
    name: '',
    displayName: '',
    description: '',
    serviceType: 'databaseService',
    serviceName: '',
    sourceType: 'mysql',
    enabled: true
  })

  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/ingestion')
      if (response.ok) {
        const data = await response.json()
        setPipelines(data.pipelines || [])
      }
    } catch (error) {
      console.error('Error loading ingestion pipelines:', error)
      toast.error('Failed to load ingestion pipelines')
    } finally {
      setIsLoading(false)
    }
  }

  const createPipeline = async () => {
    if (!newPipeline.name || !newPipeline.serviceName) {
      toast.error('Name and service are required')
      return
    }

    try {
      const response = await fetch('/api/admin/data-governance/ingestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPipeline)
      })

      if (response.ok) {
        toast.success('Ingestion pipeline created')
        setShowCreateDialog(false)
        setNewPipeline({
          name: '',
          displayName: '',
          description: '',
          serviceType: 'databaseService',
          serviceName: '',
          sourceType: 'mysql',
          enabled: true
        })
        loadPipelines()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create pipeline')
      }
    } catch (error) {
      console.error('Error creating pipeline:', error)
      toast.error('Failed to create pipeline')
    }
  }

  const togglePipeline = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/data-governance/ingestion/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        toast.success(`Pipeline ${enabled ? 'enabled' : 'disabled'}`)
        loadPipelines()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update pipeline')
      }
    } catch (error) {
      console.error('Error updating pipeline:', error)
      toast.error('Failed to update pipeline')
    }
  }

  const triggerPipeline = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/data-governance/ingestion/${id}/trigger`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Pipeline execution started')
        loadPipelines()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to trigger pipeline')
      }
    } catch (error) {
      console.error('Error triggering pipeline:', error)
      toast.error('Failed to trigger pipeline')
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'idle':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Ingestion Pipelines
          </h2>
          <p className="text-muted-foreground">
            Manage metadata ingestion from various data sources
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {isLoading && pipelines.length === 0 ? (
        <IngestionPipelineSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pipeline.displayName || pipeline.name}</CardTitle>
                {getStatusIcon(pipeline.status)}
              </div>
              {pipeline.description && (
                <CardDescription>{pipeline.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service:</span>
                  <Badge variant="outline">{pipeline.service.name}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={pipeline.enabled ? 'default' : 'secondary'}>
                    {pipeline.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {pipeline.lastRun && (
                  <div className="text-sm text-muted-foreground">
                    Last run: {new Date(pipeline.lastRun).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => triggerPipeline(pipeline.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                  <Switch
                    checked={pipeline.enabled}
                    onCheckedChange={(checked) => togglePipeline(pipeline.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPipeline(pipeline)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {!isLoading && pipelines.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No ingestion pipelines configured</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Pipeline
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Ingestion Pipeline</DialogTitle>
            <DialogDescription>
              Configure a new metadata ingestion pipeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline({ ...newPipeline, name: e.target.value })}
                placeholder="my-ingestion-pipeline"
              />
            </div>
            <div>
              <Label htmlFor="pipeline-display-name">Display Name</Label>
              <Input
                id="pipeline-display-name"
                value={newPipeline.displayName}
                onChange={(e) => setNewPipeline({ ...newPipeline, displayName: e.target.value })}
                placeholder="My Ingestion Pipeline"
              />
            </div>
            <div>
              <Label htmlFor="pipeline-description">Description</Label>
              <Textarea
                id="pipeline-description"
                value={newPipeline.description}
                onChange={(e) => setNewPipeline({ ...newPipeline, description: e.target.value })}
                placeholder="Describe the purpose of this pipeline"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-type">Service Type</Label>
                <Select
                  value={newPipeline.serviceType}
                  onValueChange={(value) => setNewPipeline({ ...newPipeline, serviceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="databaseService">Database Service</SelectItem>
                    <SelectItem value="dashboardService">Dashboard Service</SelectItem>
                    <SelectItem value="pipelineService">Pipeline Service</SelectItem>
                    <SelectItem value="messagingService">Messaging Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source-type">Source Type</Label>
                <Select
                  value={newPipeline.sourceType}
                  onValueChange={(value) => setNewPipeline({ ...newPipeline, sourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="snowflake">Snowflake</SelectItem>
                    <SelectItem value="bigquery">BigQuery</SelectItem>
                    <SelectItem value="redshift">Redshift</SelectItem>
                    <SelectItem value="mssql">MSSQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="service-name">Service Name (FQN)</Label>
              <Input
                id="service-name"
                value={newPipeline.serviceName}
                onChange={(e) => setNewPipeline({ ...newPipeline, serviceName: e.target.value })}
                placeholder="database.service.name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newPipeline.enabled}
                onCheckedChange={(checked) => setNewPipeline({ ...newPipeline, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable Pipeline</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createPipeline}>Create Pipeline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

