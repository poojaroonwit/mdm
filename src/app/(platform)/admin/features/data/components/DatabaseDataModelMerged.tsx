'use client'

import { Skeleton } from '@/components/ui/skeleton'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Database,
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  Table,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  MoreVertical,
  Sparkles,
  Lock,
  Plus,
  Server,
  Code,
  Building2,
  Filter,
  Eye,
  X,
  LayoutGrid,
  LayoutList,
  Rows3
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ERDDiagram from '@/components/erd/ERDDiagram'
import { DatabaseConnection } from '../types'
import type { DataModel, Folder as DataFolder } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { BrandingConfig } from '@/types/branding'
import { AddDatabaseConnectionDialog } from './AddDatabaseConnectionDialog'
import { DataModelTree } from './DataModelTree'
import { DataModelDetailDrawer } from './DataModelDetailDrawer'
import { useDatabaseMergedErdData } from './useDatabaseMergedErdData'
import { useDatabaseMergedTree } from './useDatabaseMergedTree'
import { DatabaseDataModelMergedView } from './DatabaseDataModelMergedView'

// Built-in database constant
const BUILTIN_DATABASE: DatabaseConnection = {
  id: '__builtin__',
  name: 'Built-in Database',
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  status: 'connected',
  spaceId: '__system__',
  spaceName: 'System',
  connectionPool: { current: 5, max: 20 },
  isBuiltin: true
} as DatabaseConnection & { isBuiltin: boolean }

interface DatabaseSchema {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default?: string
    }>
  }>
  functions: string[]
}

