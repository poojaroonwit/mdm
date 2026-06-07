'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Database, 
  Activity, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Eye,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Key,
  HardDrive,
  Cpu,
  MemoryStick,
  Server,
  Globe
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { CacheInstance, CacheKey, CacheStats, CacheConfig } from '../types'
import { CacheManagementTabs } from './CacheManagementTabs'

export function CacheManagement() {
  const [instances, setInstances] = useState<CacheInstance[]>([])
  const [keys, setKeys] = useState<CacheKey[]>([])
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [config, setConfig] = useState<CacheConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateInstance, setShowCreateInstance] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<CacheInstance | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [newInstance, setNewInstance] = useState({
    name: '',
    type: 'redis' as const,
    host: '',
    port: 6379,
    password: ''
  })

  const [newKey, setNewKey] = useState({
    key: '',
    value: '',
    ttl: 3600
  })

  useEffect(() => {
    loadInstances()
    loadStats()
    loadConfig()
  }, [])

  useEffect(() => {
    if (selectedInstance) {
      loadKeys(selectedInstance.id)
    }
  }, [selectedInstance])

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadInstances = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/cache-instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances.map((instance: any) => ({
          ...instance,
          lastConnected: instance.lastConnected ? new Date(instance.lastConnected) : undefined
        })))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load cache instances')
      }
    } catch (error) {
      console.error('Error loading cache instances:', error)
      setError('Network error: Failed to load cache instances')
    } finally {
      setIsLoading(false)
    }
  }

  const loadKeys = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/keys`)
      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys.map((key: any) => ({
          ...key,
          lastAccessed: key.lastAccessed ? new Date(key.lastAccessed) : undefined
        })))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load cache keys')
      }
    } catch (error) {
      console.error('Error loading cache keys:', error)
      setError('Network error: Failed to load cache keys')
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/cache-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load cache stats')
      }
    } catch (error) {
      console.error('Error loading cache stats:', error)
      setError('Network error: Failed to load cache stats')
    }
  }

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/cache-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load cache config')
      }
    } catch (error) {
      console.error('Error loading cache config:', error)
      setError('Network error: Failed to load cache config')
    }
  }

  const createInstance = async () => {
    try {
      const response = await fetch('/api/admin/cache-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstance)
      })

      if (response.ok) {
        setShowCreateInstance(false)
        setNewInstance({
          name: '',
          type: 'redis',
          host: '',
          port: 6379,
          password: ''
        })
        setSuccessMessage('Cache instance created successfully')
        loadInstances()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create cache instance')
      }
    } catch (error) {
      console.error('Error creating cache instance:', error)
      setError('Network error: Failed to create cache instance')
    }
  }

  const testConnection = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        loadInstances()
      }
    } catch (error) {
      console.error('Error testing connection:', error)
    }
  }

  const createKey = async () => {
    if (!selectedInstance || !newKey.key || !newKey.value) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${selectedInstance.id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      })

      if (response.ok) {
        setShowKeyDialog(false)
        setNewKey({
          key: '',
          value: '',
          ttl: 3600
        })
        loadKeys(selectedInstance.id)
      }
    } catch (error) {
      console.error('Error creating cache key:', error)
    }
  }

  const deleteKey = async (key: string) => {
    if (!selectedInstance) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${selectedInstance.id}/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadKeys(selectedInstance.id)
      }
    } catch (error) {
      console.error('Error deleting cache key:', error)
    }
  }

  const clearCache = async (instanceId: string) => {
    if (!confirm('Are you sure you want to clear all cache keys?')) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/clear`, {
        method: 'POST'
      })

      if (response.ok) {
        loadKeys(instanceId)
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getCacheIcon = (type: string) => {
    switch (type) {
      case 'redis':
        return <Database className="h-4 w-4 text-red-500" />
      case 'memcached':
        return <Database className="h-4 w-4 text-blue-500" />
      case 'memory':
        return <MemoryStick className="h-4 w-4 text-green-500" />
      case 'file':
        return <HardDrive className="h-4 w-4 text-yellow-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-500" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const filteredKeys = keys.filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Cache Management
          </h2>
          <p className="text-muted-foreground">
            Cache instances, keys, performance monitoring, and optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInstances} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{successMessage}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                    onClick={() => setSuccessMessage(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKeys.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Active cache keys
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">
                Cache efficiency
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.memoryUsage)}</div>
              <div className="text-xs text-muted-foreground">
                Cache memory
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commands/sec</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.commandsPerSecond}</div>
              <div className="text-xs text-muted-foreground">
                Throughput
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CacheManagementTabs
        clearCache={clearCache}
        config={config}
        createInstance={createInstance}
        createKey={createKey}
        deleteKey={deleteKey}
        filteredKeys={filteredKeys}
        formatBytes={formatBytes}
        getCacheIcon={getCacheIcon}
        getStatusIcon={getStatusIcon}
        instances={instances}
        isLoading={isLoading}
        loadKeys={loadKeys}
        newInstance={newInstance}
        newKey={newKey}
        searchTerm={searchTerm}
        selectedInstance={selectedInstance}
        setNewInstance={setNewInstance}
        setNewKey={setNewKey}
        setSearchTerm={setSearchTerm}
        setSelectedInstance={setSelectedInstance}
        setShowCreateInstance={setShowCreateInstance}
        setShowKeyDialog={setShowKeyDialog}
        showCreateInstance={showCreateInstance}
        showKeyDialog={showKeyDialog}
        stats={stats}
        testConnection={testConnection}
      />
    </div>
  )
}
