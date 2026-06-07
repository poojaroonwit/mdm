'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, File, Settings, RefreshCw, Loader, Save, CheckCircle2, XCircle, Eye, EyeOff, Clock, Timer } from 'lucide-react'
import { useMinIO } from '../hooks/useMinIO'
import { showSuccess, showError } from '@/lib/toast-utils'
import { MinIOBucketsTab, MinIOObjectsTab } from './MinIOStorageTabs'

export interface MinIOManagementProps {
  instanceId: string
}

interface MinIOConfig {
  endpoint: string
  port: number
  accessKey: string
  secretKey: string
  useSSL: boolean
  region: string
}

type SyncInterval = 'disabled' | '5' | '15' | '30' | '60'

export function MinIOManagement({ instanceId }: MinIOManagementProps) {
  const { buckets, loading, error, refetch } = useMinIO(instanceId)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

  // Configuration state
  const [config, setConfig] = useState<MinIOConfig>({
    endpoint: 'localhost',
    port: 9000,
    accessKey: '',
    secretKey: '',
    useSSL: false,
    region: 'us-east-1',
  })
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [showSecretKey, setShowSecretKey] = useState(false)

  // Sync state
  const [syncInterval, setSyncInterval] = useState<SyncInterval>('disabled')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load current configuration
  const loadConfiguration = useCallback(async (showToast = true) => {
    setConfigLoading(true)
    setIsSyncing(true)
    setConnectionStatus('unknown')
    try {
      const response = await fetch(`/api/minio/${instanceId}/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig({
          endpoint: data.endpoint || 'localhost',
          port: data.port || 9000,
          accessKey: '', // Don't expose existing credentials
          secretKey: '', // Don't expose existing credentials
          useSSL: data.useSSL || false,
          region: data.region || 'us-east-1',
        })
        setLastSyncTime(new Date())
        if (data.hasCredentials) {
          setConnectionMessage('Configuration loaded (credentials hidden for security)')
          setConnectionStatus('success')
        } else {
          setConnectionMessage('Configuration loaded - credentials need to be set')
        }
        if (showToast) {
          showSuccess('Configuration fetched successfully')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load configuration' }))
        if (showToast) {
          showError(errorData.error || 'Failed to load configuration')
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
      if (showToast) {
        showError('Failed to load configuration')
      }
    } finally {
      setConfigLoading(false)
      setIsSyncing(false)
    }
  }, [instanceId])

  // Test connection
  const testConnection = useCallback(async () => {
    setConfigLoading(true)
    setConnectionStatus('unknown')
    try {
      const response = await fetch(`/api/minio/${instanceId}/connection`)
      const data = await response.json()

      if (data.success) {
        setConnectionStatus('success')
        setConnectionMessage(data.message || `Connected to ${data.endpoint}`)
        showSuccess('Connection test successful!')
      } else {
        setConnectionStatus('error')
        setConnectionMessage(data.error || 'Connection failed')
        showError(data.error || 'Connection test failed')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage(error instanceof Error ? error.message : 'Connection test failed')
      showError('Connection test failed')
    } finally {
      setConfigLoading(false)
    }
  }, [instanceId])

  // Save configuration
  const saveConfiguration = useCallback(async () => {
    if (!config.endpoint || !config.accessKey || !config.secretKey) {
      showError('Please fill in all required fields (Endpoint, Access Key, Secret Key)')
      return
    }

    setConfigSaving(true)
    try {
      const response = await fetch(`/api/minio/${instanceId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: config.endpoint,
          port: config.port,
          accessKey: config.accessKey,
          secretKey: config.secretKey,
          useSSL: config.useSSL,
          region: config.region,
        }),
      })

      if (response.ok) {
        showSuccess('Configuration saved successfully!')
        // Clear sensitive fields after saving
        setConfig(prev => ({
          ...prev,
          accessKey: '',
          secretKey: '',
        }))
        // Test connection after saving
        await testConnection()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save configuration' }))
        showError(errorData.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      showError('Failed to save configuration')
    } finally {
      setConfigSaving(false)
    }
  }, [config, instanceId, testConnection])

  // Auto-fetch config on mount
  useEffect(() => {
    loadConfiguration(false) // Don't show toast on initial load
  }, [loadConfiguration])

  // Setup scheduled sync
  useEffect(() => {
    // Clear existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }

    // Setup new interval if not disabled
    if (syncInterval !== 'disabled') {
      const intervalMs = parseInt(syncInterval) * 60 * 1000 // Convert minutes to ms
      syncIntervalRef.current = setInterval(() => {
        loadConfiguration(false) // Silent refresh
      }, intervalMs)
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncInterval, loadConfiguration])

  const getSyncIntervalLabel = (interval: SyncInterval) => {
    switch (interval) {
      case 'disabled': return 'Disabled'
      case '5': return 'Every 5 minutes'
      case '15': return 'Every 15 minutes'
      case '30': return 'Every 30 minutes'
      case '60': return 'Every hour'
      default: return 'Disabled'
    }
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <Tabs defaultValue="buckets">
          <TabsList>
            <TabsTrigger value="buckets">
              <Database className="h-4 w-4 mr-2" />
              Buckets
            </TabsTrigger>
            <TabsTrigger value="objects" disabled={!selectedBucket}>
              <File className="h-4 w-4 mr-2" />
              Objects
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buckets" className="space-y-4">
            <MinIOBucketsTab
              buckets={buckets}
              loading={loading}
              error={error}
              selectedBucket={selectedBucket}
              onSelectBucket={setSelectedBucket}
              onRefresh={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            <MinIOObjectsTab selectedBucket={selectedBucket} />
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Connection Settings</CardTitle>
                    <CardDescription>
                      Configure MinIO connection details for this instance
                    </CardDescription>
                  </div>
                  {/* Sync Status Indicator */}
                  <div className="flex items-center gap-2">
                    {isSyncing && (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Syncing...
                      </Badge>
                    )}
                    {lastSyncTime && !isSyncing && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        Last sync: {lastSyncTime.toLocaleTimeString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Instance ID */}
                  <div>
                    <Label>Instance ID</Label>
                    <div className="mt-1 text-sm text-muted-foreground font-mono">{instanceId}</div>
                  </div>

                  {/* Scheduled Sync */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <Label>Auto-Sync Schedule</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Automatically fetch configuration updates at regular intervals
                        </p>
                      </div>
                      <Select value={syncInterval} onValueChange={(v) => setSyncInterval(v as SyncInterval)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {syncInterval !== 'disabled' && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Auto-sync enabled: {getSyncIntervalLabel(syncInterval)}
                      </div>
                    )}
                  </div>

                  {/* Endpoint */}
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">
                      Endpoint <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endpoint"
                      value={config.endpoint}
                      onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                      placeholder="localhost or minio.example.com"
                    />
                  </div>

                  {/* Port */}
                  <div className="space-y-2">
                    <Label htmlFor="port">
                      Port <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="port"
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 9000 })}
                      placeholder="9000"
                    />
                  </div>

                  {/* Access Key */}
                  <div className="space-y-2">
                    <Label htmlFor="accessKey">
                      Access Key <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="accessKey"
                      value={config.accessKey}
                      onChange={(e) => setConfig({ ...config, accessKey: e.target.value })}
                      placeholder="minioadmin"
                    />
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">
                      Secret Key <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="secretKey"
                        type={showSecretKey ? 'text' : 'password'}
                        value={config.secretKey}
                        onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                        placeholder="minioadmin"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Use SSL */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="useSSL">Use SSL</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable HTTPS connection
                      </p>
                    </div>
                    <Switch
                      id="useSSL"
                      checked={config.useSSL}
                      onCheckedChange={(checked) => setConfig({ ...config, useSSL: checked })}
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={config.region}
                      onChange={(e) => setConfig({ ...config, region: e.target.value })}
                      placeholder="us-east-1"
                    />
                  </div>

                  {/* Connection Status */}
                  {connectionStatus !== 'unknown' && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${connectionStatus === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                      {connectionStatus === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${connectionStatus === 'success'
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                          }`}>
                          {connectionStatus === 'success' ? 'Connection Successful' : 'Connection Failed'}
                        </p>
                        {connectionMessage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {connectionMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => loadConfiguration(true)}
                      disabled={configLoading || configSaving}
                    >
                      {configLoading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fetch Config
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={testConnection}
                      disabled={configLoading || configSaving}
                    >
                      Test Connection
                    </Button>
                    <Button
                      onClick={saveConfiguration}
                      disabled={configLoading || configSaving}
                      className="ml-auto"
                    >
                      {configSaving ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


