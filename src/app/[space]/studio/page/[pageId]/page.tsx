'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings,
  Palette,
  Layout,
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Copy,
  Move,
  GitBranch,
  History,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Tag,
  Grid3X3,
  List,
  Table,
  BarChart3,
  FileText,
  Image,
  Video,
  Music,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Database,
  Zap,
  Shield,
  Star,
  Heart,
  ThumbsUp,
  Share2,
  ExternalLink
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface PageComponent {
  id: string
  type: string
  name: string
  props: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  children?: PageComponent[]
}

interface PageLayout {
  id: string
  name: string
  type: 'sidebar' | 'top-menu' | 'footer' | 'full-width'
  config: Record<string, any>
}

export default function PageStudioPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSpace } = useSpace()
  const pageId = params.pageId as string
  
  const {
    pages,
    updatePage,
    loading,
    error
  } = useSpacesEditor(currentSpace?.id || '')

  const [page, setPage] = useState<SpacesEditorPage | null>(null)
  const [activeTab, setActiveTab] = useState('design')
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [components, setComponents] = useState<PageComponent[]>([])
  const [layouts, setLayouts] = useState<PageLayout[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load page data
  useEffect(() => {
    if (pages && pageId) {
      const foundPage = pages.find(p => p.id === pageId)
      if (foundPage) {
        setPage(foundPage)
        // Load components from page data
        setComponents((foundPage as any).components || [])
      }
    }
  }, [pages, pageId])

  // Initialize default layouts
  useEffect(() => {
    const defaultLayouts: PageLayout[] = [
      {
        id: 'sidebar-left',
        name: 'Left Sidebar',
        type: 'sidebar',
        config: {
          position: 'left',
          width: 250,
          collapsible: true,
          items: []
        }
      },
      {
        id: 'top-menu',
        name: 'Top Menu',
        type: 'top-menu',
        config: {
          height: 60,
          sticky: true,
          items: []
        }
      },
      {
        id: 'footer',
        name: 'Footer',
        type: 'footer',
        config: {
          height: 80,
          items: []
        }
      }
    ]
    setLayouts(defaultLayouts)
  }, [])

  const handleSave = useCallback(async () => {
    if (!page) return
    
    setIsSaving(true)
    try {
      await updatePage(pageId, {
        ...page,
        components,
        updatedAt: new Date().toISOString()
      } as any)
      setIsDirty(false)
    } catch (error) {
      console.error('Failed to save page:', error)
    } finally {
      setIsSaving(false)
    }
  }, [page, pageId, components, updatePage])

  const addComponent = (type: string) => {
    const newComponent: PageComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
      props: getDefaultProps(type),
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 }
    }
    
    setComponents(prev => [...prev, newComponent])
    setIsDirty(true)
  }

  const getDefaultProps = (type: string): Record<string, any> => {
    const defaults: Record<string, any> = {
      text: { content: 'Sample text', fontSize: 16, color: '#000000' },
      button: { text: 'Click me', variant: 'default', size: 'md' },
      image: { src: '', alt: 'Image', width: 200, height: 150 },
      table: { columns: 3, rows: 3, data: [] },
      chart: { type: 'bar', data: [], width: 400, height: 300 },
      form: { fields: [], submitText: 'Submit' },
      card: { title: 'Card Title', content: 'Card content' },
      list: { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false },
      divider: { thickness: 1, color: '#e5e7eb' },
      spacer: { height: 20 }
    }
    return defaults[type] || {}
  }

  const updateComponent = (id: string, updates: Partial<PageComponent>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    )
    setIsDirty(true)
  }

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
    setSelectedComponent(null)
    setIsDirty(true)
  }

  const duplicateComponent = (id: string) => {
    const component = components.find(comp => comp.id === id)
    if (component) {
      const newComponent = {
        ...component,
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20
        }
      }
      setComponents(prev => [...prev, newComponent])
      setIsDirty(true)
    }
  }

  const componentLibrary = [
    { type: 'text', name: 'Text', icon: FileText, description: 'Add text content' },
    { type: 'button', name: 'Button', icon: Zap, description: 'Interactive button' },
    { type: 'image', name: 'Image', icon: Image, description: 'Display images' },
    { type: 'table', name: 'Table', icon: Table, description: 'Data table' },
    { type: 'chart', name: 'Chart', icon: BarChart3, description: 'Data visualization' },
    { type: 'form', name: 'Form', icon: FileText, description: 'Input form' },
    { type: 'card', name: 'Card', icon: Grid3X3, description: 'Content card' },
    { type: 'list', name: 'List', icon: List, description: 'Item list' },
    { type: 'divider', name: 'Divider', icon: GripVertical, description: 'Visual separator' },
    { type: 'spacer', name: 'Spacer', icon: GripVertical, description: 'Empty space' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading page...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{page.displayName}</h1>
              <p className="text-sm text-muted-foreground">Page Studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={isDirty ? 'unsaved-changes' : 'saved'} label={isDirty ? 'Unsaved changes' : 'Saved'} />
            <Button 
              onClick={handleSave} 
              disabled={!isDirty || isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Component Library */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Components
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {componentLibrary.map(({ type, name, icon: Icon, description }) => (
                <Card 
                  key={type}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addComponent(type)}
                >
                  <CardContent className="p-3 text-center">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 flex flex-col bg-muted/20">
          <div className="p-4 border-b bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="design" className="mt-0">
                <div className="min-h-[600px] bg-white rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 relative">
                  <div className="text-center text-muted-foreground mb-6">
                    <Layout className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Page Canvas</h3>
                    <p>Drag components from the library to build your page</p>
                  </div>
                  
                  {components.map(component => (
                    <div
                      key={component.id}
                      className="absolute border-2 border-transparent hover:border-primary/50 cursor-move p-2 rounded"
                      style={{
                        left: component.position.x,
                        top: component.position.y,
                        width: component.size.width,
                        height: component.size.height
                      }}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <div className="w-full h-full bg-background border rounded p-2">
                        {renderComponent(component)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="layout" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Layout Configuration</h3>
                  {layouts.map(layout => (
                    <Card key={layout.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layout className="h-5 w-5" />
                          {layout.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Width/Height</Label>
                              <Input 
                                type="number" 
                                defaultValue={layout.config.width || layout.config.height || 0}
                                placeholder="Size"
                              />
                            </div>
                            <div>
                              <Label>Position</Label>
                              <Select defaultValue={layout.config.position || 'left'}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                  <SelectItem value="top">Top</SelectItem>
                                  <SelectItem value="bottom">Bottom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Page Settings</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="page-name">Page Name</Label>
                        <Input 
                          id="page-name"
                          value={page.name}
                          onChange={(e) => setPage(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="page-display-name">Display Name</Label>
                        <Input 
                          id="page-display-name"
                          value={page.displayName}
                          onChange={(e) => setPage(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="page-description">Description</Label>
                        <Textarea 
                          id="page-description"
                          value={page.description}
                          onChange={(e) => setPage(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Component Properties */}
        {selectedComponent && (
          <div className="w-80 border-l bg-card">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Component Properties</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label>Component Name</Label>
                <Input 
                  value={selectedComponent.name}
                  onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
                />
              </div>
              <div>
                <Label>Position X</Label>
                <Input 
                  type="number"
                  value={selectedComponent.position.x}
                  onChange={(e) => updateComponent(selectedComponent.id, { 
                    position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Position Y</Label>
                <Input 
                  type="number"
                  value={selectedComponent.position.y}
                  onChange={(e) => updateComponent(selectedComponent.id, { 
                    position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Width</Label>
                <Input 
                  type="number"
                  value={selectedComponent.size.width}
                  onChange={(e) => updateComponent(selectedComponent.id, { 
                    size: { ...selectedComponent.size, width: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input 
                  type="number"
                  value={selectedComponent.size.height}
                  onChange={(e) => updateComponent(selectedComponent.id, { 
                    size: { ...selectedComponent.size, height: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicateComponent(selectedComponent.id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteComponent(selectedComponent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderComponent(component: PageComponent) {
  switch (component.type) {
    case 'text':
      return (
        <div style={{ fontSize: component.props.fontSize, color: component.props.color }}>
          {component.props.content}
        </div>
      )
    case 'button':
      return (
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
          {component.props.text}
        </button>
      )
    case 'image':
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {component.props.src ? (
            <img src={component.props.src} alt={component.props.alt} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-muted-foreground">No image</span>
          )}
        </div>
      )
    case 'table':
      return (
        <table className="w-full border-collapse border">
          <tbody>
            {Array.from({ length: component.props.rows }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: component.props.columns }, (_, j) => (
                  <td key={j} className="border p-2">Cell {i+1},{j+1}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'card':
      return (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">{component.props.title}</h3>
          <p className="text-sm text-muted-foreground">{component.props.content}</p>
        </div>
      )
    case 'list':
      return (
        <ul className={component.props.ordered ? "list-decimal" : "list-disc"}>
          {component.props.items.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    case 'divider':
      return (
        <hr style={{ borderWidth: component.props.thickness, borderColor: component.props.color }} />
      )
    case 'spacer':
      return (
        <div style={{ height: component.props.height }} />
      )
    default:
      return <div className="text-muted-foreground">Unknown component</div>
  }
}
