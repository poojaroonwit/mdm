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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Database, 
  Server, 
  Activity, 
  Zap, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
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
  Table,
  Key,
  Link,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { DatabaseConnection, QueryPerformance, DatabaseStats, TableInfo, IndexInfo } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'

function DatabaseConnectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-10 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DatabaseManagement() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [performance, setPerformance] = useState<QueryPerformance[]>([])
  const [databaseTypes, setDatabaseTypes] = useState<Asset[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateConnection, setShowCreateConnection] = useState(false)
  const [showQueryDialog, setShowQueryDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)

  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [newConnection, setNewConnection] = useState({
    name: '',
    spaceId: '',
    type: 'postgresql' as const,
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: ''
  })

  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    loadSpaces()
    loadConnections()
    loadPerformance()
    loadStats()
    loadTables()
    loadIndexes()
    loadDatabaseTypes()
  }, [])

  const loadDatabaseTypes = async () => {
    try {
      const types = await getDatabaseTypes()
      setDatabaseTypes(types.filter((t) => t.isActive))
    } catch (error) {
      console.error('Error loading database types:', error)
    }
  }

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const loadConnections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/database-connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections.map((conn: any) => ({
          ...conn,
          lastConnected: conn.lastConnected ? new Date(conn.lastConnected) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPerformance = async () => {
    try {
      const response = await fetch('/api/admin/query-performance')
      if (response.ok) {
        const data = await response.json()
        setPerformance(data.queries.map((query: any) => ({
          ...query,
          timestamp: new Date(query.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/database-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading database stats:', error)
    }
  }

  const loadTables = async () => {
    try {
      const response = await fetch('/api/admin/database-tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables.map((table: any) => ({
          ...table,
          lastAnalyzed: table.lastAnalyzed ? new Date(table.lastAnalyzed) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    }
  }

  const loadIndexes = async () => {
    try {
      const response = await fetch('/api/admin/database-indexes')
      if (response.ok) {
        const data = await response.json()
        setIndexes(data.indexes)
      }
    } catch (error) {
      console.error('Error loading indexes:', error)
    }
  }

  const createConnection = async () => {
    try {
      const response = await fetch('/api/admin/database-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnection)
      })

      if (response.ok) {
        setShowCreateConnection(false)
        setNewConnection({
          name: '',
          spaceId: '',
          type: 'postgresql',
          host: '',
          port: 5432,
          database: '',
          username: '',
          password: ''
        })
        loadConnections()
      }
    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const testConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/admin/database-connections/${connectionId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        loadConnections()
      }
    } catch (error) {
      console.error('Error testing connection:', error)
    }
  }

  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    try {
      const response = await fetch('/api/admin/database-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (response.ok) {
        const data = await response.json()
        setQueryResult(data.results)
        loadPerformance()
      }
    } catch (error) {
      console.error('Error executing query:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return

    try {
      const response = await fetch(`/api/admin/database-connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadConnections()
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDatabaseIcon = (type: string) => {
    // Try to find the asset and use its icon/color
    const asset = databaseTypes.find(t => t.code === type)
    if (asset?.icon) {
      return <span className="text-lg">{asset.icon}</span>
    }
    // Fallback to Lucide icons if asset not found
    switch (type) {
      case 'postgresql':
        return <Database className="h-4 w-4 text-blue-500" />
      case 'mysql':
        return <Database className="h-4 w-4 text-orange-500" />
      case 'sqlite':
        return <Database className="h-4 w-4 text-green-500" />
      case 'mongodb':
        return <Database className="h-4 w-4 text-green-600" />
      case 'redis':
        return <Database className="h-4 w-4 text-red-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Management
          </h2>
          <p className="text-muted-foreground">
            Database connections, query performance, and optimization tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadConnections} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Database Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeConnections}</div>
              <div className="text-xs text-muted-foreground">
                {stats.totalConnections} total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgQueryTime)}</div>
              <div className="text-xs text-muted-foreground">
                {stats.slowQueries} slow queries
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">
                Cache efficiency
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.databaseSize)}</div>
              <div className="text-xs text-muted-foreground">
                {stats.tableCount} tables
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
      <Tabs defaultValue="connections">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="query">Query</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Database Connections</h3>
            <Dialog open={showCreateConnection} onOpenChange={setShowCreateConnection}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Add Database Connection</DialogTitle>
                  <DialogDescription>
                    Configure a new database connection
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4 p-6 pt-2 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conn-name">Connection Name</Label>
                      <Input
                        id="conn-name"
                        value={newConnection.name}
                        onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                        placeholder="My Database"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conn-space">Space</Label>
                      <Select value={newConnection.spaceId} onValueChange={(value) => setNewConnection({ ...newConnection, spaceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces.map(space => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conn-type">Database Type</Label>
                      <Select value={newConnection.type} onValueChange={(value: any) => {
                        const selectedType = databaseTypes.find(t => t.code === value)
                        setNewConnection({ 
                          ...newConnection, 
                          type: value,
                          port: selectedType?.metadata?.defaultPort || newConnection.port
                        })
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {databaseTypes.map((type) => (
                            <SelectItem key={type.id} value={type.code}>
                              <div className="flex items-center gap-2">
                                {type.icon && <span>{type.icon}</span>}
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="conn-host">Host</Label>
                      <Input
                        id="conn-host"
                        value={newConnection.host}
                        onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                        placeholder="localhost"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conn-port">Port</Label>
                      <Input
                        id="conn-port"
                        type="number"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection({ ...newConnection, port: parseInt(e.target.value) })}
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conn-database">Database</Label>
                      <Input
                        id="conn-database"
                        value={newConnection.database}
                        onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                        placeholder="mydb"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conn-username">Username</Label>
                      <Input
                        id="conn-username"
                        value={newConnection.username}
                        onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                        placeholder="user"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conn-password">Password</Label>
                      <Input
                        id="conn-password"
                        type="password"
                        value={newConnection.password}
                        onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                        placeholder="password"
                      />
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateConnection(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createConnection} disabled={!newConnection.name || !newConnection.host}>
                    Create Connection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading && connections.length === 0 ? (
            <DatabaseConnectionSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map(connection => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getDatabaseIcon(connection.type)}
                      {connection.name}
                    </CardTitle>
                    {getStatusIcon(connection.status)}
                  </div>
                  <CardDescription>
                    {(() => {
                      const asset = databaseTypes.find(t => t.code === connection.type)
                      const typeName = asset?.name || connection.type
                      return `${typeName} • ${connection.spaceName} • ${connection.host}:${connection.port} • ${connection.database}`
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(connection.status)}>
                      {connection.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Active Connections</span>
                      <span>{connection.connectionPool.current}/{connection.connectionPool.max}</span>
                    </div>
                    <Progress value={(connection.connectionPool.current / connection.connectionPool.max) * 100} />
                  </div>

                  {connection.lastConnected && (
                    <div className="text-sm text-muted-foreground">
                      Last connected: {connection.lastConnected.toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(connection.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteConnection(connection.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <h3 className="text-lg font-semibold">Query Performance</h3>
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
              <CardDescription>Query execution performance and slow queries</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {performance.map(query => (
                    <div key={query.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 truncate">
                          {query.query.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {query.timestamp.toLocaleString()} • {query.rowsAffected} rows
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-medium">{formatDuration(query.executionTime)}</div>
                          {query.isSlow && (
                            <Badge variant="destructive" className="text-xs">Slow</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <h3 className="text-lg font-semibold">Database Tables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(table => (
              <Card key={table.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    {table.name}
                  </CardTitle>
                  <CardDescription>
                    {table.rows.toLocaleString()} rows • {formatBytes(table.size)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Indexes:</span>
                      <span>{table.indexes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Columns:</span>
                      <span>{table.columns.length}</span>
                    </div>
                    {table.isPartitioned && (
                      <Badge variant="outline" className="text-xs">Partitioned</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-6">
          <h3 className="text-lg font-semibold">Database Indexes</h3>
          <div className="space-y-4">
            {indexes.map(index => (
              <Card key={index.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{index.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {index.table} • {index.columns.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={index.isPrimary ? 'default' : 'outline'}>
                        {index.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(index.size)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <h3 className="text-lg font-semibold">Query Editor</h3>
          <Card>
            <CardHeader>
              <CardTitle>Execute SQL Query</CardTitle>
              <CardDescription>Run custom SQL queries against your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM users WHERE created_at > '2024-01-01';"
                  rows={6}
                  className="font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={executeQuery} disabled={!query.trim() || isExecuting}>
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setQuery('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {queryResult.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Query Results</CardTitle>
                <CardDescription>
                  {queryResult.length} rows returned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(queryResult[0] || {}).map(key => (
                            <th key={key} className="text-left p-2 font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.slice(0, 100).map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="p-2">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
