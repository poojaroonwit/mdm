'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { PluginCategory, PluginDefinition } from '../types'

const categoryOptions: Array<{ value: PluginCategory; label: string }> = [
  { value: 'business-intelligence', label: 'Business Intelligence' },
  { value: 'monitoring-observability', label: 'Monitoring & Observability' },
  { value: 'database-management', label: 'Database Management' },
  { value: 'storage-management', label: 'Storage Management' },
  { value: 'api-gateway', label: 'API Gateway' },
  { value: 'service-management', label: 'Service Management' },
  { value: 'data-integration', label: 'Data Integration' },
  { value: 'automation', label: 'Automation' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'security', label: 'Security' },
  { value: 'development-tools', label: 'Development Tools' },
  { value: 'report-templates', label: 'Report Templates' },
  { value: 'other', label: 'Other' },
]

export interface InstallationEditorValue {
  config: Record<string, any>
  credentials?: Record<string, any>
  status?: string
  healthStatus?: string
}

export function PluginEditDialog({
  plugin,
  open,
  loading,
  error,
  onOpenChange,
  onSave,
}: {
  plugin: PluginDefinition | null
  open: boolean
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSave: (patch: Record<string, any>) => Promise<void>
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    version: '',
    provider: '',
    category: 'other' as PluginCategory,
    status: 'approved',
    documentationUrl: '',
    supportUrl: '',
    verified: false,
  })

  useEffect(() => {
    if (!plugin) return
    setForm({
      name: plugin.name || '',
      description: plugin.description || '',
      version: plugin.version || '',
      provider: plugin.provider || '',
      category: (plugin.category || 'other') as PluginCategory,
      status: plugin.status || 'approved',
      documentationUrl: plugin.documentationUrl || '',
      supportUrl: plugin.supportUrl || '',
      verified: !!plugin.verified,
    })
  }, [plugin])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit plugin</DialogTitle>
          <DialogDescription>
            Update marketplace metadata for the selected plugin.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="plugin-name">Name</Label>
            <Input id="plugin-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="plugin-description">Description</Label>
            <Textarea
              id="plugin-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plugin-version">Version</Label>
            <Input id="plugin-version" value={form.version} onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plugin-provider">Provider</Label>
            <Input id="plugin-provider" value={form.provider} onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as PluginCategory }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plugin-docs">Documentation URL</Label>
            <Input id="plugin-docs" value={form.documentationUrl} onChange={(e) => setForm((prev) => ({ ...prev, documentationUrl: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plugin-support">Support URL</Label>
            <Input id="plugin-support" value={form.supportUrl} onChange={(e) => setForm((prev) => ({ ...prev, supportUrl: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="button" variant={form.verified ? 'default' : 'outline'} onClick={() => setForm((prev) => ({ ...prev, verified: !prev.verified }))}>
              {form.verified ? 'Verified' : 'Mark verified'}
            </Button>
            {plugin?.slug && <Badge variant="outline">{plugin.slug}</Badge>}
          </div>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => onSave(form)}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function InstallationManageDialog({
  plugin,
  installationId,
  open,
  loading,
  error,
  initialValue,
  onOpenChange,
  onSave,
}: {
  plugin: PluginDefinition | null
  installationId: string | null
  open: boolean
  loading: boolean
  error: string | null
  initialValue: InstallationEditorValue | null
  onOpenChange: (open: boolean) => void
  onSave: (payload: InstallationEditorValue) => Promise<void>
}) {
  const [configText, setConfigText] = useState('{}')
  const [credentialsText, setCredentialsText] = useState('{}')
  const [status, setStatus] = useState('active')
  const [healthStatus, setHealthStatus] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialValue) return
    setConfigText(JSON.stringify(initialValue.config || {}, null, 2))
    setCredentialsText(JSON.stringify(initialValue.credentials || {}, null, 2))
    setStatus(initialValue.status || 'active')
    setHealthStatus(initialValue.healthStatus || '')
    setJsonError(null)
  }, [initialValue])

  const details = useMemo(() => {
    if (!plugin || !installationId) return null
    return `${plugin.name} · ${installationId}`
  }, [installationId, plugin])

  const handleSave = async () => {
    try {
      const config = JSON.parse(configText || '{}')
      const credentials = JSON.parse(credentialsText || '{}')
      setJsonError(null)
      await onSave({
        config,
        credentials,
        status,
        healthStatus,
      })
    } catch (parseError) {
      setJsonError(parseError instanceof Error ? parseError.message : 'Invalid JSON payload')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage installation</DialogTitle>
          <DialogDescription>
            Update runtime config, credentials metadata, and health state for the selected installation.
          </DialogDescription>
        </DialogHeader>

        {details && <Badge variant="outline" className="w-fit">{details}</Badge>}

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Installation status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="health-status">Health status</Label>
            <Input id="health-status" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} placeholder="healthy, warning, degraded..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="config-json">Config JSON</Label>
            <Textarea id="config-json" rows={10} value={configText} onChange={(e) => setConfigText(e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="credentials-json">Credentials JSON</Label>
            <Textarea id="credentials-json" rows={8} value={credentialsText} onChange={(e) => setCredentialsText(e.target.value)} className="font-mono text-xs" />
          </div>
          {(jsonError || error) && (
            <p className="md:col-span-2 text-sm text-destructive">{jsonError || error}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={loading} onClick={handleSave}>
            {loading ? 'Saving...' : 'Save installation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
