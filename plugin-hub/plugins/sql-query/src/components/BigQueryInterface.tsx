'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodeEditor } from '@/components/ui/code-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Play, 
  Save, 
  History, 
  ChevronDown,
  ChevronRight,
  Copy,
  Table,
  FileText,
  Clock,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Bookmark,
  Edit,
  Trash2,
  Share,
  Zap,
  BarChart3,
  Filter,
  Search,
  Plus,
  Eye,
  EyeOff,
  X,
  Folder,
  FolderOpen,
  File,
  Calendar,
  User,
  Timer,
  HardDrive,
  
  PieChart,
  Hash,
  Info,
  LineChart,
  Code,
  Download,
  TestTube,
  MoreVertical,
  Activity
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Import the new components
import {
  QueryTemplates,
  QueryBookmarks,
  KeyboardShortcuts,
  useQueryValidation,
  TableContextMenu,
  DataExplorer,
  ResultsPanel,
  QueryFormatter,
  QueryParameters,
  QueryScheduler,
  QueryDryRun,
  QueryPlan,
  QuerySnippets,
  QuerySharing,
  QueryExportImport,
  QueryComments,
  QueryVersionHistory,
} from './'
import { useKeyboardShortcuts, useSpaces, useDataModels } from '@/hooks'
import { formatSQL } from '@/lib/sql-formatter'
import { QueryPlanViewer } from './QueryPlanViewer'
import { QueryPerformanceDashboard } from './QueryPerformanceDashboard'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

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

