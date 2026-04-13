'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Network,
  Search,
  Table,
  Database,
  Server,
  Box,
  HardDrive,
  BookOpen,
  Bot,
  Hash,
  Layers,
  FolderKanban,
  Users,
  Ticket,
  Flag,
  Layout,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { OntologyGraphView } from '@/components/ontology/ontology-graph'
import {
  OntologyNodeType,
  ONTOLOGY_NODE_COLORS,
} from '@/lib/project-types'

const NODE_TYPE_CONFIG: {
  type: OntologyNodeType
  label: string
  description: string
  icon: any
}[] = [
  { type: 'data_model', label: 'Data Models', description: 'Entity schemas and data structures', icon: Layers },
  { type: 'data_table', label: 'Data Tables', description: 'Database tables and collections', icon: Table },
  { type: 'field', label: 'Fields', description: 'Columns and attributes', icon: Hash },
  { type: 'project', label: 'Projects', description: 'Project containers', icon: FolderKanban },
  { type: 'vm', label: 'Virtual Machines', description: 'Compute instances', icon: Server },
  { type: 'container', label: 'Containers', description: 'Docker/Kubernetes containers', icon: Box },
  { type: 'storage', label: 'Storage', description: 'Buckets and volumes', icon: HardDrive },
  { type: 'service', label: 'Services', description: 'APIs and microservices', icon: Database },
  { type: 'notebook', label: 'Notebooks', description: 'Jupyter notebooks and queries', icon: BookOpen },
  { type: 'ai_agent', label: 'AI Agents', description: 'Chatbots and AI assistants', icon: Bot },
  { type: 'query', label: 'Queries', description: 'SQL and data queries', icon: Search },
  { type: 'user', label: 'Users', description: 'Team members and owners', icon: Users },
  { type: 'ticket', label: 'Tickets', description: 'Issues and tasks', icon: Ticket },
  { type: 'milestone', label: 'Milestones', description: 'Project milestones', icon: Flag },
  { type: 'space', label: 'Spaces', description: 'Workspaces and tenants', icon: Layout },
]

