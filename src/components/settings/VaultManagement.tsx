'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Key, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Server,
  Shield,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SecretAccessLogs } from './SecretAccessLogs'

interface VaultStatus {
  backend: 'vault' | 'database'
  healthy: boolean
  vaultStatus?: any
  secrets?: {
    aiProviders: number
    databaseConnections: number
    externalConnections: number
  }
  paths?: {
    aiProviders: string[]
    databaseConnections: string[]
    externalConnections: string[]
  }
}

export function VaultManagement() {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/secrets')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        toast.error('Failed to load Vault status')
      }
    } catch (error) {
      console.error('Error loading Vault status:', error)
      toast.error('Failed to load Vault status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleHealthCheck = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'health' }),
      })

      if (response.ok) {
        const health = await response.json()
        setStatus(prev => prev ? { ...prev, ...health } : null)
        if (health.healthy) {
          toast.success('Vault is healthy')
        } else {
          toast.error('Vault health check failed')
        }
      } else {
        toast.error('Failed to check Vault health')
      }
    } catch (error) {
      console.error('Error checking Vault health:', error)
      toast.error('Failed to check Vault health')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <Shield className="h-6 w-6 text-primary" />
              <span>Secrets Management</span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Manage secrets using HashiCorp Vault or database encryption
            </CardDescription>
          </div>
          <Button onClick={loadStatus} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !status ? (
          <div className="text-center py-8 text-muted-foreground">Loading status...</div>
        ) : status ? (
          <div className="space-y-6">
            {/* Backend Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {status.backend === 'vault' ? (
                  <Server className="h-5 w-5 text-blue-500" />
                ) : (
                  <Database className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-semibold">
                    Backend: {status.backend === 'vault' ? 'HashiCorp Vault' : 'Database Encryption'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {status.backend === 'vault'
                      ? 'Secrets are stored in Vault'
                      : 'Secrets are encrypted in database'}
                  </div>
                </div>
              </div>
              {status.healthy ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Unhealthy
                </Badge>
              )}
            </div>

            {/* Vault Status Details */}
            {status.backend === 'vault' && status.vaultStatus && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-semibold">Vault Status</span>
                </div>
                <div className="text-sm space-y-1">
                  {status.vaultStatus.initialized !== undefined && (
                    <div>
                      Initialized:{' '}
                      {status.vaultStatus.initialized ? (
                        <Badge variant="outline" className="ml-2">Yes</Badge>
                      ) : (
                        <Badge variant="destructive" className="ml-2">No</Badge>
                      )}
                    </div>
                  )}
                  {status.vaultStatus.sealed !== undefined && (
                    <div>
                      Sealed:{' '}
                      {status.vaultStatus.sealed ? (
                        <Badge variant="destructive" className="ml-2">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">No</Badge>
                      )}
                    </div>
                  )}
                  {status.vaultStatus.version && (
                    <div>Version: {status.vaultStatus.version}</div>
                  )}
                </div>
              </div>
            )}

            {/* Secrets Summary */}
            {status.secrets && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">AI Providers</span>
                  </div>
                  <div className="text-2xl font-bold">{status.secrets.aiProviders}</div>
                  <div className="text-sm text-muted-foreground">API keys stored</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">Database Connections</span>
                  </div>
                  <div className="text-2xl font-bold">{status.secrets.databaseConnections}</div>
                  <div className="text-sm text-muted-foreground">Credentials stored</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">External Connections</span>
                  </div>
                  <div className="text-2xl font-bold">{status.secrets.externalConnections}</div>
                  <div className="text-sm text-muted-foreground">API credentials stored</div>
                </div>
              </div>
            )}

            {/* Configuration Info */}
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Configuration
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>
                      To use HashiCorp Vault, set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">USE_VAULT=true</code> in your environment variables.
                    </p>
                    <p>
                      Vault address: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{process.env.NEXT_PUBLIC_VAULT_ADDR || 'http://localhost:8200'}</code>
                    </p>
                    {status.backend === 'database' && (
                      <p className="mt-2 font-medium">
                        Currently using database encryption. Enable Vault for enhanced security and centralized secret management.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Health Check Button */}
            {status.backend === 'vault' && (
              <div className="flex justify-end">
                <Button onClick={handleHealthCheck} disabled={isLoading}>
                  <Activity className="h-4 w-4 mr-2" />
                  Run Health Check
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Unable to load secrets management status</p>
          </div>
        )}
      </CardContent>

      {/* Secret Access Audit Logs */}
      <div className="mt-6">
        <SecretAccessLogs />
      </div>
    </Card>
  )
}


