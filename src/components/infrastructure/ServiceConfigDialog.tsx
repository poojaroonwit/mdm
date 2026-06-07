'use client'

import { useEffect, useState } from 'react'
import type { InstanceService } from '@/features/infrastructure/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ServiceConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: InstanceService
  onSave: (updates: { name?: string; serviceConfig?: Record<string, any> }) => void
}

export function ServiceConfigDialog({ open, onOpenChange, service, onSave }: ServiceConfigDialogProps) {
  const [name, setName] = useState(service.name)
  const [serviceConfig, setServiceConfig] = useState<Record<string, any>>(service.serviceConfig || {})
  const [configJson, setConfigJson] = useState(JSON.stringify(service.serviceConfig || {}, null, 2))
  const [saving, setSaving] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(service.name)
      setServiceConfig(service.serviceConfig || {})
      setConfigJson(JSON.stringify(service.serviceConfig || {}, null, 2))
      setConfigError(null)
    }
  }, [open, service])

  const handleSave = () => {
    setConfigError(null)
    let parsedConfig = serviceConfig

    try {
      parsedConfig = JSON.parse(configJson)
      setServiceConfig(parsedConfig)
    } catch {
      setConfigError('Invalid JSON format')
      return
    }

    setSaving(true)
    onSave({
      name: name !== service.name ? name : undefined,
      serviceConfig: parsedConfig,
    })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Service</DialogTitle>
          <DialogDescription>
            Rename the service or update its configuration (e.g., client keys, endpoints, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceConfig">Service Configuration (JSON)</Label>
            <textarea
              id="serviceConfig"
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value)
                setConfigError(null)
              }}
              className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
              placeholder='{"clientKey": "value", "endpoint": "url", ...}'
            />
            {configError && (
              <p className="text-sm text-destructive">{configError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !!configError}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
