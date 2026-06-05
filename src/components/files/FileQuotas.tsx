"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  HardDrive, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Save,
  RefreshCw
} from 'lucide-react'

interface FileQuotasProps {
  spaceId: string
}

interface QuotaData {
  id: string
  space_id: string
  max_files: number
  max_size: number
  allowed_file_types: string[]
  current_files: number
  current_size: number
  warning_threshold: number
  is_enforced: boolean
  usage: {
    files: {
      current: number
      max: number
      percentage: number
      isWarning: boolean
    }
    size: {
      current: number
      max: number
      percentage: number
      isWarning: boolean
    }
  }
}

export function FileQuotas({ spaceId }: FileQuotasProps) {
  const { data: session } = useSession()
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    maxFiles: 1000,
    maxSize: 1073741824, // 1GB
    warningThreshold: 80,
    isEnforced: true,
    allowedFileTypes: ['image/*', 'application/pdf', 'text/*']
  })

  useEffect(() => {
    if (spaceId && session?.user?.id) {
      fetchQuota()
    }
  }, [spaceId, session?.user?.id])

  const fetchQuota = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/files/quotas?spaceId=${spaceId}`, {
        headers: {
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quota information')
      }

      const data = await response.json()
      setQuota(data.quota)
      setFormData({
        maxFiles: data.quota.max_files,
        maxSize: data.quota.max_size,
        warningThreshold: data.quota.warning_threshold,
        isEnforced: data.quota.is_enforced,
        allowedFileTypes: data.quota.allowed_file_types
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota information')
    } finally {
      setLoading(false)
    }
  }

  const saveQuota = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!session?.user?.id) return

      const response = await fetch('/api/files/quotas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id
        },
        body: JSON.stringify({
          spaceId,
          maxFiles: formData.maxFiles,
          maxSize: formData.maxSize,
          warningThreshold: formData.warningThreshold,
          isEnforced: formData.isEnforced,
          allowedFileTypes: formData.allowedFileTypes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save quota settings')
      }

      const data = await response.json()
      setQuota(data.quota)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quota settings')
    } finally {
      setSaving(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const parseFileSize = (sizeString: string) => {
    const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 }
    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)$/i)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2].toUpperCase()
      return Math.floor(value * (units[unit as keyof typeof units] || 1))
    }
    return parseInt(sizeString) || 0
  }

  const handleFileSizeChange = (value: string) => {
    const bytes = parseFileSize(value)
    setFormData(prev => ({ ...prev, maxSize: bytes }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!quota) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Storage Quotas</h2>
          <p className="text-muted-foreground">Manage storage limits and file restrictions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuota}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {editing ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveQuota}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Current Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Count</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quota.usage.files.current.toLocaleString()} / {quota.usage.files.max.toLocaleString()}
            </div>
            <Progress 
              value={quota.usage.files.percentage} 
              className={`mt-2 ${quota.usage.files.isWarning ? 'bg-red-100' : ''}`}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {quota.usage.files.percentage}% used
              </span>
              {quota.usage.files.isWarning && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(quota.usage.size.current)} / {formatFileSize(quota.usage.size.max)}
            </div>
            <Progress 
              value={quota.usage.size.percentage} 
              className={`mt-2 ${quota.usage.size.isWarning ? 'bg-red-100' : ''}`}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                {quota.usage.size.percentage}% used
              </span>
              {quota.usage.size.isWarning && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {(quota.usage.files.isWarning || quota.usage.size.isWarning) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Storage usage is approaching the limit. Consider cleaning up old files or increasing the quota.
          </AlertDescription>
        </Alert>
      )}

      {/* Quota Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quota Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Count Limit */}
          <div className="space-y-2">
            <Label htmlFor="maxFiles">Maximum Files</Label>
            {editing ? (
              <Input
                id="maxFiles"
                type="number"
                value={formData.maxFiles}
                onChange={(e) => setFormData(prev => ({ ...prev, maxFiles: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="Enter maximum number of files"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {quota.max_files.toLocaleString()} files
              </div>
            )}
          </div>

          {/* Storage Size Limit */}
          <div className="space-y-2">
            <Label htmlFor="maxSize">Maximum Storage Size</Label>
            {editing ? (
              <Input
                id="maxSize"
                value={formatFileSize(formData.maxSize)}
                onChange={(e) => handleFileSizeChange(e.target.value)}
                placeholder="e.g., 1GB, 500MB, 2TB"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {formatFileSize(quota.max_size)}
              </div>
            )}
          </div>

          {/* Warning Threshold */}
          <div className="space-y-2">
            <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
            {editing ? (
              <Input
                id="warningThreshold"
                type="number"
                value={formData.warningThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, warningThreshold: parseInt(e.target.value) || 80 }))}
                min="1"
                max="100"
                placeholder="Enter warning threshold percentage"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {quota.warning_threshold}%
              </div>
            )}
          </div>

          {/* Allowed File Types */}
          <div className="space-y-2">
            <Label>Allowed File Types</Label>
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={formData.allowedFileTypes.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    allowedFileTypes: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  }))}
                  placeholder="e.g., image/*, application/pdf, text/*"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of MIME types (e.g., image/*, application/pdf)
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {quota.allowed_file_types.map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enforcement */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isEnforced">Enforce Quotas</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users will be prevented from uploading files when quotas are exceeded
              </p>
            </div>
            {editing ? (
              <Switch
                id="isEnforced"
                checked={formData.isEnforced}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnforced: checked }))}
              />
            ) : (
              <StatusBadge status={quota.is_enforced ? 'enabled' : 'disabled'} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{quota.current_files}</div>
              <div className="text-sm text-muted-foreground">Current Files</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatFileSize(quota.current_size)}</div>
              <div className="text-sm text-muted-foreground">Current Size</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{quota.max_files - quota.current_files}</div>
              <div className="text-sm text-muted-foreground">Files Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatFileSize(quota.max_size - quota.current_size)}</div>
              <div className="text-sm text-muted-foreground">Space Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
