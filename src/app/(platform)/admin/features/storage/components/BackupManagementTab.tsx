'use client'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { AlertTriangle, CheckCircle, Database, Download, RefreshCw, Trash2, Upload, XCircle, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { TaxonomyBadge } from '@/components/ui/taxonomy-badge'
import type { Backup } from '../types'

export interface BackupDraft {
  name: string
  type: 'full' | 'incremental' | 'differential'
  description: string
  includeAttachments: boolean
  includeDatabase: boolean
  includeSettings: boolean
  retentionDays: number
}

interface BackupManagementTabProps {
  backups: Backup[]
  isLoading: boolean
  showCreateBackup: boolean
  setShowCreateBackup: Dispatch<SetStateAction<boolean>>
  newBackup: BackupDraft
  setNewBackup: Dispatch<SetStateAction<BackupDraft>>
  createBackup: () => void
  downloadBackup: (backup: Backup) => void
  restoreFromBackup: (backup: Backup) => void
  deleteBackup: (backupId: string) => void
  formatBytes: (bytes: number) => string
}

function getStatusIcon(status: string): ReactNode {
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

export function BackupManagementTab({
  backups,
  isLoading,
  showCreateBackup,
  setShowCreateBackup,
  newBackup,
  setNewBackup,
  createBackup,
  downloadBackup,
  restoreFromBackup,
  deleteBackup,
  formatBytes
}: BackupManagementTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Backup Management</h3>
        <CrudDialog
          open={showCreateBackup}
          onOpenChange={setShowCreateBackup}
          title="Create New Backup"
          description="Create a manual backup of your system"
          trigger={(
            <Button className="rounded-xl font-bold">
              <Database className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          )}
          footer={(
            <>
              <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateBackup(false)}>
                Cancel
              </Button>
              <Button className="rounded-xl font-bold" onClick={createBackup} disabled={!newBackup.name}>
                Create Backup
              </Button>
            </>
          )}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Backup Name</Label>
              <Input
                className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                id="name"
                value={newBackup.name}
                onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                placeholder="Enter backup name"
              />
            </div>
            <div>
              <Label htmlFor="type">Backup Type</Label>
              <Select value={newBackup.type} onValueChange={(value) => setNewBackup({ ...newBackup, type: value as BackupDraft['type'] })}>
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
              <Input
                className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
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
        </CrudDialog>
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
                  <TaxonomyBadge taxonomy="backup" value={backup.type} />
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
    </div>
  )
}