interface QueryTab {
  id: string
  name: string
  query: string
  isSaved: boolean
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

interface BigQueryInterfaceProps {
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
}

export function BigQueryInterface({ selectedSpace: externalSelectedSpace, onSpaceChange: externalOnSpaceChange }: BigQueryInterfaceProps = {}) {
  const [query, setQuery] = useState('')
  const [internalSelectedSpace, setInternalSelectedSpace] = useState('all')
  const selectedSpace = externalSelectedSpace ?? internalSelectedSpace
  const setSelectedSpace = externalOnSpaceChange ?? setInternalSelectedSpace
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryFolders, setQueryFolders] = useState<QueryFolder[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [queryName, setQueryName] = useState('')
  const [saveAsCopy, setSaveAsCopy] = useState(false)
  const [currentView, setCurrentView] = useState<'editor' | 'schema'>('editor')
  const [selectedTable, setSelectedTable] = useState<{name: string, spaceName: string, description?: string, attributes: any[]} | null>(null)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const codeEditorRef = useRef<any>(null)
  
  // Fetch spaces from database
  const { spaces, loading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  
  // Fetch data models for the selected space
  const { dataModels } = useDataModels(selectedSpace)
  
  // Space dropdown state
  const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false)
  const [spaceSearchValue, setSpaceSearchValue] = useState('')
  
  
  // Tab management
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'New Query', query: '', isSaved: false }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [tabToRename, setTabToRename] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    tableName: string
    projectName: string
    sourceType?: 'INTERNAL' | 'EXTERNAL'
  }>({
    visible: false,
    x: 0,
    y: 0,
    tableName: '',
    projectName: '',
    sourceType: 'INTERNAL'
  })
  
  // Footer tabs
  const [footerTab, setFooterTab] = useState<'results' | 'history' | 'visualization' | 'validation' | 'statistics'>('results')
  const [showFooter, setShowFooter] = useState(true)
  const [footerHeight, setFooterHeight] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [initialMouseY, setInitialMouseY] = useState(0)
  const [initialHeight, setInitialHeight] = useState(320)
  
  // Component states
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showParameters, setShowParameters] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showSnippets, setShowSnippets] = useState(false)
  const [showSharing, setShowSharing] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showDryRun, setShowDryRun] = useState(false)
  const [showExplainPlan, setShowExplainPlan] = useState(false)
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false)
  const [bookmarkedQueries, setBookmarkedQueries] = useState<Set<string>>(new Set())
  const [scheduledQueries, setScheduledQueries] = useState<any[]>([])
  const [queryComments, setQueryComments] = useState<any[]>([])
  const [queryVersions, setQueryVersions] = useState<any[]>([])
  const [showJumpToLineDialog, setShowJumpToLineDialog] = useState(false)
  const [jumpToLineNumber, setJumpToLineNumber] = useState('')
  
  // Query validation
  const { validateQuery } = useQueryValidation()
  const queryValidation = useMemo(() => {
    return validateQuery(query)
  }, [query, validateQuery])

  // Load query history
  useEffect(() => {
    loadQueryHistory()
  }, [])

  // Set default space when spaces are loaded (only if no space is selected)
  useEffect(() => {
    if (spaces.length > 0 && selectedSpace === 'all') {
      // Keep 'all' as the default to show all spaces in tree view
      // Users can manually select a specific space if needed
    }
  }, [spaces, selectedSpace])

  // Keyboard shortcut for jump to line (Ctrl+G / Cmd+G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault()
        setShowJumpToLineDialog(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleJumpToLine = () => {
    const line = parseInt(jumpToLineNumber)
    if (!isNaN(line) && line > 0) {
      if (codeEditorRef.current?.jumpToLine) {
        codeEditorRef.current.jumpToLine(line)
      } else {
        // Fallback: scroll to line in query
        const lines = query.split('\n')
        if (line >= 1 && line <= lines.length) {
          const lineElement = document.querySelector(`[data-line="${line}"]`)
          if (lineElement) {
            lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
      setShowJumpToLineDialog(false)
      setJumpToLineNumber('')
    }
  }


  // Mock data loading functions

  const loadQueryHistory = async () => {
    // Mock query history data
    setQueryHistory([
      {
        id: '1',
        query: 'SELECT * FROM users LIMIT 10',
        results: [],
        columns: ['id', 'name', 'email'],
        status: 'success',
        executionTime: 150,
        timestamp: new Date(),
        spaceName: 'Production',
        userName: 'John Doe',
        size: 1024
      }
    ])
  }

  // Query execution
  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    try {
      // Mock query execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResult: QueryResult = {
          id: Date.now().toString(),
          query,
        results: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        columns: ['id', 'name', 'email'],
        status: 'success',
        executionTime: 150,
          timestamp: new Date(),
        spaceName: selectedSpace === 'all' ? 'All Spaces' : spaces.find(s => s.id === selectedSpace)?.name,
        userName: 'Current User',
        size: 2048
      }

      setCurrentResult(mockResult)
      setQueryHistory(prev => [mockResult, ...prev])
      setShowFooter(true)
      setFooterTab('results')
      
      toast.success('Query executed successfully')
    } catch (error) {
      toast.error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  // Tab management functions
  const createNewTab = () => {
    const newTab: QueryTab = {
      id: Date.now().toString(),
      name: 'New Query',
      query: '',
      isSaved: false
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setQuery('')
  }

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      const newActiveTab = remainingTabs[remainingTabs.length - 1]
      setActiveTabId(newActiveTab.id)
      setQuery(newActiveTab.query)
    }
  }

  const updateCurrentTabQuery = (newQuery: string) => {
    setQuery(newQuery)
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, query: newQuery } : tab
    ))
  }

  const renameTab = (tabId: string, newName: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ))
  }

  const handleRenameTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setNewTabName(tab.name)
      setTabToRename(tabId)
      setShowRenameDialog(true)
    }
  }

  const confirmRenameTab = () => {
    if (tabToRename && newTabName.trim()) {
      renameTab(tabToRename, newTabName.trim())
      setShowRenameDialog(false)
      setTabToRename(null)
      setNewTabName('')
    }
  }

  const saveCurrentTab = (asCopy = false) => {
    if (!query.trim()) {
      toast.error('Please enter a query to save')
      return
    }
    
    const currentTab = tabs.find(t => t.id === activeTabId)
    if (currentTab) {
      // Use the tab name as the query name
      setQueryName(asCopy ? `${currentTab.name} (Copy)` : currentTab.name)
    }
    setSaveAsCopy(asCopy)
    setShowSaveDialog(true)
  }

  // Context menu functions
  const handleTableLeftClick = async (tableName: string, spaceName: string) => {
    // Find the data model for this table
    const dataModel = dataModels.find(dm => dm.name === tableName)
    if (dataModel) {
      try {
        // Fetch attributes for this data model
        const response = await fetch(`/api/data-models/${dataModel.id}/attributes`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const attributesData = await response.json()
        
        setSelectedTable({
          name: tableName,
          spaceName: spaceName,
          description: dataModel.description,
          attributes: attributesData.attributes || []
        })
        setCurrentView('schema')
      } catch (error) {
        console.error('Error fetching attributes:', error)
        toast.error(`Failed to load attributes: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Set empty attributes array as fallback
        setSelectedTable({
          name: tableName,
          spaceName: spaceName,
          description: dataModel.description,
          attributes: []
        })
        setCurrentView('schema')
      }
    }
  }

  const handleTableRightClick = (e: React.MouseEvent, tableName: string, projectName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tableName,
      projectName
    })
  }

  const handleContextMenuAction = (action: string, tableName: string, projectName: string) => {
    switch (action) {
      case 'select':
        updateCurrentTabQuery(`SELECT * FROM \`${projectName}.${tableName}\` LIMIT 100;`)
        break
      case 'preview':
        updateCurrentTabQuery(`SELECT * FROM \`${projectName}.${tableName}\` LIMIT 10;`)
        break
      case 'count':
        updateCurrentTabQuery(`SELECT COUNT(*) as total_rows FROM \`${projectName}.${tableName}\`;`)
        break
      case 'describe':
        updateCurrentTabQuery(`DESCRIBE \`${projectName}.${tableName}\`;`)
        break
      case 'schema':
        updateCurrentTabQuery(`SELECT column_name, data_type, is_nullable FROM \`${projectName}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = '${tableName}';`)
        break
      case 'copy_name':
        import('@/lib/clipboard').then(({ copyToClipboard }) => {
          copyToClipboard(tableName).then(success => {
            if (success) toast.success('Table name copied to clipboard')
          })
        })
        break
      case 'copy_path':
        import('@/lib/clipboard').then(({ copyToClipboard }) => {
          copyToClipboard(`${projectName}.${tableName}`).then(success => {
            if (success) toast.success('Table path copied to clipboard')
          })
        })
        break
      case 'drop':
        // Prevent dropping internal data source tables
        const dataModel = dataModels.find(dm => dm.name === tableName)
        if (dataModel?.sourceType === 'INTERNAL') {
          toast.error('Cannot drop tables from internal data sources')
          return
        }
        if (confirm(`Are you sure you want to drop table ${projectName}.${tableName}?`)) {
          updateCurrentTabQuery(`DROP TABLE \`${projectName}.${tableName}\`;`)
        }
        break
    }
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  // Format query handler
  const handleFormatQuery = () => {
    try {
      const formatted = formatSQL(query)
      updateCurrentTabQuery(formatted)
      toast.success('Query formatted successfully')
    } catch (error) {
      toast.error('Failed to format query')
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onRunQuery: executeQuery,
    onSaveQuery: () => saveCurrentTab(false),
    onCreateNewTab: createNewTab,
    onCloseTab: () => closeTab(activeTabId),
    onRenameTab: () => handleRenameTab(activeTabId),
    onShowTemplates: () => setShowTemplates(true),
    onShowBookmarks: () => setShowBookmarks(true),
    onShowHistory: () => { setFooterTab('history'); setShowFooter(true) },
    onShowResults: () => { setFooterTab('results'); setShowFooter(true) },
    onShowVisualization: () => { setFooterTab('visualization'); setShowFooter(true) },
    onShowValidation: () => { setFooterTab('validation'); setShowFooter(true) },
    onShowShortcuts: () => setShowShortcuts(true),
    onFormatQuery: handleFormatQuery,
    onShowParameters: () => setShowParameters(true),
    onShowSnippets: () => setShowSnippets(true),
    onCloseDialogs: () => {
      setShowTemplates(false)
      setShowBookmarks(false)
      setShowShortcuts(false)
      setShowParameters(false)
      setShowScheduler(false)
      setShowSnippets(false)
      closeContextMenu()
    },
    tabs,
    activeTabId
  })

  // Bookmark functions
  const toggleBookmark = (queryId: string) => {
    setBookmarkedQueries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(queryId)) {
        newSet.delete(queryId)
      } else {
        newSet.add(queryId)
      }
      return newSet
    })
  }

  const isBookmarked = (queryId: string) => bookmarkedQueries.has(queryId)

  const getBookmarkedQueries = () => {
    return queryHistory.filter(query => bookmarkedQueries.has(query.id))
  }

  // Footer resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Mouse down on resize handle')
    setInitialMouseY(e.clientY)
    setInitialHeight(footerHeight)
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaY = e.clientY - initialMouseY
    const newHeight = initialHeight - deltaY
    
    const minHeight = 150
    const maxHeight = window.innerHeight * 0.8
    
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
    console.log('Resizing footer to:', constrainedHeight)
    setFooterHeight(constrainedHeight)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { 
        passive: true, 
        capture: true 
      })
      document.addEventListener('mouseup', handleMouseUp, { 
        passive: true, 
        capture: true 
      })
      
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
      document.body.style.pointerEvents = 'none'
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }
  }, [isResizing, initialMouseY, initialHeight, footerHeight])

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const currentTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Content Area: Data Explorer on Left, Editor on Right */}
      <div className="flex-1 flex min-h-0">
        {/* Data Explorer - Full Height */}
        <div className="flex-shrink-0 border-r border-gray-200 h-full">
          <DataExplorer
          spaces={spaces}
          selectedSpace={selectedSpace}
          onTableRightClick={handleTableRightClick}
          onTableLeftClick={handleTableLeftClick}
          savedQueries={savedQueries}
          queryFolders={queryFolders}
          onLoadQuery={updateCurrentTabQuery}
          onStarQuery={toggleBookmark}
          onDeleteQuery={(queryId) => {
            setSavedQueries(prev => prev.filter(q => q.id !== queryId))
          }}
          onRenameQuery={(queryId, newName) => {
            setSavedQueries(prev => prev.map(q => 
              q.id === queryId ? { ...q, name: newName } : q
            ))
          }}
          onCreateFolder={(name, parentId) => {
            const newFolder: QueryFolder = {
              id: Date.now().toString(),
              name,
              parentId,
              subfolders: []
            }
            setQueryFolders(prev => [...prev, newFolder])
          }}
          onRenameFolder={(folderId, newName) => {
            setQueryFolders(prev => prev.map(f => 
              f.id === folderId ? { ...f, name: newName } : f
            ))
          }}
          onDeleteFolder={(folderId) => {
            setQueryFolders(prev => prev.filter(f => f.id !== folderId))
          }}
          />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab Bar - Horizontal above SQL Editor */}
          <div className="bg-background border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 px-4">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-3 text-sm border-b-[3px] cursor-pointer group ${
                    tab.id === activeTabId
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    setActiveTabId(tab.id)
                    setQuery(tab.query)
                  }}
                  onDoubleClick={() => handleRenameTab(tab.id)}
                >
                  <span>{tab.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRenameTab(tab.id)
                      }}
                      className="hover:bg-muted rounded p-1"
                      title="Rename tab"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          closeTab(tab.id)
                        }}
                        className="hover:bg-muted rounded p-1"
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={createNewTab}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-background border-b border-border">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={executeQuery} 
                  disabled={isExecuting || !query.trim()}
                  className="h-8 px-3"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isExecuting ? 'Running...' : 'Run'}
                </Button>
                
        </div>

                  <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-3">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => saveCurrentTab(false)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => saveCurrentTab(true)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Save as Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowScheduler(true)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowParameters(true)}>
                      <Hash className="h-4 w-4 mr-2" />
                      Parameters...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSharing(true)}>
                      <Share className="h-4 w-4 mr-2" />
                      Share...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowExportImport(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export/Import...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                      <History className="h-4 w-4 mr-2" />
                      Version History...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Comments Button */}
                <Button 
                  size="sm" 
                  variant={showComments ? "default" : "outline"} 
                  onClick={() => setShowComments(!showComments)} 
                  className="h-8 px-3"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Comments
                  {queryComments.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {queryComments.length}
                    </Badge>
                  )}
                </Button>

                {/* Additional tools */}
                <Button size="sm" variant="outline" onClick={() => setShowSnippets(true)} className="h-8 px-3">
                  <Code className="h-4 w-4 mr-1" />
                  Snippets
                </Button>

                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowFooter(!showFooter)} 
                  className="h-8 px-3"
                >
                  {showFooter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showFooter ? 'Hide' : 'Show'} Results
                    </Button>

                {/* More (kebab) menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBookmarks(true)}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Bookmarks
                      {bookmarkedQueries.size > 0 && (
                        <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                          {bookmarkedQueries.size}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                      <Zap className="h-4 w-4 mr-2" />
                      Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFormatQuery}>
                      <Code className="h-4 w-4 mr-2" />
                      Format
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const compact = query.replace(/\s+/g, ' ').trim()
                      updateCurrentTabQuery(compact)
                      toast.success('Query compacted')
                    }}>
                      <Code className="h-4 w-4 mr-2" />
                      Compact
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDryRun(true)}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Dry Run
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowExplainPlan(true)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Explain Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPerformanceDashboard(true)}>
                      <Activity className="h-4 w-4 mr-2" />
                      Performance Dashboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                  </div>
                </div>
              </div>
              
          {/* Main Content Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            
            {currentView === 'editor' ? (
              <div className="flex-1 min-h-0">
                <CodeEditor
                  value={query}
                  onChange={updateCurrentTabQuery}
                  language="sql"
                  height="100%"
                  editorRef={codeEditorRef}
                  placeholder="-- Enter your SQL query here
SELECT 
  name,
  email,
  created_at
FROM users 
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;"
                theme="light"
                options={{
                  fontSize: 14,
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  tabSize: 2,
                  wordWrap: true,
                  showLineNumbers: true,
                  showGutter: true,
                  enableBracketMatching: true,
                  enableAutoIndent: true,
                  enableFindReplace: true,
                  enableCodeFolding: true,
                  enableMinimap: false,
                  enableAutoComplete: true,
                  enableSyntaxValidation: true,
                  enableErrorHighlighting: true,
                  enableIntelliSense: true,
                  enableSnippets: true,
                  enableBracketPairColorization: true,
                  enableIndentGuides: true,
                  enableWordHighlight: true,
                  enableCurrentLineHighlight: true,
                  enableSelectionHighlight: true
                }}
              />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Schema Header */}
                <div className="bg-background border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Table className="h-5 w-5 text-blue-500" />
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{selectedTable?.name}</h2>
                        <p className="text-sm text-muted-foreground">{selectedTable?.spaceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setCurrentView('editor')}
                        className="h-8 px-3"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Back to Editor
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          updateCurrentTabQuery(`SELECT * FROM \`${selectedTable?.name}\` LIMIT 100;`)
                          setCurrentView('editor')
                        }}
                        className="h-8 px-3"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Generate Query
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Schema Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedTable?.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">{selectedTable.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Schema</h3>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Column</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Key</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Default</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {selectedTable?.attributes && selectedTable.attributes.length > 0 ? (
                            selectedTable.attributes.map((attr, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  {attr.name}
                                  {attr.isPrimaryKey && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      PK
                                    </span>
                                  )}
                                  {attr.isForeignKey && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      FK
                                    </span>
                                  )}
                                  {attr.isAutoIncrement && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      AI
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{attr.type || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {attr.isRequired ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Optional</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {attr.isUnique ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Unique
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {attr.isPrimaryKey ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {attr.defaultValue ? (
                                  <code className="text-xs bg-muted px-2 py-1 rounded">{attr.defaultValue}</code>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{attr.description || '-'}</td>
                            </tr>
                          ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                No attributes found for this data model.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel - Now positioned under the code editor only */}
          <ResultsPanel
            showFooter={showFooter}
            footerHeight={footerHeight}
            isResizing={isResizing}
            footerTab={footerTab}
            onFooterTabChange={setFooterTab}
            currentResult={currentResult}
            queryHistory={queryHistory}
            onLoadQuery={updateCurrentTabQuery}
            onToggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
            getStatusIcon={getStatusIcon}
            formatDuration={formatDuration}
            formatBytes={formatBytes}
            onMouseDown={handleMouseDown}
            setFooterHeight={setFooterHeight}
            validation={queryValidation}
            onJumpToLine={(line, column) => {
              if (codeEditorRef.current?.jumpToLine) {
                codeEditorRef.current.jumpToLine(line, column)
              } else {
                // Fallback: scroll to line in query
                const lines = query.split('\n')
                if (line >= 1 && line <= lines.length) {
                  const lineElement = document.querySelector(`[data-line="${line}"]`)
                  if (lineElement) {
                    lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Jump to Line Dialog */}
      <Dialog open={showJumpToLineDialog} onOpenChange={setShowJumpToLineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Jump to Line</DialogTitle>
            <DialogDescription>
              Enter the line number to jump to (Ctrl+G or Cmd+G)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="line-number">Line Number</Label>
              <Input
                id="line-number"
                type="number"
                min="1"
                value={jumpToLineNumber}
                onChange={(e) => setJumpToLineNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJumpToLine()
                  }
                }}
                placeholder="Enter line number"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Total lines: {query.split('\n').length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJumpToLineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJumpToLine} disabled={!jumpToLineNumber || isNaN(parseInt(jumpToLineNumber))}>
              Jump
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Component Dialogs */}
      <QueryTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onInsertTemplate={updateCurrentTabQuery}
      />

      <QueryBookmarks
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarkedQueries={getBookmarkedQueries()}
        onRemoveBookmark={toggleBookmark}
        onRunQuery={updateCurrentTabQuery}
        getStatusIcon={getStatusIcon}
        formatDuration={formatDuration}
        formatBytes={formatBytes}
      />

      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Dry Run Dialog */}
      <Dialog open={showDryRun} onOpenChange={setShowDryRun}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dry Run</DialogTitle>
            <DialogDescription>
              Validate your query and estimate resources without executing it.
            </DialogDescription>
          </DialogHeader>
          <QueryDryRun query={query} />
        </DialogContent>
      </Dialog>

      {/* Explain Plan Dialog */}
      <Dialog open={showExplainPlan} onOpenChange={setShowExplainPlan}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <QueryPlanViewer 
            query={query} 
            onClose={() => setShowExplainPlan(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Performance Dashboard Dialog */}
      <Dialog open={showPerformanceDashboard} onOpenChange={setShowPerformanceDashboard}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <QueryPerformanceDashboard
            onQueryClick={(query) => {
              updateCurrentTabQuery(query)
              setShowPerformanceDashboard(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <QueryParameters
        query={query}
        onQueryChange={updateCurrentTabQuery}
        isOpen={showParameters}
        onClose={() => setShowParameters(false)}
      />

      <QueryScheduler
        query={query}
        queryName={currentTab?.name}
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSchedule={(schedule) => {
          setScheduledQueries(prev => [...prev, schedule])
          toast.success(`Query "${schedule.name}" scheduled successfully`)
        }}
      />

      <QuerySnippets
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        onInsertSnippet={updateCurrentTabQuery}
      />

      <QuerySharing
        query={query}
        queryName={currentTab?.name || 'Untitled Query'}
        isOpen={showSharing}
        onClose={() => setShowSharing(false)}
        onShare={(url, settings) => {
          toast.success(`Query shared: ${url}`)
        }}
      />

      <QueryExportImport
        query={query}
        queryName={currentTab?.name}
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
        onImport={(importedQuery, metadata) => {
          updateCurrentTabQuery(importedQuery)
          if (metadata?.notes) {
            toast.success(`Query imported with notes: ${metadata.notes}`)
          }
        }}
      />

      <QueryComments
        query={query}
        queryId={activeTabId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={queryComments}
        onAddComment={(comment) => {
          const newComment = {
            ...comment,
            id: Date.now().toString(),
            createdAt: new Date()
          }
          setQueryComments(prev => [...prev, newComment])
        }}
        onUpdateComment={(commentId, content) => {
          setQueryComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, content, updatedAt: new Date() } : c
          ))
        }}
        onDeleteComment={(commentId) => {
          setQueryComments(prev => prev.filter(c => c.id !== commentId))
        }}
        currentUser={{
          id: 'current-user-id',
          name: 'Current User',
          email: 'user@example.com'
        }}
      />

      <QueryVersionHistory
        query={query}
        queryName={currentTab?.name || 'Untitled Query'}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={queryVersions}
        onLoadVersion={(version) => {
          updateCurrentTabQuery(version.query)
          toast.success(`Loaded version ${version.version}`)
        }}
        onRestoreVersion={(version) => {
          updateCurrentTabQuery(version.query)
          setQueryVersions(prev => prev.map(v => 
            v.id === version.id ? { ...v, isCurrent: true } : { ...v, isCurrent: false }
          ))
        }}
      />

      <TableContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        tableName={contextMenu.tableName}
        projectName={contextMenu.projectName}
        sourceType={contextMenu.sourceType as 'INTERNAL' | 'EXTERNAL'}
        onAction={handleContextMenuAction}
        onClose={closeContextMenu}
      />

      {/* Rename Tab Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Tab</DialogTitle>
            <DialogDescription>
              Enter a new name for this query tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tab-name">Tab Name</Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Enter tab name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRenameTab()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false)
                setTabToRename(null)
                setNewTabName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmRenameTab} disabled={!newTabName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
