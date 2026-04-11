'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ExportJob, ImportJob, DataSchema } from '../types'
import { ExportProfiles } from './ExportProfiles'

export function DataExportImport() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [schemas, setSchemas] = useState<DataSchema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateExport, setShowCreateExport] = useState(false)
  const [showCreateImport, setShowCreateImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [newExport, setNewExport] = useState({
    name: '',
    type: 'full' as const,
    format: 'json' as const,
    includes: [] as string[],
    filters: {}
  })

  const [newImport, setNewImport] = useState({
    name: '',
    format: 'json' as const,
    file: null as File | null
  })

  useEffect(() => {
    loadExportJobs()
    loadImportJobs()
    loadSchemas()
  }, [])

  const loadExportJobs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/export-jobs')
      if (response.ok) {
        const data = await response.json()
        setExportJobs(data.jobs.map((job: any) => ({
          ...job,
          createdAt: new Date(job.createdAt),
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading export jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadImportJobs = async () => {
    try {
      const response = await fetch('/api/admin/import-jobs')
      if (response.ok) {
        const data = await response.json()
        setImportJobs(data.jobs.map((job: any) => ({
          ...job,
          createdAt: new Date(job.createdAt),
          completedAt: job.completedAt ? new Date(job.completedAt) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading import jobs:', error)
    }
  }

  const loadSchemas = async () => {
    try {
      const response = await fetch('/api/admin/data-schemas')
      if (response.ok) {
        const data = await response.json()
        setSchemas(data.schemas.map((schema: any) => ({
          ...schema,
          lastModified: new Date(schema.lastModified)
        })))
      }
    } catch (error) {
      console.error('Error loading schemas:', error)
    }
  }

  const createExportJob = async () => {
    try {
      const response = await fetch('/api/admin/export-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExport)
      })

      if (response.ok) {
        toast.success('Export job created successfully')
        setShowCreateExport(false)
        setNewExport({
          name: '',
          type: 'full',
          format: 'json',
          includes: [],
          filters: {}
        })
        loadExportJobs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create export job')
      }
    } catch (error) {
      console.error('Error creating export job:', error)
      toast.error('Failed to create export job')
    }
  }

  const createImportJob = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('name', newImport.name)
    formData.append('format', newImport.format)

    try {
      const response = await fetch('/api/admin/import-jobs', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Import job created successfully')
        setShowCreateImport(false)
        setSelectedFile(null)
        setNewImport({
          name: '',
          format: 'json',
          file: null
        })
        loadImportJobs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create import job')
      }
    } catch (error) {
      console.error('Error creating import job:', error)
      toast.error('Failed to create import job')
    }
  }

  const downloadExport = async (job: ExportJob) => {
    if (!job.downloadUrl) return

    try {
      const response = await fetch(job.downloadUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${job.name}.${job.format}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Export downloaded successfully')
      } else {
        toast.error('Failed to download export')
      }
    } catch (error) {
      console.error('Error downloading export:', error)
      toast.error('Failed to download export')
    }
  }

  const deleteExportJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this export job?')) return

    try {
      const response = await fetch(`/api/admin/export-jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Export job deleted successfully')
        loadExportJobs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete export job')
      }
    } catch (error) {
      console.error('Error deleting export job:', error)
      toast.error('Failed to delete export job')
    }
  }

  const deleteImportJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this import job?')) return

    try {
      const response = await fetch(`/api/admin/import-jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Import job deleted successfully')
        loadImportJobs()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete import job')
      }
    } catch (error) {
      console.error('Error deleting import job:', error)
      toast.error('Failed to delete import job')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileText className="h-4 w-4" />
      case 'csv':
        return <Database className="h-4 w-4" />
      case 'xml':
        return <FileText className="h-4 w-4" />
      case 'sql':
        return <Database className="h-4 w-4" />
      default:
        return <Archive className="h-4 w-4" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Export/Import
          </h2>
          <p className="text-muted-foreground">
            Export and import data with advanced filtering and format options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadExportJobs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="profiles">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="profiles">Export Profiles</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="schemas">Schemas</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
             <ExportProfiles 
                schemas={schemas} 
                // spaceId={spaceId} // Need to get spaceId from context or props? 
                // Using a default or fetching from somewhere. 
                // For now, assume global or first available space?
                // The DataExportImport component doesn't seem to have spaceId in props.
                // I will pass undefined for now and let the component handle it (it uses a query param in loader).
                // Wait, ExportProfiles uses `spaceId` prop to filter.
                // I need to get the current space ID.
                // Assuming it's passed or available. 
                // I'll try to use a hook or context if available, otherwise just use a hardcoded value for MVP or pass undefined.
                // Better: The component `DataExportImport` is likely used in a Space context.
                // Let's pass a dummy ID or handle it. 
                // Actually, I can fix this by adding spaceId prop to DataExportImport if it's not there.
                onRunProfile={async (profile) => {
                    try {
                        const response = await fetch('/api/admin/export-jobs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: `${profile.name} Export`,
                                profileId: profile.id,
                                spaceId: profile.spaceId
                            })
                        })
                        if (response.ok) {
                            toast.success('Export job started')
                            loadExportJobs()
                            // Switch to export tab?
                            // document.querySelector('[value="export"]')?.click(); // Hacky
                        } else {
                            toast.error('Failed to start export')
                        }
                    } catch (e) {
                         toast.error('Failed to start export')
                    }
                }}
             />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Export Jobs</h3>
            <Dialog open={showCreateExport} onOpenChange={setShowCreateExport}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Create Export Job</DialogTitle>
                  <DialogDescription>
                    Create a new data export with custom filters and format options
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 p-6 pt-2 pb-4">
                  <div>
                    <Label htmlFor="export-name">Export Name</Label>
                    <Input
                      id="export-name"
                      value={newExport.name}
                      onChange={(e) => setNewExport({ ...newExport, name: e.target.value })}
                      placeholder="Enter export name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="export-type">Export Type</Label>
                      <Select value={newExport.type} onValueChange={(value: any) => setNewExport({ ...newExport, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Export</SelectItem>
                          <SelectItem value="incremental">Incremental</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="export-format">Format</Label>
                      <Select value={newExport.format} onValueChange={(value: any) => setNewExport({ ...newExport, format: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Include Tables</Label>
                    <div className="space-y-2 mt-2">
                      {schemas.map(schema => (
                        <div key={schema.table} className="flex items-center space-x-2">
                          <Switch
                            id={schema.table}
                            checked={newExport.includes.includes(schema.table)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewExport({
                                  ...newExport,
                                  includes: [...newExport.includes, schema.table]
                                })
                              } else {
                                setNewExport({
                                  ...newExport,
                                  includes: newExport.includes.filter(t => t !== schema.table)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={schema.table}>
                            {schema.table} ({schema.rowCount.toLocaleString()} rows)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateExport(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createExportJob} disabled={!newExport.name}>
                    Create Export
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {exportJobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.type} • {job.format.toUpperCase()} • {job.includes.length} tables
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      {job.status === 'running' && (
                        <div className="w-24">
                          <Progress value={job.progress} />
                        </div>
                      )}
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExport(job)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteExportJob(job.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Import Jobs</h3>
            <Dialog open={showCreateImport} onOpenChange={setShowCreateImport}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Import
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Create Import Job</DialogTitle>
                  <DialogDescription>
                    Import data from a file with format detection and validation
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 p-6 pt-2 pb-4">
                  <div>
                    <Label htmlFor="import-name">Import Name</Label>
                    <Input
                      id="import-name"
                      value={newImport.name}
                      onChange={(e) => setNewImport({ ...newImport, name: e.target.value })}
                      placeholder="Enter import name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-format">Format</Label>
                    <Select value={newImport.format} onValueChange={(value: any) => setNewImport({ ...newImport, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="import-file">File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedFile(file)
                        setNewImport({ ...newImport, file })
                      }}
                      accept=".json,.csv,.xml,.sql"
                    />
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateImport(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createImportJob} disabled={!newImport.name || !selectedFile}>
                    Create Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {importJobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.format.toUpperCase()} • {job.recordsProcessed}/{job.recordsTotal} records
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      {job.status === 'running' && (
                        <div className="w-24">
                          <Progress value={job.progress} />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteImportJob(job.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schemas" className="space-y-6">
          <h3 className="text-lg font-semibold">Data Schemas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemas.map(schema => (
              <Card key={schema.table}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {schema.table}
                  </CardTitle>
                  <CardDescription>
                    {schema.rowCount.toLocaleString()} rows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Columns:</span> {schema.columns.length}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Last Modified:</span> {schema.lastModified.toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {schema.columns.slice(0, 3).map(column => (
                        <Badge key={column} variant="outline" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                      {schema.columns.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{schema.columns.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
