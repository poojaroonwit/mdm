'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserSyncSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSyncSettingsDialog({
  open,
  onOpenChange,
}: UserSyncSettingsDialogProps) {
  const [syncSchedule, setSyncSchedule] = useState({ enabled: false, frequency: 'daily', time: '00:00' })
  const [savingSyncSettings, setSavingSyncSettings] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadSyncSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/ad-sync-schedule')
        if (response.ok) {
          const data = await response.json()
          setSyncSchedule({
            enabled: data.enabled ?? false,
            frequency: data.frequency || 'daily',
            time: data.time || '00:00',
          })
        }
      } catch (error) {
        console.error(error)
      }
    }

    loadSyncSettings()
  }, [open])

  const saveSyncSettings = async () => {
    setSavingSyncSettings(true)
    try {
      const response = await fetch('/api/admin/settings/ad-sync-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncSchedule),
      })
      if (response.ok) {
        toast.success('Sync schedule saved')
        onOpenChange(false)
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Error saving settings')
    } finally {
      setSavingSyncSettings(false)
    }
  }

  return (
    <CrudDialog
      open={open}
      onOpenChange={onOpenChange}
      title="AD Sync Settings"
      description="Configure automatic synchronization with Azure AD."
      bodyClassName="space-y-4"
      footer={(
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={saveSyncSettings} disabled={savingSyncSettings}>
            {savingSyncSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </>
      )}
    >
      <div className="flex items-center justify-between">
        <Label>Enable Automatic Sync</Label>
        <Switch
          checked={syncSchedule.enabled}
          onCheckedChange={(enabled) => setSyncSchedule({ ...syncSchedule, enabled })}
        />
      </div>
      {syncSchedule.enabled && (
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={syncSchedule.frequency}
            onValueChange={(frequency) => setSyncSchedule({ ...syncSchedule, frequency })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </CrudDialog>
  )
}
