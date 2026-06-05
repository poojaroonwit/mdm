'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  Square,
  Clock,
  HardDrive,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  RefreshCw,
  Archive,
  Cloud,
  Server
} from 'lucide-react'
import { useSpacePermissions } from '@/hooks/use-space-permissions'

interface BackupJob {
  id: string
  name: string
  description: string
  type: 'full' | 'incremental' | 'differential'
  schedule: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused'
  lastRun?: Date
  nextRun?: Date
  retention: number // days
  compression: boolean
  encryption: boolean
  includeData: boolean
  includeSchema: boolean
  includeUsers: boolean
  created_at: Date
  updated_at: Date
}

interface BackupFile {
  id: string
  name: string
  size: number
  type: 'full' | 'incremental' | 'differential'
  created_at: Date
  expires_at: Date
  status: 'available' | 'expired' | 'corrupted'
  checksum: string
  location: 'local' | 'cloud' | 'remote'
}

interface RecoveryJob {
  id: string
  name: string
  backup_file_id: string
  target_space: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at?: Date
  completed_at?: Date
  progress: number
  error_message?: string
}

interface BackupRecoverySystemProps {
  spaceId: string
}

const BACKUP_TYPES = [
  {
    type: 'full',
    name: 'Full Backup',
    description: 'Complete backup of all data and schema',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-blue-500',
    estimatedTime: '2-4 hours'
  },
  {
    type: 'incremental',
    name: 'Incremental Backup',
    description: 'Backup only changes since last backup',
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'bg-green-500',
    estimatedTime: '15-30 minutes'
  },
  {
    type: 'differential',
    name: 'Differential Backup',
    description: 'Backup changes since last full backup',
    icon: <Archive className="h-5 w-5" />,
    color: 'bg-purple-500',
    estimatedTime: '30-60 minutes'
  }
]

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual Only', description: 'Run backups manually' },
  { value: 'hourly', label: 'Hourly', description: 'Every hour' },
  { value: 'daily', label: 'Daily', description: 'Every day at specified time' },
  { value: 'weekly', label: 'Weekly', description: 'Every week on specified day' },
  { value: 'monthly', label: 'Monthly', description: 'Every month on specified day' }
]

