'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  RefreshCw,
} from 'lucide-react'
import { DatabaseConnection, QueryPerformance, DatabaseStats, TableInfo, IndexInfo } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'
import { DatabaseConnectionsTab } from './DatabaseConnectionsTab'
import { DatabaseIndexesTab } from './DatabaseIndexesTab'
import { DatabasePerformanceTab } from './DatabasePerformanceTab'
import { DatabaseQueryTab } from './DatabaseQueryTab'
import { DatabaseStatsCards } from './DatabaseStatsCards'
import { DatabaseTablesTab } from './DatabaseTablesTab'
import type { NewDatabaseConnection } from './CreateDatabaseConnectionDialog'

export function DatabaseManagement() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [performance, setPerformance] = useState<QueryPerformance[]>([])
  const [databaseTypes, setDatabaseTypes] = useState<Asset[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateConnection, setShowCreateConnection] = useState(false)

  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [newConnection, setNewConnection] = useState<NewDatabaseConnection>({
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

      {stats && <DatabaseStatsCards stats={stats} />}

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
          <DatabaseConnectionsTab
            connections={connections}
            databaseTypes={databaseTypes}
            isLoading={isLoading}
            newConnection={newConnection}
            open={showCreateConnection}
            spaces={spaces}
            onCreate={createConnection}
            onDelete={deleteConnection}
            onOpenChange={setShowCreateConnection}
            onTest={testConnection}
            setNewConnection={setNewConnection}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <DatabasePerformanceTab performance={performance} />
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <DatabaseTablesTab tables={tables} />
        </TabsContent>

        <TabsContent value="indexes" className="space-y-6">
          <DatabaseIndexesTab indexes={indexes} />
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <DatabaseQueryTab
            isExecuting={isExecuting}
            query={query}
            queryResult={queryResult}
            onClear={() => setQuery("")}
            onExecute={executeQuery}
            onQueryChange={setQuery}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