export function DatabaseDataModelMerged() {
  // Database state
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>('__builtin__')
  const [databaseTypes, setDatabaseTypes] = useState<Asset[]>([])
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false)

  // Space filter state
  const [spaces, setSpaces] = useState<Array<{ id: string, name: string }>>([])
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState<string | null>(null) // null = all spaces

  // Add Connection Dialog state
  const [showAddConnection, setShowAddConnection] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null)
  const [newConnection, setNewConnection] = useState({
    name: '',
    spaceId: '',
    type: 'postgresql' as string,
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    scopeAllDatabases: true,
    scopeAllTables: true,
    specificTables: [] as string[]
  })
  const [discoveredTables, setDiscoveredTables] = useState<string[]>([])

  // Data Model state
  const [models, setModels] = useState<DataModel[]>([])
  const [folders, setFolders] = useState<DataFolder[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // View toggle - 'model' | 'schema' | 'erd'
  const [viewMode, setViewMode] = useState<'model' | 'schema' | 'erd'>('model')
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [schemaDisplayMode, setSchemaDisplayMode] = useState<'grid' | 'list' | 'table'>('table')

  // Model query editing state
  const [modelQueries, setModelQueries] = useState<Record<string, string>>({})
  const [editingQueryModel, setEditingQueryModel] = useState<string | null>(null)

  // ERD state
  const [erdModels, setErdModels] = useState<any[]>([])
  const [erdRelationships, setErdRelationships] = useState<any[]>([])
  const [isLoadingERD, setIsLoadingERD] = useState(false)

  // Detail Drawer state (for viewing model/table columns/attributes)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    type: 'model' | 'table'
    id: string
    name: string
    displayName?: string
    description?: string
  } | null>(null)
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null)
  const [modelAttributes, setModelAttributes] = useState<any[]>([])
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)
  const [attributeOptions, setAttributeOptions] = useState<any[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Theme config state
  const [themeConfig, setThemeConfig] = useState<BrandingConfig | null>(null)

  useEffect(() => {
    loadSpaces()
    loadDatabaseTypes()
    loadConnections()
    loadModels()
    loadFolders()
    loadThemeConfig()
  }, [])

  const loadThemeConfig = async () => {
    try {
      const response = await fetch('/api/admin/branding')
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          setThemeConfig(data.branding as BrandingConfig)
        }
      }
    } catch (error) {
      console.error('Error loading branding config:', error)
    }
  }

  useEffect(() => {
    if (viewMode === 'schema' && selectedDatabase) {
      loadDatabaseSchema(selectedDatabase)
    }
    // Also load schema for model view when built-in database is selected
    if (viewMode === 'model' && selectedDatabase === '__builtin__') {
      loadDatabaseSchema('__builtin__')
    }
  }, [viewMode, selectedDatabase])

  useEffect(() => {
    if (viewMode === 'erd' && selectedDatabase) {
      // First load schema so ERD can use it as fallback
      loadDatabaseSchema(selectedDatabase).then(() => {
        loadERDData()
      })
    } else if (viewMode === 'erd') {
      loadERDData()
    }
  }, [viewMode, selectedDatabase])

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
    setIsLoadingDatabases(true)
    try {
      const response = await fetch('/api/admin/database-connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections.map((conn: any) => ({
          ...conn,
          lastConnected: conn.lastConnected ? new Date(conn.lastConnected) : undefined
        })))
        // Auto-select first database if none selected
        if (!selectedDatabase && data.connections.length > 0) {
          setSelectedDatabase(data.connections[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load database connections')
    } finally {
      setIsLoadingDatabases(false)
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const res = await fetch(`/api/data-models`)
      const json = await res.json()
      setModels(json.dataModels || [])
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load data models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadFolders = async () => {
    try {
      const res = await fetch('/api/folders?type=data_model')
      if (res.status === 503) {
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const loadDatabaseSchema = async (connectionId: string) => {
    setIsLoadingSchema(true)
    try {
      const response = await fetch(`/api/db/schema`)
      if (response.ok) {
        const data = await response.json()
        setDatabaseSchema(data)
      } else {
        toast.error('Failed to load database schema')
      }
    } catch (error) {
      console.error('Error loading schema:', error)
      toast.error('Failed to load database schema')
    } finally {
      setIsLoadingSchema(false)
    }
  }

  const { loadERDData } = useDatabaseMergedErdData({
    databaseSchema,
    setErdModels,
    setErdRelationships,
    setIsLoadingERD,
  })
  const getDatabaseIcon = (type: string) => {
    const asset = databaseTypes.find(t => t.code === type)
    if (asset?.icon) {
      return <span className="text-base">{asset.icon}</span>
    }
    return <Database className="h-4 w-4 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
      case 'disconnected':
        return <div className="h-2 w-2 rounded-full bg-gray-400" />
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500" />
      default:
        return null
    }
  }

  // Create new database connection
  const createConnection = async () => {
    try {
      const response = await fetch('/api/admin/database-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConnection.name,
          spaceId: newConnection.spaceId,
          type: newConnection.type,
          host: newConnection.host,
          port: newConnection.port,
          database: newConnection.database,
          username: newConnection.username,
          password: newConnection.password,
          scopeAllTables: newConnection.scopeAllTables,
          specificTables: newConnection.specificTables
        })
      })

      if (response.ok) {
        toast.success('Database connection created successfully')
        setShowAddConnection(false)
        resetNewConnection()
        loadConnections()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to create connection')
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast.error('Failed to create connection')
    }
  }

  // Test new connection before saving
  const testNewConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    try {
      const response = await fetch('/api/admin/database-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newConnection.type,
          host: newConnection.host,
          port: newConnection.port,
          database: newConnection.database,
          username: newConnection.username,
          password: newConnection.password
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionTestResult('success')
        if (data.tables) {
          setDiscoveredTables(data.tables)
        }
        toast.success('Connection successful!')
      } else {
        setConnectionTestResult('error')
        toast.error('Connection failed. Check your credentials.')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionTestResult('error')
      toast.error('Connection test failed')
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Reset new connection form
  const resetNewConnection = () => {
    setNewConnection({
      name: '',
      spaceId: '',
      type: 'postgresql',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      scopeAllDatabases: true,
      scopeAllTables: true,
      specificTables: []
    })
    setConnectionTestResult(null)
    setDiscoveredTables([])
  }

  // Open detail drawer for a model or table
  const openDetailDrawer = useCallback(async (item: { type: 'model' | 'table', id: string, name: string, displayName?: string, description?: string }) => {
    setSelectedDetailItem(item)
    setSelectedAttribute(null)
    setIsDetailDrawerOpen(true)

    if (item.type === 'model') {
      // Load model attributes from API
      setIsLoadingAttributes(true)
      try {
        const response = await fetch(`/api/data-models/${item.id}/attributes`)
        if (response.ok) {
          const data = await response.json()
          setModelAttributes(data.attributes || [])
        }
      } catch (error) {
        console.error('Error loading model attributes:', error)
        toast.error('Failed to load attributes')
      } finally {
        setIsLoadingAttributes(false)
      }
    } else {
      // For tables, the columns are already in databaseSchema
      setModelAttributes([])
    }
  }, [])

  // Load attribute options for dropdown type
  const loadAttributeOptions = useCallback(async (attributeId: string) => {
    setIsLoadingOptions(true)
    try {
      const response = await fetch(`/api/data-models/attributes/${attributeId}/options`)
      if (response.ok) {
        const data = await response.json()
        setAttributeOptions(data.options || [])
      }
    } catch (error) {
      console.error('Error loading attribute options:', error)
      setAttributeOptions([])
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  // Handle attribute click
  const handleAttributeClick = useCallback((attribute: any) => {
    setSelectedAttribute(attribute)
    // Load options if it's a dropdown type
    if (attribute.type?.toLowerCase() === 'dropdown' || attribute.type?.toLowerCase() === 'select' || attribute.type?.toLowerCase() === 'enum') {
      loadAttributeOptions(attribute.id)
    } else {
      setAttributeOptions([])
    }
  }, [loadAttributeOptions])

  // Close detail drawer
  const closeDetailDrawer = useCallback(() => {
    setIsDetailDrawerOpen(false)
    setSelectedDetailItem(null)
    setSelectedAttribute(null)
    setModelAttributes([])
    setAttributeOptions([])
  }, [])

  const { treeStructure, rootModels, toggleFolder } = useDatabaseMergedTree({
    folders,
    models,
    searchValue,
    setExpandedFolders,
  })

  return <DatabaseDataModelMergedView {...{ connections, selectedDatabase, setSelectedDatabase, databaseTypes, isLoadingDatabases, spaces, selectedSpaceFilter, setSelectedSpaceFilter, showAddConnection, setShowAddConnection, isTestingConnection, connectionTestResult, newConnection, setNewConnection, discoveredTables, models, isLoadingModels, searchValue, setSearchValue, expandedFolders, viewMode, setViewMode, databaseSchema, isLoadingSchema, schemaDisplayMode, setSchemaDisplayMode, modelQueries, setModelQueries, editingQueryModel, setEditingQueryModel, erdModels, setErdModels, erdRelationships, setErdRelationships, isLoadingERD, isDetailDrawerOpen, setIsDetailDrawerOpen, selectedDetailItem, selectedAttribute, modelAttributes, isLoadingAttributes, attributeOptions, isLoadingOptions, themeConfig, loadConnections, loadModels, loadERDData, getDatabaseIcon, getStatusIcon, createConnection, testNewConnection, resetNewConnection, openDetailDrawer, handleAttributeClick, closeDetailDrawer, treeStructure, rootModels, toggleFolder }} />
}