export function BackupRecoverySystem({ spaceId }: BackupRecoverySystemProps) {
  const permissions = useSpacePermissions()
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([])
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [recoveryJobs, setRecoveryJobs] = useState<RecoveryJob[]>([])
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    type: 'full' as string,
    schedule: 'manual' as string,
    retention: 30,
    compression: true,
    encryption: false,
    includeData: true,
    includeSchema: true,
    includeUsers: false
  })

  const canCreateBackup = permissions.canCreate
  const canEditBackup = permissions.canEdit
  const canDeleteBackup = permissions.canDelete

  const createBackupJob = () => {
    if (!newJob.name.trim()) return

    const job: BackupJob = {
      id: `backup_${Date.now()}`,
      name: newJob.name,
      description: newJob.description,
      type: newJob.type as any,
      schedule: newJob.schedule as any,
      status: 'idle',
      retention: newJob.retention,
      compression: newJob.compression,
      encryption: newJob.encryption,
      includeData: newJob.includeData,
      includeSchema: newJob.includeSchema,
      includeUsers: newJob.includeUsers,
      created_at: new Date(),
      updated_at: new Date()
    }

    setBackupJobs(prev => [...prev, job])
    setSelectedJob(job)
    setShowCreateDialog(false)
    setNewJob({
      name: '',
      description: '',
      type: 'full',
      schedule: 'manual',
      retention: 30,
      compression: true,
      encryption: false,
      includeData: true,
      includeSchema: true,
      includeUsers: false
    })
  }

  const updateBackupJob = (id: string, updates: Partial<BackupJob>) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates, updated_at: new Date() } : job
    ))
    if (selectedJob?.id === id) {
      setSelectedJob(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteBackupJob = (id: string) => {
    setBackupJobs(prev => prev.filter(job => job.id !== id))
    if (selectedJob?.id === id) {
      setSelectedJob(null)
    }
  }

  const runBackup = async (jobId: string) => {
    setIsBackingUp(true)
    setBackupProgress(0)

    try {
      // Simulate backup process
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsBackingUp(false)
            updateBackupJob(jobId, { 
              status: 'completed', 
              lastRun: new Date() 
            })
            return 100
          }
          return prev + 10
        })
      }, 500)

      updateBackupJob(jobId, { status: 'running' })
    } catch (error) {
      setIsBackingUp(false)
      updateBackupJob(jobId, { status: 'failed' })
    }
  }

  const startRecovery = async (backupFileId: string) => {
    const recoveryJob: RecoveryJob = {
      id: `recovery_${Date.now()}`,
      name: `Recovery from ${backupFileId}`,
      backup_file_id: backupFileId,
      target_space: spaceId,
      status: 'running',
      started_at: new Date(),
      progress: 0
    }

    setRecoveryJobs(prev => [...prev, recoveryJob])

    // Simulate recovery process
    const interval = setInterval(() => {
      setRecoveryJobs(prev => prev.map(job => {
        if (job.id === recoveryJob.id) {
          const newProgress = job.progress + 10
          if (newProgress >= 100) {
            clearInterval(interval)
            return {
              ...job,
              status: 'completed',
              completed_at: new Date(),
              progress: 100
            }
          }
          return { ...job, progress: newProgress }
        }
        return job
      }))
    }, 1000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
      case 'corrupted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getBackupTypeInfo = (type: string) => {
    return BACKUP_TYPES.find(t => t.type === type) || BACKUP_TYPES[0]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup & Recovery</h2>
          <p className="text-muted-foreground">
            Manage data backups and recovery operations
          </p>
        </div>
        {canCreateBackup && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Create Backup Job
          </Button>
        )}
      </div>

      <div className="w-full">
      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Backup Jobs</TabsTrigger>
          <TabsTrigger value="files">Backup Files</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backupJobs.map((job) => {
              const typeInfo = getBackupTypeInfo(job.type)
              
              return (
                <Card 
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{job.name}</CardTitle>
                          <CardDescription>{job.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <StatusBadge status={job.status} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Type:</span>
                        <span className="font-medium">{typeInfo.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Schedule:</span>
                        <span className="font-medium capitalize">{job.schedule}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Retention:</span>
                        <span className="font-medium">{job.retention} days</span>
                      </div>
                      {job.lastRun && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Last Run:</span>
                          <span>{job.lastRun.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {canEditBackup && (
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteBackup && (
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            runBackup(job.id)
                          }}
                          disabled={job.status === 'running'}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedJob.name}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedJob.status} />
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{selectedJob.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                <Tabs defaultValue="config">
                  <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job-name">Job Name</Label>
                        <Input
                          id="job-name"
                          value={selectedJob.name}
                          onChange={(e) => updateBackupJob(selectedJob.id, { name: e.target.value })}
                          disabled={!canEditBackup}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-type">Backup Type</Label>
                        <Select
                          value={selectedJob.type}
                          onValueChange={(type) => updateBackupJob(selectedJob.id, { type: type as any })}
                        >
                          <SelectTrigger disabled={!canEditBackup}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKUP_TYPES.map((type) => (
                              <SelectItem key={type.type} value={type.type}>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded ${type.color} text-white text-xs`}>
                                    {type.icon}
                                  </div>
                                  <div>
                                    <div className="font-medium">{type.name}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job-description">Description</Label>
                      <Textarea
                        id="job-description"
                        value={selectedJob.description}
                        onChange={(e) => updateBackupJob(selectedJob.id, { description: e.target.value })}
                        disabled={!canEditBackup}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job-schedule">Schedule</Label>
                        <Select
                          value={selectedJob.schedule}
                          onValueChange={(schedule) => updateBackupJob(selectedJob.id, { schedule: schedule as any })}
                        >
                          <SelectTrigger disabled={!canEditBackup}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEDULE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job-retention">Retention (days)</Label>
                        <Input
                          id="job-retention"
                          type="number"
                          value={selectedJob.retention}
                          onChange={(e) => updateBackupJob(selectedJob.id, { retention: parseInt(e.target.value) || 30 })}
                          disabled={!canEditBackup}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="options" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Backup Options</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="compression">Compression</Label>
                            <p className="text-sm text-muted-foreground">
                              Compress backup files to save space
                            </p>
                          </div>
                          <Switch
                            id="compression"
                            checked={selectedJob.compression}
                            onCheckedChange={(compression) => updateBackupJob(selectedJob.id, { compression })}
                            disabled={!canEditBackup}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="encryption">Encryption</Label>
                            <p className="text-sm text-muted-foreground">
                              Encrypt backup files for security
                            </p>
                          </div>
                          <Switch
                            id="encryption"
                            checked={selectedJob.encryption}
                            onCheckedChange={(encryption) => updateBackupJob(selectedJob.id, { encryption })}
                            disabled={!canEditBackup}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="include-data">Include Data</Label>
                            <p className="text-sm text-muted-foreground">
                              Include actual data records in backup
                            </p>
                          </div>
                          <Switch
                            id="include-data"
                            checked={selectedJob.includeData}
                            onCheckedChange={(includeData) => updateBackupJob(selectedJob.id, { includeData })}
                            disabled={!canEditBackup}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="include-schema">Include Schema</Label>
                            <p className="text-sm text-muted-foreground">
                              Include database schema in backup
                            </p>
                          </div>
                          <Switch
                            id="include-schema"
                            checked={selectedJob.includeSchema}
                            onCheckedChange={(includeSchema) => updateBackupJob(selectedJob.id, { includeSchema })}
                            disabled={!canEditBackup}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="include-users">Include Users</Label>
                            <p className="text-sm text-muted-foreground">
                              Include user accounts and permissions
                            </p>
                          </div>
                          <Switch
                            id="include-users"
                            checked={selectedJob.includeUsers}
                            onCheckedChange={(includeUsers) => updateBackupJob(selectedJob.id, { includeUsers })}
                            disabled={!canEditBackup}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="space-y-3">
            {backupFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.created_at.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={file.status} />
                      <Badge variant="outline">
                        {file.type}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <div className="space-y-3">
            {recoveryJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Started: {job.started_at?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} />
                      <div className="w-20">
                        <Progress value={job.progress} />
                      </div>
                    </div>
                  </div>
                  {job.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                      {job.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Backup settings will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {isBackingUp && (
        <Card className="fixed bottom-4 right-4 w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Backup in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={backupProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {backupProgress}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {showCreateDialog && (
        <Card className="fixed inset-0 z-50 m-4 max-w-2xl">
          <CardHeader>
            <CardTitle>Create Backup Job</CardTitle>
            <CardDescription>
              Set up a new automated backup job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-job-name">Job Name</Label>
                <Input
                  id="new-job-name"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  placeholder="Enter job name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-job-type">Backup Type</Label>
                <Select
                  value={newJob.type}
                  onValueChange={(type) => setNewJob({ ...newJob, type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKUP_TYPES.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${type.color} text-white text-xs`}>
                            {type.icon}
                          </div>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-job-description">Description</Label>
              <Textarea
                id="new-job-description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Enter job description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-job-schedule">Schedule</Label>
                <Select
                  value={newJob.schedule}
                  onValueChange={(schedule) => setNewJob({ ...newJob, schedule })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-job-retention">Retention (days)</Label>
                <Input
                  id="new-job-retention"
                  type="number"
                  value={newJob.retention}
                  onChange={(e) => setNewJob({ ...newJob, retention: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createBackupJob} 
                disabled={!newJob.name.trim()}
              >
                Create Backup Job
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
