'use client'

import { Skeleton } from '@/components/ui/skeleton'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { DrawerClose } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Database,
  Folder,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
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
  Play,
  Loader,
  Code,
  Building2,
  Filter,
  Eye,
  List,
  X,
  Settings,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  LayoutGrid,
  LayoutList,
  Rows3
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ERDDiagram from '@/components/erd/ERDDiagram'
import { DatabaseConnection } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { BrandingConfig } from '@/app/admin/features/system/types'

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

interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  created_at?: string
  updated_at?: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

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
  const [folders, setFolders] = useState<Folder[]>([])
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

  const loadERDData = async () => {
    setIsLoadingERD(true)
    try {
      // First try to load data models
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()

      const modelsWithAttributes: any[] = []

      for (const model of modelsData.dataModels || []) {
        try {
          const attrsRes = await fetch(`/api/data-models/${model.id}/attributes`)
          const attrsData = await attrsRes.json()

          modelsWithAttributes.push({
            ...model,
            attributes: (attrsData.attributes || []).map((attr: any) => ({
              id: attr.id,
              name: attr.name,
              display_name: attr.display_name || attr.name,
              type: attr.type || attr.data_type || 'TEXT',
              is_required: attr.is_required || false,
              is_unique: attr.is_unique || false,
              is_primary_key: attr.is_primary_key || false,
              is_foreign_key: attr.is_foreign_key || false,
              referenced_table: attr.referenced_table,
              referenced_column: attr.referenced_column
            }))
          })
        } catch (error) {
          console.error(`Error loading attributes for model ${model.id}:`, error)
          modelsWithAttributes.push({
            ...model,
            attributes: []
          })
        }
      }

      // If no data models, use database schema tables instead
      if (modelsWithAttributes.length === 0 && databaseSchema && databaseSchema.tables.length > 0) {
        const schemaModels = databaseSchema.tables.map((table, index) => ({
          id: `schema_${table.name}`,
          name: table.name,
          display_name: table.name,
          description: `Database table with ${table.columns.length} columns`,
          position: { x: (index % 4) * 300, y: Math.floor(index / 4) * 250 },
          attributes: table.columns.map((col, colIdx) => ({
            id: `${table.name}_${col.name}`,
            name: col.name,
            display_name: col.name,
            type: col.type,
            is_required: !col.nullable,
            is_unique: false,
            is_primary_key: col.name === 'id',
            is_foreign_key: col.name.endsWith('_id') && col.name !== 'id',
            referenced_table: col.name.endsWith('_id') && col.name !== 'id'
              ? col.name.replace(/_id$/, 's')
              : undefined
          }))
        }))
        setErdModels(schemaModels)

        // Auto-detect relationships from foreign keys
        const relationships: any[] = []
        schemaModels.forEach(model => {
          model.attributes.forEach((attr: any) => {
            if (attr.is_foreign_key && attr.referenced_table) {
              const targetModel = schemaModels.find(m =>
                m.name.toLowerCase() === attr.referenced_table?.toLowerCase() ||
                m.name.toLowerCase() === attr.referenced_table?.replace(/s$/, '').toLowerCase()
              )
              if (targetModel) {
                const targetAttr = targetModel.attributes.find((a: any) =>
                  a.name === 'id' || a.is_primary_key
                )
                if (targetAttr) {
                  relationships.push({
                    id: `${model.id}-${attr.id}-${targetModel.id}`,
                    fromModel: model.id,
                    toModel: targetModel.id,
                    fromAttribute: attr.id,
                    toAttribute: targetAttr.id,
                    type: 'one-to-many',
                    label: `${model.name} → ${targetModel.name}`
                  })
                }
              }
            }
          })
        })
        setErdRelationships(relationships)
        return
      }

      setErdModels(modelsWithAttributes)

      const relationships: any[] = []
      modelsWithAttributes.forEach(model => {
        model.attributes.forEach((attr: any) => {
          if (attr.is_foreign_key && attr.referenced_table) {
            const targetModel = modelsWithAttributes.find((m: any) =>
              m.name.toLowerCase() === attr.referenced_table?.toLowerCase()
            )
            if (targetModel) {
              const targetAttr = targetModel.attributes.find((a: any) =>
                a.name.toLowerCase() === attr.referenced_column?.toLowerCase() ||
                a.is_primary_key
              )
              if (targetAttr) {
                relationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name || model.name} → ${targetModel.display_name || targetModel.name}`
                })
              }
            }
          }
        })
      })

      setErdRelationships(relationships)
    } catch (error) {
      console.error('Error loading ERD data:', error)
      toast.error('Failed to load ERD data')
    } finally {
      setIsLoadingERD(false)
    }
  }

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

  // Build tree structure for data models
  const treeStructure = useMemo(() => {
    const folderMap = new Map<string, Folder>()
    const rootFolders: Folder[] = []

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], models: [] })
    })

    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          parent.children!.push(folderMap.get(folder.id)!)
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!)
      }
    })

    const filteredModels = searchValue
      ? models.filter(model =>
        (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
      )
      : models

    filteredModels.forEach(model => {
      if (model.folder_id) {
        const folder = folderMap.get(model.folder_id)
        if (folder) {
          folder.models!.push(model)
        }
      }
    })

    return rootFolders
  }, [folders, models, searchValue])

  const rootModels = useMemo(() => {
    const filtered = searchValue
      ? models.filter(model =>
        (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
      )
      : models
    return filtered.filter(model => !model.folder_id)
  }, [models, searchValue])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  const renderModelItem = (model: DataModel) => (
    <div
      key={`model:${model.id}`}
      className="group flex items-center gap-3 px-3 py-2.5 ml-6 rounded-lg transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'transparent',
        borderRadius: borderRadius,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      onClick={() => openDetailDrawer({
        type: 'model',
        id: model.id,
        name: model.name,
        displayName: model.display_name,
        description: model.description
      })}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
      >
        <Database className="h-3.5 w-3.5" style={{ color: primaryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-medium text-sm truncate"
          style={{ color: bodyText }}
        >
          {model.display_name || model.name}
        </div>
        {model.description && (
          <div
            className="text-xs truncate mt-0.5"
            style={{ color: bodyText, opacity: 0.6 }}
          >
            {model.description}
          </div>
        )}
      </div>
    </div>
  )

  const renderFolderItem = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)

    return (
      <div key={`folder:${folder.id}`} className="select-none">
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
            level === 0 && "font-medium"
          )}
          style={{
            paddingLeft: `${level * 16 + 12}px`,
            backgroundColor: 'transparent',
            borderRadius: borderRadius,
          }}
          onClick={() => toggleFolder(folder.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(folder.id)
            }}
            className="p-0.5 hover:bg-white/20 dark:hover:bg-white/10 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
            )}
          </button>

          <Folder
            className="h-4 w-4 transition-colors"
            style={{ color: isExpanded ? primaryColor : bodyText, opacity: isExpanded ? 1 : 0.6 }}
          />
          <span
            className="flex-1 truncate text-sm"
            style={{ color: bodyText }}
          >
            {folder.name}
          </span>
          {folder.models && folder.models.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {folder.models.length}
            </Badge>
          )}
        </div>

        {isExpanded && (
          <div className="mt-1">
            {(folder.models || []).map(renderModelItem)}
            {(folder.children || []).map(childFolder => renderFolderItem(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const selectedConnection = connections.find(c => c.id === selectedDatabase)

  // Get theme colors - precise engineering approach
  const primaryColor = themeConfig?.primaryColor || '#007AFF'
  const uiBg = themeConfig?.uiBackgroundColor || themeConfig?.topMenuBackgroundColor || '#ffffff'
  const uiBorder = themeConfig?.uiBorderColor || 'rgba(0, 0, 0, 0.06)'
  const bodyText = themeConfig?.bodyTextColor || '#0F172A'
  const bodyBg = themeConfig?.bodyBackgroundColor || '#FAFAFA'

  // Precise border styling
  const borderColor = uiBorder
  const borderWidth = themeConfig?.globalStyling?.borderWidth || '0.5px'
  const borderRadius = themeConfig?.globalStyling?.borderRadius || '8px'

  // Subtle backdrop for panels
  const panelBg = `color-mix(in srgb, ${uiBg} 95%, transparent)`
  const panelBackdrop = 'blur(30px) saturate(200%)'

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col font-sans" style={{ fontFamily: themeConfig?.globalStyling?.fontFamily || '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Main Layout - Split View */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel - Database List */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          {/* Precise Panel */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius: borderRadius,
              borderColor: borderColor,
              borderWidth: borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: bodyText }}
                >
                  Databases
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConnections}
                    disabled={isLoadingDatabases}
                    className="h-7 w-7 p-0 rounded-lg transition-all"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isLoadingDatabases && "animate-spin")} />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddConnection(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Space Filter */}
              <Select value={selectedSpaceFilter || 'all'} onValueChange={(v) => setSelectedSpaceFilter(v === 'all' ? null : v)}>
                <SelectTrigger className="w-full h-8 text-xs border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <SelectValue placeholder="All Spaces" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>All Spaces</span>
                    </div>
                  </SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p
                className="text-xs mt-2"
                style={{ color: bodyText, opacity: 0.6 }}
              >
                {connections.length + 1} connection{connections.length !== 0 ? 's' : ''} (1 built-in)
              </p>
            </div>

            {/* Database List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {/* Built-in Database - Always first */}
                {(selectedSpaceFilter === null || selectedSpaceFilter === '__system__') && (
                  <button
                    onClick={() => setSelectedDatabase('__builtin__')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 text-left mb-2",
                      selectedDatabase === '__builtin__' && "shadow-lg"
                    )}
                    style={{
                      backgroundColor: selectedDatabase === '__builtin__'
                        ? `color-mix(in srgb, ${primaryColor} 6%, transparent)`
                        : 'transparent',
                      border: selectedDatabase === '__builtin__'
                        ? `${borderWidth} solid color-mix(in srgb, ${primaryColor} 15%, transparent)`
                        : `${borderWidth} solid color-mix(in srgb, ${primaryColor} 8%, transparent)`,
                      borderRadius: borderRadius,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDatabase !== '__builtin__') {
                        e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDatabase !== '__builtin__') {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <div className="flex-shrink-0 relative">
                      <Server className="h-4 w-4" style={{ color: primaryColor }} />
                      <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: selectedDatabase === '__builtin__' ? primaryColor : bodyText
                          }}
                        >
                          Built-in Database
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          System
                        </Badge>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        PostgreSQL • localhost:5432
                      </div>
                    </div>
                  </button>
                )}

                {/* Separator */}
                {(selectedSpaceFilter === null || selectedSpaceFilter === '__system__') && connections.length > 0 && (
                  <div className="flex items-center gap-2 py-2 px-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">External</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {isLoadingDatabases ? (
                  <div
                    className="flex flex-col items-center justify-center py-12"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                    <p className="text-sm">Loading databases...</p>
                  </div>
                ) : (
                  connections
                    .filter(conn => selectedSpaceFilter === null || conn.spaceId === selectedSpaceFilter)
                    .map(connection => {
                      const isSelected = selectedDatabase === connection.id
                      return (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedDatabase(connection.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 text-left",
                            isSelected && "shadow-lg"
                          )}
                          style={{
                            backgroundColor: isSelected
                              ? `color-mix(in srgb, ${primaryColor} 6%, transparent)`
                              : 'transparent',
                            border: isSelected
                              ? `${borderWidth} solid color-mix(in srgb, ${primaryColor} 15%, transparent)`
                              : 'none',
                            borderRadius: borderRadius,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div className="flex-shrink-0">
                            {getDatabaseIcon(connection.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-sm font-medium truncate"
                                style={{
                                  color: isSelected ? primaryColor : bodyText
                                }}
                              >
                                {connection.name}
                              </span>
                              {connection.spaceName && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                  {connection.spaceName}
                                </Badge>
                              )}
                              {getStatusIcon(connection.status)}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: bodyText, opacity: 0.6 }}
                            >
                              {connection.host}:{connection.port}
                            </div>
                          </div>
                        </button>
                      )
                    })
                )}

                {/* Empty state for external connections */}
                {!isLoadingDatabases && connections.filter(conn => selectedSpaceFilter === null || conn.spaceId === selectedSpaceFilter).length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-8"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <Database className="h-8 w-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No external databases</p>
                    <p className="text-xs mt-1">Click "Add" to connect one</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Body - Data Models or Tables */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Precise Panel */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius: borderRadius,
              borderColor: borderColor,
              borderWidth: borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {viewMode === 'schema' ? (
                      <Table className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : viewMode === 'erd' ? (
                      <GitBranch className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : (
                      <Folder className="h-5 w-5" style={{ color: primaryColor }} />
                    )}
                    <h2
                      className="text-lg font-semibold tracking-tight"
                      style={{ color: bodyText }}
                    >
                      {viewMode === 'schema' ? 'Database Schema' : viewMode === 'erd' ? 'ERD Diagram' : 'Data Models'}
                    </h2>
                  </div>
                  <p
                    className="text-xs ml-8"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    {viewMode === 'schema'
                      ? selectedConnection
                        ? `Schema for ${selectedConnection.name}`
                        : 'Select a database to view schema'
                      : viewMode === 'erd'
                        ? 'Entity Relationship Diagram'
                        : 'Organize your data models'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="model">
                        <div className="flex items-center gap-2">
                          <Code className="h-3.5 w-3.5" />
                          <span>Model</span>
                        </div>
                      </SelectItem>
                      {selectedDatabase ? (
                        <SelectItem value="schema">
                          <div className="flex items-center gap-2">
                            <Table className="h-3.5 w-3.5" />
                            <span>Schema</span>
                          </div>
                        </SelectItem>
                      ) : null}
                      <SelectItem value="erd">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>ERD</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {viewMode === 'model' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadModels}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoadingModels && "animate-spin")} />
                    </Button>
                  )}
                  {viewMode === 'erd' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadERDData}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoadingERD && "animate-spin")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'schema' ? (
                // Database Schema View
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {!selectedDatabase ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Select a database</p>
                        <p className="text-xs mt-1">Choose a database from the left panel to view its schema</p>
                      </div>
                    ) : isLoadingSchema ? (
                      <div className="w-full space-y-3 p-4">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    ) : !databaseSchema ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No schema data</p>
                      </div>
                    ) : databaseSchema.tables.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No tables found</p>
                      </div>
                    ) : (
                      <>
                        {/* Schema View Header with Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: bodyText }}>
                              {databaseSchema.tables.length} Tables
                            </span>
                          </div>
                          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                            <Button
                              variant={schemaDisplayMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('grid')}
                              title="Grid View"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={schemaDisplayMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('list')}
                              title="List View"
                            >
                              <LayoutList className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={schemaDisplayMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('table')}
                              title="Table View"
                            >
                              <Rows3 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Grid View */}
                        {schemaDisplayMode === 'grid' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {databaseSchema.tables.map(table => (
                              <div
                                key={table.name}
                                className="p-4 transition-all border cursor-pointer hover:shadow-md group"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                                  borderColor: borderColor,
                                  borderWidth: borderWidth,
                                  borderRadius: borderRadius,
                                  borderStyle: 'solid',
                                }}
                                onClick={() => openDetailDrawer({
                                  type: 'table',
                                  id: table.name,
                                  name: table.name,
                                  description: `${table.columns.length} columns`
                                })}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div
                                    className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                                    style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
                                  >
                                    <Table className="h-5 w-5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3
                                      className="font-semibold text-sm font-mono truncate"
                                      style={{ color: bodyText }}
                                    >
                                      {table.name}
                                    </h3>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: primaryColor }}>
                                      {table.columns.length}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      Columns
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: bodyText }}>~</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Records</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: bodyText }}>~</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Size</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* List View */}
                        {schemaDisplayMode === 'list' && (
                          <div className="space-y-2">
                            {databaseSchema.tables.map(table => (
                              <div
                                key={table.name}
                                className="flex items-center gap-4 p-3 transition-all border cursor-pointer hover:shadow-lg group"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                                  borderColor: borderColor,
                                  borderWidth: borderWidth,
                                  borderRadius: borderRadius,
                                  borderStyle: 'solid',
                                }}
                                onClick={() => openDetailDrawer({
                                  type: 'table',
                                  id: table.name,
                                  name: table.name,
                                  description: `${table.columns.length} columns`
                                })}
                              >
                                <div
                                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                                  style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
                                >
                                  <Table className="h-4 w-4" style={{ color: primaryColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono font-medium text-sm" style={{ color: bodyText }}>
                                    {table.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">{table.columns.length} cols</Badge>
                                <Badge variant="secondary" className="text-xs">~ rows</Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Table View */}
                        {schemaDisplayMode === 'table' && (
                          <div className="border rounded-lg overflow-hidden" style={{ borderColor: borderColor }}>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b" style={{ borderColor: borderColor }}>
                                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Table Name</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Columns</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Records</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Size</th>
                                </tr>
                              </thead>
                              <tbody>
                                {databaseSchema.tables.map(table => (
                                  <tr
                                    key={table.name}
                                    className="border-b last:border-0 cursor-pointer hover:bg-primary/5 transition-colors"
                                    style={{ borderColor: borderColor }}
                                    onClick={() => openDetailDrawer({
                                      type: 'table',
                                      id: table.name,
                                      name: table.name,
                                      description: `${table.columns.length} columns`
                                    })}
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <Table className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                                        <span className="font-mono font-medium" style={{ color: bodyText }}>{table.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <Badge variant="outline">{table.columns.length}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-center text-muted-foreground">~</td>
                                    <td className="py-3 px-4 text-center text-muted-foreground">~</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              ) : viewMode === 'erd' ? (
                // ERD Diagram View
                <div className="h-full relative">
                  {isLoadingERD ? (
                    <div className="w-full space-y-3 p-4">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                    </div>
                  ) : erdModels.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center h-full"
                      style={{ color: bodyText, opacity: 0.6 }}
                    >
                      <GitBranch className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No data models found</p>
                      <p className="text-xs mt-1">Create data models to visualize relationships</p>
                    </div>
                  ) : (
                    <ERDDiagram
                      models={erdModels.map(model => ({
                        id: model.id,
                        name: model.name,
                        display_name: model.display_name || model.name,
                        description: model.description,
                        attributes: model.attributes || [],
                        position: model.position
                      }))}
                      relationships={erdRelationships}
                      onUpdateModel={(updatedModel) => {
                        setErdModels(prev => prev.map(m => m.id === updatedModel.id ? { ...m, ...updatedModel } : m))
                      }}
                      onUpdateAttribute={async (modelId, attribute) => {
                        try {
                          const res = await fetch(`/api/data-models/${modelId}/attributes/${attribute.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(attribute)
                          })
                          if (res.ok) {
                            setErdModels(prev => prev.map(model =>
                              model.id === modelId
                                ? {
                                  ...model, attributes: model.attributes.map((attr: any) =>
                                    attr.id === attribute.id ? attribute : attr
                                  )
                                }
                                : model
                            ))
                          }
                        } catch (error) {
                          console.error('Error updating attribute:', error)
                          toast.error('Failed to update attribute')
                        }
                      }}
                      onDeleteAttribute={async (modelId, attributeId) => {
                        try {
                          const res = await fetch(`/api/data-models/${modelId}/attributes/${attributeId}`, {
                            method: 'DELETE'
                          })
                          if (res.ok) {
                            setErdModels(prev => prev.map(model =>
                              model.id === modelId
                                ? { ...model, attributes: model.attributes.filter((attr: any) => attr.id !== attributeId) }
                                : model
                            ))
                          }
                        } catch (error) {
                          console.error('Error deleting attribute:', error)
                          toast.error('Failed to delete attribute')
                        }
                      }}
                      onCreateRelationship={(relationship) => {
                        const newRelationship = {
                          ...relationship,
                          id: `${relationship.fromModel}-${relationship.fromAttribute}-${relationship.toModel}-${relationship.toAttribute}`
                        }
                        setErdRelationships(prev => [...prev, newRelationship])
                        toast.success('Relationship created')
                      }}
                      onUpdateRelationship={(relationship) => {
                        setErdRelationships(prev => prev.map(r => r.id === relationship.id ? relationship : r))
                        toast.success('Relationship updated')
                      }}
                      onDeleteRelationship={(relationshipId) => {
                        setErdRelationships(prev => prev.filter(r => r.id !== relationshipId))
                        toast.success('Relationship deleted')
                      }}
                    />
                  )}
                </div>
              ) : (
                // Data Model View
                <div className="flex flex-col h-full">
                  {/* Search Bar */}
                  <div
                    className="px-6 pt-4 pb-3 border-b"
                    style={{ borderColor: uiBorder }}
                  >
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: bodyText, opacity: 0.5 }}
                      />
                      <Input
                        placeholder={selectedDatabase === '__builtin__' ? "Search tables..." : "Search models..."}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10 h-9 backdrop-blur-sm text-sm"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                          borderColor: borderColor,
                          borderWidth: borderWidth,
                          borderRadius: borderRadius,
                        }}
                      />
                    </div>
                  </div>

                  {/* Content - Data Models from Spaces */}
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {/* Always show Data Models from API */}
                      {isLoadingModels ? (
                        <div className="w-full space-y-3 p-4">
                          <Skeleton className="h-10 w-full rounded-md" />
                          <Skeleton className="h-32 w-full rounded-md" />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Root Models */}
                          {rootModels.length > 0 && (
                            <div className="space-y-1 mb-4">
                              <div
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: bodyText, opacity: 0.6 }}
                              >
                                <Database className="h-3.5 w-3.5" />
                                <span>Data Models ({rootModels.length})</span>
                              </div>
                              <div className="space-y-0.5">
                                {rootModels.map(renderModelItem)}
                              </div>
                            </div>
                          )}

                          {/* Folders */}
                          {treeStructure.map(folder => renderFolderItem(folder))}

                          {/* Empty State */}
                          {models.length === 0 && folders.length === 0 && (
                            <div
                              className="flex flex-col items-center justify-center py-16"
                              style={{ color: bodyText, opacity: 0.6 }}
                            >
                              <Folder className="h-12 w-12 mb-4 opacity-50" />
                              <p className="text-sm font-medium">No data models yet</p>
                              <p className="text-xs mt-1">Create your first data model to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Database Connection Dialog */}
      <Dialog open={showAddConnection} onOpenChange={(open) => {
        setShowAddConnection(open)
        if (!open) resetNewConnection()
      }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Add Database Connection
            </DialogTitle>
            <DialogDescription>
              Connect to an external database to use its tables as data models
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conn-name">Connection Name</Label>
                <Input
                  id="conn-name"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  placeholder="My Database"
                />
              </div>
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="conn-type">Database Type</Label>
                <Select value={newConnection.type} onValueChange={(value) => {
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
              <div className="space-y-2">
                <Label htmlFor="conn-host">Host</Label>
                <Input
                  id="conn-host"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  placeholder="localhost"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conn-port">Port</Label>
                <Input
                  id="conn-port"
                  type="number"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: parseInt(e.target.value) || 5432 })}
                  placeholder="5432"
                />
              </div>
              <div className="col-span-2 space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="conn-username">Username</Label>
                <Input
                  id="conn-username"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  placeholder="user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conn-password">Password</Label>
                <Input
                  id="conn-password"
                  type="password"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Table Scope Selection */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-muted-foreground" />
                    <Label>Table Scope</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose which tables to import as data models
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newConnection.scopeAllTables}
                    onCheckedChange={(checked) => setNewConnection({
                      ...newConnection,
                      scopeAllTables: checked === true,
                      specificTables: checked ? [] : newConnection.specificTables
                    })}
                  />
                  <span className="text-sm">All Tables</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={!newConnection.scopeAllTables}
                    onCheckedChange={(checked) => setNewConnection({
                      ...newConnection,
                      scopeAllTables: checked !== true
                    })}
                  />
                  <span className="text-sm">Specific Tables</span>
                </label>
              </div>

              {!newConnection.scopeAllTables && discoveredTables.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Select tables to import:</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {discoveredTables.map(table => (
                        <label key={table} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                          <Checkbox
                            checked={newConnection.specificTables.includes(table)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewConnection({
                                  ...newConnection,
                                  specificTables: [...newConnection.specificTables, table]
                                })
                              } else {
                                setNewConnection({
                                  ...newConnection,
                                  specificTables: newConnection.specificTables.filter(t => t !== table)
                                })
                              }
                            }}
                          />
                          <span className="text-sm font-mono">{table}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!newConnection.scopeAllTables && discoveredTables.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Test connection first to discover available tables
                </p>
              )}
            </div>

            {/* Connection Test Result */}
            {connectionTestResult && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-sm",
                connectionTestResult === 'success' ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              )}>
                {connectionTestResult === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Connection successful! {discoveredTables.length > 0 && `Found ${discoveredTables.length} tables.`}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Connection failed. Please check your credentials.
                  </>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={testNewConnection}
              disabled={!newConnection.host || !newConnection.database || isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddConnection(false)
                resetNewConnection()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createConnection}
              disabled={!newConnection.name || !newConnection.host || !newConnection.spaceId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Detail Drawer - Model/Table Columns and Attributes */}
      <CentralizedDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        title={selectedAttribute
          ? (selectedAttribute.display_name || selectedAttribute.name)
          : (selectedDetailItem?.displayName || selectedDetailItem?.name)}
        description={selectedAttribute
          ? `Attribute of ${selectedDetailItem?.displayName || selectedDetailItem?.name}`
          : (selectedDetailItem?.type === 'model' ? 'Data Model' : 'Database Table')}
        icon={selectedDetailItem?.type === 'model' ? Database : Table}
        headerActions={selectedAttribute && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedAttribute(null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        width="w-[720px]"
        floating={true}
        floatingMargin="16px"
      >
        <div className="flex-1 overflow-hidden">
          {!selectedAttribute ? (
            /* Attribute/Column List */
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <List className="h-3.5 w-3.5" />
                    {selectedDetailItem?.type === 'model' ? 'Attributes' : 'Columns'}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedDetailItem?.type === 'model'
                      ? modelAttributes.length
                      : databaseSchema?.tables.find(t => t.name === selectedDetailItem?.name)?.columns.length || 0}
                  </Badge>
                </div>

                {isLoadingAttributes ? (
                  <div className="w-full space-y-3 p-4">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                ) : selectedDetailItem?.type === 'model' ? (
                  /* Model Attributes */
                  modelAttributes.length > 0 ? (
                    modelAttributes.map((attr: any) => (
                      <div
                        key={attr.id}
                        className="group p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => handleAttributeClick(attr)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded flex items-center justify-center bg-muted">
                              {attr.type?.toLowerCase().includes('text') || attr.type?.toLowerCase().includes('string') ? (
                                <Type className="h-3 w-3 text-muted-foreground" />
                              ) : attr.type?.toLowerCase().includes('number') || attr.type?.toLowerCase().includes('int') ? (
                                <Hash className="h-3 w-3 text-muted-foreground" />
                              ) : attr.type?.toLowerCase().includes('bool') ? (
                                <ToggleLeft className="h-3 w-3 text-muted-foreground" />
                              ) : attr.type?.toLowerCase().includes('date') ? (
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <Settings className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{attr.display_name || attr.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{attr.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {attr.is_required && <Badge variant="secondary" className="text-[9px] py-0 h-4">Required</Badge>}
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <List className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No attributes defined</p>
                    </div>
                  )
                ) : (
                  /* Table Columns as Table */
                  (() => {
                    const table = databaseSchema?.tables.find(t => t.name === selectedDetailItem?.name)
                    return table && table.columns.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Column</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Type</th>
                              <th className="text-center py-2 px-3 font-medium text-muted-foreground text-xs">Nullable</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Default</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((col, idx) => (
                              <tr
                                key={idx}
                                className="border-b last:border-0 cursor-pointer hover:bg-primary/5 transition-colors"
                                onClick={() => setSelectedAttribute(col)}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-medium">{col.name}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
                                    {col.type}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {col.nullable ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {col.default || '-'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Table className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No columns found</p>
                      </div>
                    )
                  })()
                )}
              </div>
            </ScrollArea>
          ) : (
            /* Attribute Detail View */
            <ScrollArea className="h-[calc(100vh-200px)]">
              {selectedDetailItem?.type === 'model' &&
                (selectedAttribute.type?.toLowerCase() === 'dropdown' ||
                  selectedAttribute.type?.toLowerCase() === 'select' ||
                  selectedAttribute.type?.toLowerCase() === 'enum') ? (
                /* Model Attribute with Options Tab */
                <Tabs defaultValue="properties" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="options">Options</TabsTrigger>
                  </TabsList>
                  <TabsContent value="properties" className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Display Name</Label>
                        <p className="font-medium">{selectedAttribute.display_name || selectedAttribute.name}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Field Name</Label>
                        <p className="font-mono text-sm">{selectedAttribute.name}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="font-mono text-sm">{selectedAttribute.type}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Required</Label>
                          <p>{selectedAttribute.is_required ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Unique</Label>
                          <p>{selectedAttribute.is_unique ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      {selectedAttribute.description && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <p className="text-sm">{selectedAttribute.description}</p>
                        </div>
                      )}
                      {selectedAttribute.default_value && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Default Value</Label>
                          <p className="font-mono text-sm">{selectedAttribute.default_value}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="options" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Dropdown Options</Label>
                      <Badge variant="outline" className="text-[10px]">{attributeOptions.length}</Badge>
                    </div>
                    {isLoadingOptions ? (
                      <div className="w-full space-y-3 p-4">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-12 w-full rounded-md" />
                      </div>
                    ) : attributeOptions.length > 0 ? (
                      <div className="space-y-2">
                        {attributeOptions.map((opt: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: opt.color || primaryColor }}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{opt.label || opt.value}</div>
                              {opt.value !== opt.label && (
                                <div className="text-xs text-muted-foreground font-mono">{opt.value}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <List className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No options defined</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                /* Regular Attribute/Column Properties */
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">
                      {selectedDetailItem?.type === 'model' ? 'Display Name' : 'Column Name'}
                    </Label>
                    <p className="font-medium">{selectedAttribute.display_name || selectedAttribute.name}</p>
                  </div>
                  {selectedDetailItem?.type === 'model' && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Field Name</Label>
                      <p className="font-mono text-sm">{selectedAttribute.name}</p>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="font-mono text-sm">{selectedAttribute.type}</p>
                  </div>
                  {selectedDetailItem?.type === 'model' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Required</Label>
                        <p>{selectedAttribute.is_required ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Unique</Label>
                        <p>{selectedAttribute.is_unique ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs text-muted-foreground">Nullable</Label>
                        <p>{selectedAttribute.nullable ? 'Yes' : 'No'}</p>
                      </div>
                      {selectedAttribute.default !== undefined && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Default</Label>
                          <p className="font-mono text-sm">{selectedAttribute.default || '-'}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedAttribute.description && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm">{selectedAttribute.description}</p>
                    </div>
                  )}
                  {selectedAttribute.default_value && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Default Value</Label>
                      <p className="font-mono text-sm">{selectedAttribute.default_value}</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </CentralizedDrawer>
    </div >
  )
}
