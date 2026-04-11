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
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Calendar,
  Play,
  Pause,
  Trash2,
  Eye,
  Shield,
  Archive,
  Cloud,
  Server,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Backup, BackupSchedule, RestorePoint } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export function BackupRecovery() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [showCreateBackup, setShowCreateBackup] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [isRestoring, setIsRestoring] = useState(false)

  const [newBackup, setNewBackup] = useState({
    name: '',
    type: 'full' as const,
    description: '',
    includeAttachments: true,
    includeDatabase: true,
    includeSettings: true,
    retentionDays: 30
  })

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    frequency: 'daily' as const,
    time: '02:00',
    type: 'incremental' as const,
    retentionDays: 30,
    includeAttachments: true,
    includeDatabase: true,
    includeSettings: true
  })

  useEffect(() => {
    loadBackups()
    loadSchedules()
    loadRestorePoints()
  }, [])

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups.map((backup: any) => ({
          ...backup,
          createdAt: new Date(backup.createdAt),
          completedAt: backup.completedAt ? new Date(backup.completedAt) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/admin/backup-schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules.map((schedule: any) => ({
          ...schedule,
          lastRun: schedule.lastRun ? new Date(schedule.lastRun) : undefined,
          nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  const loadRestorePoints = async () => {
    try {
      const response = await fetch('/api/admin/restore-points')
      if (response.ok) {
        const data = await response.json()
        setRestorePoints(data.restorePoints.map((point: any) => ({
          ...point,
          timestamp: new Date(point.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading restore points:', error)
    }
  }

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBackup)
      })

      if (response.ok) {
        toast.success('Backup created successfully')
        setShowCreateBackup(false)
        setNewBackup({
          name: '',
          type: 'full',
          description: '',
          includeAttachments: true,
          includeDatabase: true,
          includeSettings: true,
          retentionDays: 30
        })
        loadBackups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    }
  }

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/admin/backup-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })

      if (response.ok) {
        toast.success('Schedule created successfully')
        setShowCreateSchedule(false)
        setNewSchedule({
          name: '',
          frequency: 'daily',
          time: '02:00',
          type: 'incremental',
          retentionDays: 30,
          includeAttachments: true,
          includeDatabase: true,
          includeSettings: true
        })
        loadSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule')
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${backup.name}.backup`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Backup download started')
      } else {
        toast.error('Failed to download backup')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return

    try {
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Backup deleted successfully')
        loadBackups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete backup')
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Failed to delete backup')
    }
  }

  const restoreFromBackup = async (backup: Backup) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) return

    setIsRestoring(true)
    setRestoreProgress(0)
    
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/restore`, {
        method: 'POST'
      })

      if (response.ok) {
        // Simulate progress
        const interval = setInterval(() => {
          setRestoreProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsRestoring(false)
              toast.success('Restore completed successfully')
              return 100
            }
            return prev + 10
          })
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to restore backup')
        setIsRestoring(false)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Failed to restore backup')
      setIsRestoring(false)
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
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-blue-100 text-blue-800'
      case 'incremental':
        return 'bg-green-100 text-green-800'
      case 'differential':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            Backup & Recovery
          </h2>
          <p className="text-muted-foreground">
            Data protection, automated backups, and disaster recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="backups">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup Management</h3>
            <Dialog open={showCreateBackup} onOpenChange={setShowCreateBackup}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold">
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Create New Backup</DialogTitle>
                  <DialogDescription>
                    Create a manual backup of your system
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="p-6 pt-2 pb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Backup Name</Label>
                      <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                        id="name"
                        value={newBackup.name}
                        onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                        placeholder="Enter backup name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Backup Type</Label>
                      <Select value={newBackup.type} onValueChange={(value: any) => setNewBackup({ ...newBackup, type: value })}>
                        <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="full">Full Backup</SelectItem>
                          <SelectItem value="incremental">Incremental</SelectItem>
                          <SelectItem value="differential">Differential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                        id="description"
                        value={newBackup.description}
                        onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Include in Backup</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="database"
                            checked={newBackup.includeDatabase}
                            onCheckedChange={(checked) => setNewBackup({ ...newBackup, includeDatabase: checked })}
                          />
                          <Label htmlFor="database">Database</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="attachments"
                            checked={newBackup.includeAttachments}
                            onCheckedChange={(checked) => setNewBackup({ ...newBackup, includeAttachments: checked })}
                          />
                          <Label htmlFor="attachments">Attachments</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="settings"
                            checked={newBackup.includeSettings}
                            onCheckedChange={(checked) => setNewBackup({ ...newBackup, includeSettings: checked })}
                          />
                          <Label htmlFor="settings">Settings</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="p-6 pt-2">
                  <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateBackup(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl font-bold" onClick={createBackup} disabled={!newBackup.name}>
                    Create Backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full space-y-3 p-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : backups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No backups found</h3>
                <p className="text-muted-foreground">
                  Create your first backup to protect your data
                </p>
              </div>
            ) : (
              backups.map(backup => (
                <Card key={backup.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{backup.name}</CardTitle>
                      {getStatusIcon(backup.status)}
                    </div>
                    <CardDescription>{backup.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Type:</span>
                      <Badge className={getTypeColor(backup.type)}>
                        {backup.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Size:</span>
                      <span>{formatBytes(backup.size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Created:</span>
                      <span>{new Date(backup.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(backup)}
                        disabled={backup.status !== 'completed'}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreFromBackup(backup)}
                        disabled={backup.status !== 'completed'}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBackup(backup.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup Schedules</h3>
            <Dialog open={showCreateSchedule} onOpenChange={setShowCreateSchedule}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Create Backup Schedule</DialogTitle>
                  <DialogDescription>
                    Set up automated backup schedules
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="p-6 pt-2 pb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="schedule-name">Schedule Name</Label>
                      <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                        id="schedule-name"
                        value={newSchedule.name}
                        onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                        placeholder="Enter schedule name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select value={newSchedule.frequency} onValueChange={(value: any) => setNewSchedule({ ...newSchedule, frequency: value })}>
                          <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                          id="time"
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="schedule-type">Backup Type</Label>
                      <Select value={newSchedule.type} onValueChange={(value: any) => setNewSchedule({ ...newSchedule, type: value })}>
                        <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="full">Full Backup</SelectItem>
                          <SelectItem value="incremental">Incremental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="p-6 pt-2">
                  <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateSchedule(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl font-bold" onClick={createSchedule} disabled={!newSchedule.name}>
                    Create Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{schedule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {schedule.frequency} at {schedule.time} • {schedule.type} backup
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={schedule.isActive} />
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <h3 className="text-lg font-semibold">Restore Points</h3>
          <div className="space-y-4">
            {restorePoints.map(point => (
              <Card key={point.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{point.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {point.timestamp.toLocaleString()} • {formatBytes(point.size)}
                      </p>
                    </div>
                    <Button onClick={() => restoreFromBackup(point as any)}>
                      <Play className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-lg font-semibold">Backup Settings</h3>
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>
                Configure backup storage locations and encryption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Storage Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">AWS S3</SelectItem>
                    <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="encryption" />
                <Label htmlFor="encryption">Enable backup encryption</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="compression" />
                <Label htmlFor="compression">Enable backup compression</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Restore Progress */}
      {isRestoring && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Restoring backup...</span>
                <span className="text-sm text-muted-foreground">{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