export default function DataOntologyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<OntologyNodeType>>(new Set())
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [activeTab, setActiveTab] = useState('explore')

  const handleSearch = () => {
    // Trigger search with current filters
  }

  const toggleType = (type: OntologyNodeType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const selectAllTypes = () => {
    setSelectedTypes(new Set(NODE_TYPE_CONFIG.map(c => c.type)))
  }

  const clearTypes = () => {
    setSelectedTypes(new Set())
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Data Ontology</h1>
              <p className="text-muted-foreground">
                Explore relationships between data assets, models, and infrastructure
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('graph')}
              >
                <Network className="h-4 w-4 mr-2" />
                Graph
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for data tables, models, fields, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-11 h-12 text-lg"
            />
          </div>
          <Button onClick={handleSearch} size="lg">
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Entity Types */}
        <div className="w-72 border-r bg-muted/30">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Entity Types</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={selectAllTypes}>All</Button>
                <Button variant="ghost" size="sm" onClick={clearTypes}>Clear</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter the graph by entity types
            </p>
          </div>
          
          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-2 space-y-1">
              {NODE_TYPE_CONFIG.map(({ type, label, description, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedTypes.has(type) || selectedTypes.size === 0
                      ? 'bg-background border hover:bg-muted/50'
                      : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: ONTOLOGY_NODE_COLORS[type] + '20',
                      color: ONTOLOGY_NODE_COLORS[type]
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                  {(selectedTypes.has(type) || selectedTypes.size === 0) && (
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ONTOLOGY_NODE_COLORS[type] }}
                    />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="explore">Explore</TabsTrigger>
                <TabsTrigger value="data-lineage">Data Lineage</TabsTrigger>
                <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                <TabsTrigger value="catalog">Data Catalog</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="explore" className="flex-1 m-0">
              {viewMode === 'graph' ? (
                <OntologyGraphView
                  initialQuery={searchQuery}
                />
              ) : (
                <OntologyListView searchQuery={searchQuery} />
              )}
            </TabsContent>

            <TabsContent value="data-lineage" className="flex-1 m-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Lineage</CardTitle>
                  <CardDescription>
                    Track the flow of data from source to destination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataLineageView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impact" className="flex-1 m-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Analysis</CardTitle>
                  <CardDescription>
                    Understand the downstream effects of changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImpactAnalysisView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="flex-1 m-0 p-4">
              <DataCatalogView searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// List view component
function OntologyListView({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Customer', 'Order', 'Product', 'Invoice'].map(name => (
                <div key={name} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">12 fields • 3 relationships</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'prod-db-01', type: 'Database', icon: Database },
                { name: 'api-server-01', type: 'Service', icon: Server },
                { name: 'data-storage', type: 'Storage', icon: HardDrive },
              ].map(item => (
                <div key={item.name} className="p-3 border rounded hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                  </div>
                  <p className="font-medium text-sm">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Data Lineage View
function DataLineageView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a data asset to view its lineage - where the data comes from and where it goes.
      </p>
      
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-lg bg-blue-100 flex items-center justify-center mb-2">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium">Source DB</p>
          <p className="text-xs text-muted-foreground">PostgreSQL</p>
        </div>
        
        <ArrowRight className="h-6 w-6 text-muted-foreground" />
        
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-lg bg-orange-100 flex items-center justify-center mb-2">
            <BookOpen className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-sm font-medium">ETL Process</p>
          <p className="text-xs text-muted-foreground">Transform</p>
        </div>
        
        <ArrowRight className="h-6 w-6 text-muted-foreground" />
        
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-lg bg-purple-100 flex items-center justify-center mb-2">
            <Layers className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium">Data Model</p>
          <p className="text-xs text-muted-foreground">Analytics</p>
        </div>
        
        <ArrowRight className="h-6 w-6 text-muted-foreground" />
        
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-lg bg-green-100 flex items-center justify-center mb-2">
            <LayoutGrid className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium">Dashboard</p>
          <p className="text-xs text-muted-foreground">Reports</p>
        </div>
      </div>
    </div>
  )
}

// Impact Analysis View
function ImpactAnalysisView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Analyze the impact of changes to a data asset on downstream systems and processes.
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upstream Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">source_customers</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">source_orders</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Downstream Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded bg-yellow-50">
                <LayoutGrid className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Sales Dashboard</span>
                <Badge variant="outline" className="ml-auto text-yellow-600">Medium</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded bg-red-50">
                <Bot className="h-4 w-4 text-red-600" />
                <span className="text-sm">AI Sales Agent</span>
                <Badge variant="outline" className="ml-auto text-red-600">High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Data Catalog View
function DataCatalogView({ searchQuery }: { searchQuery: string }) {
  const catalogItems = [
    { 
      name: 'customers', 
      type: 'Table', 
      database: 'production', 
      description: 'Customer master data',
      fields: 15,
      records: '1.2M',
      lastUpdated: '2 hours ago',
      owner: 'Data Team'
    },
    { 
      name: 'orders', 
      type: 'Table', 
      database: 'production', 
      description: 'Order transactions',
      fields: 22,
      records: '5.8M',
      lastUpdated: '5 mins ago',
      owner: 'Data Team'
    },
    { 
      name: 'products', 
      type: 'Table', 
      database: 'production', 
      description: 'Product catalog',
      fields: 18,
      records: '45K',
      lastUpdated: '1 day ago',
      owner: 'Product Team'
    },
    { 
      name: 'analytics_events', 
      type: 'View', 
      database: 'analytics', 
      description: 'Aggregated analytics events',
      fields: 12,
      records: '120M',
      lastUpdated: '1 hour ago',
      owner: 'Analytics Team'
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Data Catalog</h2>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      <div className="space-y-3">
        {catalogItems.map(item => (
          <Card key={item.name} className="hover:border-primary/50 cursor-pointer transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Table className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge variant="secondary">{item.database}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{item.fields} fields</span>
                      <span>{item.records} records</span>
                      <span>Updated {item.lastUpdated}</span>
                      <span>Owner: {item.owner}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
