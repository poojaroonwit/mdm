'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database,
  Link,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: 'api' | 'database' | 'static' | 'computed'
  url?: string
  query?: string
  headers?: Record<string, string>
  transform?: string
  cache?: number
  enabled: boolean
  lastUpdated?: string
  error?: string
}

interface DataBinding {
  id: string
  componentId: string
  dataSourceId: string
  field: string
  transform?: string
  fallback?: any
  refreshInterval?: number
  enabled: boolean
}

interface DataBindingManagerProps {
  dataSources: DataSource[]
  dataBindings: DataBinding[]
  onUpdateDataSource: (id: string, updates: Partial<DataSource>) => void
  onCreateDataSource: (dataSource: Omit<DataSource, 'id'>) => void
  onDeleteDataSource: (id: string) => void
  onUpdateDataBinding: (id: string, updates: Partial<DataBinding>) => void
  onCreateDataBinding: (binding: Omit<DataBinding, 'id'>) => void
  onDeleteDataBinding: (id: string) => void
  onTestConnection: (dataSource: DataSource) => Promise<boolean>
  onRefreshData: (dataSourceId: string) => Promise<any>
}

export function DataBindingManager({
  dataSources,
  dataBindings,
  onUpdateDataSource,
  onCreateDataSource,
  onDeleteDataSource,
  onUpdateDataBinding,
  onCreateDataBinding,
  onDeleteDataBinding,
  onTestConnection,
  onRefreshData
}: DataBindingManagerProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'bindings' | 'test'>('sources')
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [isTesting, setIsTesting] = useState(false)

  // Test data source connection
  const testDataSource = useCallback(async (dataSource: DataSource) => {
    setIsTesting(true)
    try {
      const result = await onTestConnection(dataSource)
      setTestResults(prev => ({ ...prev, [dataSource.id]: result }))
      return result
    } catch (error) {
      setTestResults(prev => ({ ...prev, [dataSource.id]: { error: error instanceof Error ? error.message : String(error) } }))
      return false
    } finally {
      setIsTesting(false)
    }
  }, [onTestConnection])

  // Refresh data source
  const refreshDataSource = useCallback(async (dataSourceId: string) => {
    try {
      const data = await onRefreshData(dataSourceId)
      setTestResults(prev => ({ ...prev, [dataSourceId]: data }))
      return data
    } catch (error) {
      setTestResults(prev => ({ ...prev, [dataSourceId]: { error: error instanceof Error ? error.message : String(error) } }))
      throw error
    }
  }, [onRefreshData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Binding Manager
          </h2>
          <p className="text-muted-foreground">
            Manage data sources and component bindings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('test')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Test Data
          </Button>
          <Button
            onClick={() => onCreateDataSource({
              name: 'New Data Source',
              type: 'api',
              enabled: true
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'sources' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('sources')}
        >
          <Database className="h-4 w-4 mr-2" />
          Data Sources
        </Button>
        <Button
          variant={activeTab === 'bindings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('bindings')}
        >
          <Link className="h-4 w-4 mr-2" />
          Bindings
        </Button>
        <Button
          variant={activeTab === 'test' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('test')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Test & Preview
        </Button>
      </div>

      {/* Data Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {dataSources.map(dataSource => (
            <Card key={dataSource.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {dataSource.name}
                    <StatusBadge status={dataSource.enabled ? 'active' : 'inactive'} />
                    <Badge variant="outline">
                      {dataSource.type}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testDataSource(dataSource)}
                      disabled={isTesting}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDataSource(dataSource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteDataSource(dataSource.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={dataSource.type}
                      onValueChange={(value: any) => onUpdateDataSource(dataSource.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">REST API</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="computed">Computed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={dataSource.enabled}
                        onCheckedChange={(checked) => onUpdateDataSource(dataSource.id, { enabled: checked })}
                      />
                      <span className="text-sm">{dataSource.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
                
                {dataSource.type === 'api' && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={dataSource.url || ''}
                        onChange={(e) => onUpdateDataSource(dataSource.id, { url: e.target.value })}
                        placeholder="https://api.example.com/data"
                      />
                    </div>
                    <div>
                      <Label>Headers (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(dataSource.headers || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const headers = JSON.parse(e.target.value)
                            onUpdateDataSource(dataSource.id, { headers })
                          } catch (error) {
                            // Invalid JSON, ignore
                          }
                        }}
                        placeholder='{"Authorization": "Bearer token"}'
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {dataSource.type === 'database' && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <Label>Query</Label>
                      <Textarea
                        value={dataSource.query || ''}
                        onChange={(e) => onUpdateDataSource(dataSource.id, { query: e.target.value })}
                        placeholder="SELECT * FROM users WHERE active = true"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {dataSource.error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Error</span>
                    </div>
                    <p className="text-sm text-destructive mt-1">{dataSource.error}</p>
                  </div>
                )}

                {dataSource.lastUpdated && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last updated: {new Date(dataSource.lastUpdated).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data Bindings Tab */}
      {activeTab === 'bindings' && (
        <div className="space-y-4">
          {dataBindings.map(binding => {
            const dataSource = dataSources.find(ds => ds.id === binding.dataSourceId)
            return (
              <Card key={binding.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5" />
                      Component Binding
                      <StatusBadge status={binding.enabled ? 'active' : 'inactive'} />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateDataBinding(binding.id, { enabled: !binding.enabled })}
                      >
                        {binding.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteDataBinding(binding.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data Source</Label>
                      <Select
                        value={binding.dataSourceId}
                        onValueChange={(value) => onUpdateDataBinding(binding.id, { dataSourceId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map(ds => (
                            <SelectItem key={ds.id} value={ds.id}>
                              {ds.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Field</Label>
                      <Input
                        value={binding.field}
                        onChange={(e) => onUpdateDataBinding(binding.id, { field: e.target.value })}
                        placeholder="data.users"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div>
                      <Label>Transform Function (JavaScript)</Label>
                      <Textarea
                        value={binding.transform || ''}
                        onChange={(e) => onUpdateDataBinding(binding.id, { transform: e.target.value })}
                        placeholder="return data.map(item => ({ ...item, processed: true }))"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Fallback Value</Label>
                      <Input
                        value={binding.fallback || ''}
                        onChange={(e) => onUpdateDataBinding(binding.id, { fallback: e.target.value })}
                        placeholder="No data available"
                      />
                    </div>
                  </div>

                  {dataSource && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4" />
                        <span className="font-medium">Source:</span>
                        <span>{dataSource.name}</span>
                        <Badge variant="outline">{dataSource.type}</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Test & Preview Tab */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          {dataSources.map(dataSource => (
            <Card key={dataSource.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {dataSource.name}
                  {testResults[dataSource.id] && (
                    <StatusBadge status={testResults[dataSource.id].error ? 'error' : 'success'} />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    onClick={() => refreshDataSource(dataSource.id)}
                    disabled={isTesting}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testDataSource(dataSource)}
                    disabled={isTesting}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>

                {testResults[dataSource.id] && (
                  <div className="mt-4">
                    {testResults[dataSource.id].error ? (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Connection Failed</span>
                        </div>
                        <p className="text-sm text-destructive mt-1">{testResults[dataSource.id].error}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Connection Successful</span>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(testResults[dataSource.id], null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
