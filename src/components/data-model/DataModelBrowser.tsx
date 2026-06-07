'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
    Database,
    Table,
    Columns,
    RefreshCw,
    Search,
    Edit,
    Trash2,
    Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DataModelConnectionHeader } from './DataModelConnectionHeader'
import { DataModelBrowserDialogs } from './DataModelBrowserDialogs'
import { getTypeIcon } from './dataModelTypeIcon'
import {
    BUILTIN_CONNECTION_ID,
    SPACE_MEMBERS_ATTRIBUTES,
    SPACE_MEMBERS_MODEL,
    SPACE_MEMBERS_MODEL_ID,
    type Attribute,
    type ColumnInfo,
    type DataModel,
    type ExternalConnection,
    type TableInfo,
} from './dataModelBrowserModel'

interface DataModelBrowserProps {
    spaceId: string
}

export function DataModelBrowser({ spaceId }: DataModelBrowserProps) {
    // Connection state
    const [connections, setConnections] = useState<ExternalConnection[]>([])
    const [selectedConnectionId, setSelectedConnectionId] = useState<string>(BUILTIN_CONNECTION_ID)
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)

    // External DB state
    const [tables, setTables] = useState<TableInfo[]>([])
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
    const [columns, setColumns] = useState<ColumnInfo[]>([])
    const [isLoadingTables, setIsLoadingTables] = useState(false)
    const [isLoadingColumns, setIsLoadingColumns] = useState(false)
    const [tableSearch, setTableSearch] = useState('')

    // Built-in DB state
    const [dataModels, setDataModels] = useState<DataModel[]>([])
    const [selectedModel, setSelectedModel] = useState<DataModel | null>(null)
    const [attributes, setAttributes] = useState<Attribute[]>([])
    const [isLoadingModels, setIsLoadingModels] = useState(false)
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)
    const [modelSearch, setModelSearch] = useState('')

    // Dialog state
    const [showNewModelDrawer, setShowNewModelDrawer] = useState(false)
    const [showExternalWizard, setShowExternalWizard] = useState(false)
    const [editingModel, setEditingModel] = useState<DataModel | null>(null)

    const isBuiltIn = selectedConnectionId === BUILTIN_CONNECTION_ID

    // Load connections on mount
    useEffect(() => {
        loadConnections()
    }, [spaceId])

    // Load data when connection changes
    useEffect(() => {
        if (isBuiltIn) {
            loadDataModels()
            setTables([])
            setSelectedTable(null)
            setColumns([])
        } else if (selectedConnectionId) {
            loadTables()
            setDataModels([])
            setSelectedModel(null)
            setAttributes([])
        }
    }, [selectedConnectionId, spaceId])

    // Load attributes/columns when selection changes
    useEffect(() => {
        if (selectedModel?.id) {
            loadAttributes(selectedModel.id)
        }
    }, [selectedModel?.id])

    useEffect(() => {
        if (selectedTable && !isBuiltIn) {
            loadColumns(selectedTable)
        }
    }, [selectedTable, isBuiltIn])

    const loadConnections = async () => {
        setIsLoadingConnections(true)
        try {
            const res = await fetch(`/api/external-connections?space_id=${spaceId}`)
            if (res.ok) {
                const data = await res.json()
                setConnections(data.connections || [])
            }
        } catch (error) {
            console.error('Failed to load connections:', error)
        } finally {
            setIsLoadingConnections(false)
        }
    }

    const loadDataModels = async () => {
        setIsLoadingModels(true)
        try {
            const res = await fetch(`/api/data-models?space_id=${spaceId}&page=1&limit=100`)
            if (res.ok) {
                const data = await res.json()
                // Prepend the virtual Space Members model
                setDataModels([SPACE_MEMBERS_MODEL, ...(data.dataModels || [])])
            }
        } catch (error) {
            console.error('Failed to load data models:', error)
        } finally {
            setIsLoadingModels(false)
        }
    }

    const loadAttributes = async (modelId: string) => {
        // Handle virtual Space Members model
        if (modelId === SPACE_MEMBERS_MODEL_ID) {
            setAttributes(SPACE_MEMBERS_ATTRIBUTES)
            return
        }
        setIsLoadingAttributes(true)
        try {
            const res = await fetch(`/api/data-models/${modelId}/attributes`)
            if (res.ok) {
                const data = await res.json()
                setAttributes(data.attributes || [])
            }
        } catch (error) {
            console.error('Failed to load attributes:', error)
        } finally {
            setIsLoadingAttributes(false)
        }
    }

    const loadTables = async () => {
        if (!selectedConnectionId || isBuiltIn) return
        setIsLoadingTables(true)
        try {
            const res = await fetch(`/api/external-connections/${selectedConnectionId}/metadata`)
            if (res.ok) {
                const data = await res.json()
                // Flatten tables from all schemas
                const allTables: TableInfo[] = []
                if (data.tablesBySchema) {
                    for (const [schema, tableList] of Object.entries(data.tablesBySchema)) {
                        for (const tableName of tableList as string[]) {
                            allTables.push({ table_name: tableName, table_schema: schema })
                        }
                    }
                }
                setTables(allTables)
            }
        } catch (error) {
            console.error('Failed to load tables:', error)
        } finally {
            setIsLoadingTables(false)
        }
    }

    const loadColumns = async (table: TableInfo) => {
        if (!selectedConnectionId || isBuiltIn) return
        setIsLoadingColumns(true)
        try {
            const res = await fetch(`/api/external-connections/${selectedConnectionId}/metadata?schema=${table.table_schema}&table=${table.table_name}`)
            if (res.ok) {
                const data = await res.json()
                setColumns(data.columns || [])
            }
        } catch (error) {
            console.error('Failed to load columns:', error)
        } finally {
            setIsLoadingColumns(false)
        }
    }

    const handleConnectionChange = (connectionId: string) => {
        setSelectedConnectionId(connectionId)
        setSelectedTable(null)
        setSelectedModel(null)
        setColumns([])
        setAttributes([])
    }

    const handleSaveModel = async (formData: any) => {
        try {
            const body = {
                ...formData,
                space_ids: [spaceId]
            }

            const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
            const method = editingModel ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error('Failed to save model')

            toast.success(editingModel ? 'Model updated' : 'Model created')
            setShowNewModelDrawer(false)
            setEditingModel(null)
            await loadDataModels()
        } catch (error: any) {
            toast.error(error.message || 'Failed to save model')
        }
    }

    const handleSaveExternalConnection = async (data: any) => {
        try {
            // Create connection
            const connectionPayload = {
                space_id: spaceId,
                name: data.name,
                connection_type: data.connection_type,
                db_type: data.db_type,
                host: data.host,
                port: parseInt(data.port),
                database: data.database,
                username: data.username,
                password: data.password,
                options: {}
            }

            const connectionRes = await fetch('/api/external-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(connectionPayload)
            })

            if (!connectionRes.ok) throw new Error('Failed to create connection')

            toast.success('External connection created')
            setShowExternalWizard(false)
            await loadConnections()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create connection')
        }
    }

    const handleDeleteModel = async (model: DataModel) => {
        if (!confirm(`Delete model "${model.display_name || model.name}"?`)) return
        try {
            const res = await fetch(`/api/data-models/${model.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success('Model deleted')
            setSelectedModel(null)
            await loadDataModels()
        } catch (error) {
            toast.error('Failed to delete model')
        }
    }

    const filteredTables = tables.filter(t =>
        t.table_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        t.table_schema.toLowerCase().includes(tableSearch.toLowerCase())
    )

    const filteredModels = dataModels.filter(m =>
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.display_name?.toLowerCase().includes(modelSearch.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <DataModelConnectionHeader
                connections={connections}
                isBuiltIn={isBuiltIn}
                isLoadingConnections={isLoadingConnections}
                selectedConnectionId={selectedConnectionId}
                handleConnectionChange={handleConnectionChange}
                loadDataModels={loadDataModels}
                loadTables={loadTables}
                setEditingModel={setEditingModel}
                setShowExternalWizard={setShowExternalWizard}
                setShowNewModelDrawer={setShowNewModelDrawer}
            />

            {/* Split Panel Browser */}
            {/* Split Panel Browser */}
            <div className="grid grid-cols-12 gap-4 min-h-[500px]">
                {/* Left Panel */}
                <Card className="col-span-4 bg-card">
                    <CardHeader className="py-3 px-4 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {isBuiltIn ? (
                                    <>
                                        <Database className="h-4 w-4" />
                                        Data Models
                                    </>
                                ) : (
                                    <>
                                        <Table className="h-4 w-4" />
                                        Tables
                                    </>
                                )}
                            </CardTitle>
                            <Badge variant="secondary">
                                {isBuiltIn ? filteredModels.length : filteredTables.length}
                            </Badge>
                        </div>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isBuiltIn ? "Search models..." : "Search tables..."}
                                value={isBuiltIn ? modelSearch : tableSearch}
                                onChange={(e) => isBuiltIn ? setModelSearch(e.target.value) : setTableSearch(e.target.value)}
                                className="pl-8 h-8"
                            />
                        </div>
                    </CardHeader>
                    <ScrollArea className="h-[400px]">
                        <div className="p-2 space-y-1">
                            {isBuiltIn ? (
                                // Data Models list
                                isLoadingModels ? (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredModels.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground">
                                        <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>No data models found</p>
                                        <Button variant="link" size="sm" onClick={() => setShowNewModelDrawer(true)}>
                                            Create your first model
                                        </Button>
                                    </div>
                                ) : (
                                    filteredModels.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-muted transition-colors ${selectedModel?.id === model.id ? 'bg-primary/10 text-primary' : ''
                                                }`}
                                        >
                                            {model.id === SPACE_MEMBERS_MODEL_ID ? (
                                                <Users className="h-4 w-4 text-violet-500" />
                                            ) : (
                                                <Database className="h-4 w-4 text-blue-500" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{model.display_name || model.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{model.slug}</div>
                                            </div>
                                            {model.source_type === 'SYSTEM' && (
                                                <Badge variant="secondary" className="text-xs">System</Badge>
                                            )}
                                            {model.source_type === 'EXTERNAL' && (
                                                <Badge variant="outline" className="text-xs">External</Badge>
                                            )}
                                        </button>
                                    ))
                                )
                            ) : (
                                // Tables list
                                isLoadingTables ? (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredTables.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground">
                                        <Table className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>No tables found</p>
                                    </div>
                                ) : (
                                    filteredTables.map(table => (
                                        <button
                                            key={`${table.table_schema}.${table.table_name}`}
                                            onClick={() => setSelectedTable(table)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-muted transition-colors ${selectedTable?.table_name === table.table_name && selectedTable?.table_schema === table.table_schema
                                                ? 'bg-primary/10 text-primary'
                                                : ''
                                                }`}
                                        >
                                            <Table className="h-4 w-4 text-green-500" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{table.table_name}</div>
                                                <div className="text-xs text-muted-foreground">{table.table_schema}</div>
                                            </div>
                                        </button>
                                    ))
                                )
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right Panel */}
                <Card className="col-span-8 bg-card">
                    <CardHeader className="py-3 px-4 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {isBuiltIn ? (
                                    <>
                                        <Columns className="h-4 w-4" />
                                        {selectedModel ? `Attributes of ${selectedModel.display_name || selectedModel.name}` : 'Attributes'}
                                    </>
                                ) : (
                                    <>
                                        <Columns className="h-4 w-4" />
                                        {selectedTable ? `Columns of ${selectedTable.table_name}` : 'Columns'}
                                    </>
                                )}
                            </CardTitle>
                            {isBuiltIn && selectedModel && selectedModel.id !== SPACE_MEMBERS_MODEL_ID && (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingModel(selectedModel); setShowNewModelDrawer(true) }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteModel(selectedModel)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <ScrollArea className="h-[400px]">
                        <div className="p-2">
                            {isBuiltIn ? (
                                // Attributes view
                                !selectedModel ? (
                                    <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                                        <Database className="h-12 w-12 mb-4 opacity-50" />
                                        <p>Select a data model to view its attributes</p>
                                    </div>
                                ) : isLoadingAttributes ? (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : attributes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                                        <Columns className="h-10 w-10 mb-4 opacity-50" />
                                        <p>No attributes defined</p>
                                        <Button variant="link" size="sm" onClick={() => { setEditingModel(selectedModel); setShowNewModelDrawer(true) }}>
                                            Add attributes
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {attributes.map(attr => (
                                            <div
                                                key={attr.id}
                                                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors"
                                            >
                                                {getTypeIcon(attr.type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{attr.display_name || attr.name}</div>
                                                    <div className="text-xs text-muted-foreground">{attr.name}</div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">{attr.type}</Badge>
                                                {attr.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                                {attr.is_unique && <Badge variant="secondary" className="text-xs">Unique</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                // Columns view
                                !selectedTable ? (
                                    <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                                        <Table className="h-12 w-12 mb-4 opacity-50" />
                                        <p>Select a table to view its columns</p>
                                    </div>
                                ) : isLoadingColumns ? (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : columns.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                                        <Columns className="h-10 w-10 mb-4 opacity-50" />
                                        <p>No columns found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {columns.map(col => (
                                            <div
                                                key={col.column_name}
                                                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors"
                                            >
                                                {getTypeIcon(col.data_type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{col.column_name}</div>
                                                    {col.column_default && (
                                                        <div className="text-xs text-muted-foreground">Default: {col.column_default}</div>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-xs">{col.data_type}</Badge>
                                                {col.is_nullable === 'NO' && <Badge variant="secondary" className="text-xs">NOT NULL</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            <DataModelBrowserDialogs
                editingModel={editingModel}
                showExternalWizard={showExternalWizard}
                showNewModelDrawer={showNewModelDrawer}
                spaceId={spaceId}
                handleSaveExternalConnection={handleSaveExternalConnection}
                handleSaveModel={handleSaveModel}
                setShowExternalWizard={setShowExternalWizard}
                setShowNewModelDrawer={setShowNewModelDrawer}
            />
        </div>
    )
}
