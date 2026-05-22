'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Database, Table, Folder, FolderOpen, FileText, Star, Clock, Search } from 'lucide-react'
import { formatDateTime } from '@/lib/date-formatters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDataModels } from '@/hooks'

interface Space {
  id: string
  name: string
  slug: string
  description?: string
  isDefault: boolean
  icon?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

interface Attribute {
  id: string
  name: string
  displayName: string
  type: string
}

interface DataModel {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  spaces: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  attributes: Attribute[]
}

interface SavedQuery {
  id: string
  name: string
  query: string
  folderId?: string
  isStarred: boolean
  createdAt: Date
  updatedAt: Date
}

interface QueryFolder {
  id: string
  name: string
  parentId?: string
  subfolders: QueryFolder[]
}

interface DataExplorerProps {
  spaces: Space[]
  selectedSpace: string
  onTableRightClick: (e: React.MouseEvent, tableName: string, projectName: string) => void
  onTableLeftClick: (tableName: string, spaceName: string) => void
  savedQueries?: SavedQuery[]
  queryFolders?: QueryFolder[]
  onLoadQuery?: (query: string) => void
  onStarQuery?: (queryId: string) => void
  onDeleteQuery?: (queryId: string) => void
  onRenameQuery?: (queryId: string, newName: string) => void
  onCreateFolder?: (name: string, parentId?: string) => void
  onRenameFolder?: (folderId: string, newName: string) => void
  onDeleteFolder?: (folderId: string) => void
}

export function DataExplorer({ 
  spaces, 
  selectedSpace, 
  onTableRightClick,
  onTableLeftClick,
  savedQueries = [],
  queryFolders = [],
  onLoadQuery,
  onStarQuery,
  onDeleteQuery,
  onRenameQuery,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder
}: DataExplorerProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [querySearch, setQuerySearch] = useState('')
  const [dataExplorerSearch, setDataExplorerSearch] = useState('')
  const [activeTab, setActiveTab] = useState('data-explorer')
  
  // Fetch data models for the selected space
  const { dataModels, loading: dataModelsLoading, error: dataModelsError } = useDataModels(selectedSpace)

  const toggleSchema = (schemaId: string) => {
    setExpandedSchemas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(schemaId)) {
        newSet.delete(schemaId)
      } else {
        newSet.add(schemaId)
      }
      return newSet
    })
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  // Group data models by space for "All Spaces" view
  const getDataModelsBySpace = () => {
    const grouped: { [spaceId: string]: { space: Space; dataModels: DataModel[] } } = {}
    
    dataModels.forEach(dataModel => {
      // Add null safety check for spaces property
      if (dataModel.spaces && Array.isArray(dataModel.spaces)) {
        dataModel.spaces.forEach(spaceRelation => {
          if (spaceRelation && spaceRelation.space) {
            const spaceId = spaceRelation.space.id
            if (!grouped[spaceId]) {
              grouped[spaceId] = {
                space: spaceRelation.space as any,
                dataModels: []
              }
            }
            grouped[spaceId].dataModels.push(dataModel)
          }
        })
      }
    })
    
    return Object.values(grouped)
  }

  // Filter spaces and data models based on search term
  const getFilteredDataModelsBySpace = () => {
    const grouped = getDataModelsBySpace()
    
    if (!dataExplorerSearch.trim()) {
      return grouped
    }
    
    const searchTerm = dataExplorerSearch.toLowerCase()
    
    return grouped
      .map(({ space, dataModels: spaceDataModels }) => {
        // Filter data models within each space
        const filteredDataModels = spaceDataModels.filter(dataModel =>
          dataModel.name.toLowerCase().includes(searchTerm) ||
          (dataModel.description && dataModel.description.toLowerCase().includes(searchTerm))
        )
        
        // Include space if it matches search term or has matching data models
        const spaceMatches = space.name.toLowerCase().includes(searchTerm) ||
                            space.slug.toLowerCase().includes(searchTerm)
        
        if (spaceMatches || filteredDataModels.length > 0) {
          return {
            space,
            dataModels: spaceMatches ? spaceDataModels : filteredDataModels
          }
        }
        
        return null
      })
      .filter(Boolean) as { space: Space; dataModels: DataModel[] }[]
  }

  // Filter data models for selected space
  const getFilteredDataModels = () => {
    if (!dataExplorerSearch.trim()) {
      return dataModels
    }
    
    const searchTerm = dataExplorerSearch.toLowerCase()
    
    return dataModels.filter(dataModel =>
      dataModel.name.toLowerCase().includes(searchTerm) ||
      (dataModel.description && dataModel.description.toLowerCase().includes(searchTerm))
    )
  }

  // Filter saved queries based on search
  const filteredQueries = savedQueries.filter(query =>
    query.name.toLowerCase().includes(querySearch.toLowerCase()) ||
    query.query.toLowerCase().includes(querySearch.toLowerCase())
  )

  // Get queries in a specific folder
  const getQueriesInFolder = (folderId?: string) => {
    return filteredQueries.filter(query => query.folderId === folderId)
  }

  // Get root level folders
  const getRootFolders = () => {
    return queryFolders.filter(folder => !folder.parentId)
  }

  // Get subfolders of a parent folder
  const getSubfolders = (parentId: string) => {
    return queryFolders.filter(folder => folder.parentId === parentId)
  }


  return (
    <div className="w-64 bg-background border-r border-border text-foreground flex flex-col">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-border">
        <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="data-explorer" className="text-xs">Data Explorer</TabsTrigger>
            <TabsTrigger value="saved-queries" className="text-xs">Saved Queries</TabsTrigger>
          </TabsList>
        </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full">
        <Tabs value={activeTab}>
          {/* Data Explorer Tab */}
          <TabsContent value="data-explorer" className="h-full m-0">
            <div className="p-4">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search databases and tables..."
                    value={dataExplorerSearch}
                    onChange={(e) => setDataExplorerSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              {/* Data Models List */}
              <div className="space-y-2">
                {dataModelsLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading data models...
                  </div>
                ) : dataModelsError ? (
                  <div className="p-4 text-center">
                    <div className="text-sm text-red-600 mb-2">Error loading data models</div>
                    <div className="text-xs text-muted-foreground mb-3">{dataModelsError}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                ) : dataModels.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No data models found for this space
                  </div>
                ) : (selectedSpace === 'all' ? getFilteredDataModelsBySpace().length === 0 : getFilteredDataModels().length === 0) ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No databases or tables match your search
                  </div>
                ) : selectedSpace === 'all' ? (
                  // Show all spaces as databases and their data models as tables
                  getFilteredDataModelsBySpace().map(({ space, dataModels: spaceDataModels }) => (
                    <div key={space.id}>
                      <div
                        className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer hover:text-foreground"
                        onClick={() => toggleSchema(space.id)}
                      >
                        {expandedSchemas.has(space.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Database className="h-4 w-4 text-blue-500" />
                        {space.name}
                        <Badge variant="outline" className="text-xs h-5 px-1">
                          {spaceDataModels.length}
                        </Badge>
                      </div>
                      
                      {expandedSchemas.has(space.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {spaceDataModels.map((dataModel) => (
                            <div
                              key={dataModel.id}
                              className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent rounded px-2 py-1"
                              onClick={() => onTableLeftClick(dataModel.name, space.name)}
                              onContextMenu={(e) => onTableRightClick(e, dataModel.name, space.name)}
                            >
                              <Table className="h-4 w-4" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{dataModel.name}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // Show data models for selected space
                  getFilteredDataModels().map((dataModel) => (
                    <div
                      key={dataModel.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent rounded px-2 py-1"
                      onClick={() => onTableLeftClick(dataModel.name, spaces.find(s => s.id === selectedSpace)?.name || 'Unknown')}
                      onContextMenu={(e) => onTableRightClick(e, dataModel.name, spaces.find(s => s.id === selectedSpace)?.name || 'Unknown')}
                    >
                      <Table className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{dataModel.name}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Saved Queries Tab */}
          <TabsContent value="saved-queries" className="h-full m-0">
            <div className="p-4">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search queries..."
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              {/* Queries List */}
              <div className="space-y-2">
                {/* Root level queries (no folder) */}
                {getQueriesInFolder(undefined).map((query) => (
                  <div
                    key={query.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent rounded px-2 py-1 group"
                    onClick={() => onLoadQuery?.(query.query)}
                  >
                    <FileText className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{query.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(query.updatedAt)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStarQuery?.(query.id)
                      }}
                    >
                      <Star className={`h-3 w-3 ${query.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                  </div>
                ))}

                {/* Folders and their queries */}
                {getRootFolders().map((folder) => (
                  <div key={folder.id}>
                    <div
                      className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer hover:text-foreground"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {expandedFolders.has(folder.id) ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                      {folder.name}
                    </div>
                    
                    {expandedFolders.has(folder.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {/* Subfolders */}
                        {getSubfolders(folder.id).map((subfolder) => (
                          <div key={subfolder.id}>
                            <div
                              className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                              onClick={() => toggleFolder(subfolder.id)}
                            >
                              {expandedFolders.has(subfolder.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              {expandedFolders.has(subfolder.id) ? (
                                <FolderOpen className="h-3 w-3" />
                              ) : (
                                <Folder className="h-3 w-3" />
                              )}
                              {subfolder.name}
                            </div>
                            
                            {expandedFolders.has(subfolder.id) && (
                              <div className="ml-6 mt-1 space-y-1">
                                {getQueriesInFolder(subfolder.id).map((query) => (
                                  <div
                                    key={query.id}
                                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent rounded px-2 py-1 group"
                                    onClick={() => onLoadQuery?.(query.query)}
                                  >
                                    <FileText className="h-3 w-3" />
                                    <div className="flex-1 min-w-0">
                                      <div className="truncate font-medium">{query.name}</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {formatDateTime(query.updatedAt)}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onStarQuery?.(query.id)
                                      }}
                                    >
                                      <Star className={`h-3 w-3 ${query.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Queries in this folder */}
                        {getQueriesInFolder(folder.id).map((query) => (
                          <div
                            key={query.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground hover:bg-accent rounded px-2 py-1 group"
                            onClick={() => onLoadQuery?.(query.query)}
                          >
                            <FileText className="h-3 w-3" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{query.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(query.updatedAt)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                onStarQuery?.(query.id)
                              }}
                            >
                              <Star className={`h-3 w-3 ${query.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
