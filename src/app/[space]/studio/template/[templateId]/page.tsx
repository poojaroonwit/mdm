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
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Layout,
  Plus,
  FileText,
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useTemplates } from '@/hooks/use-templates'
import { Template } from '@/lib/template-generator'
import { TemplateComponentPropertiesPanel } from './TemplateComponentPropertiesPanel'
import { renderTemplateComponent, type TemplateComponent } from './TemplateComponentRenderer'
import { getDefaultTemplateComponentProps, TEMPLATE_COMPONENT_CATEGORIES, TEMPLATE_COMPONENT_LIBRARY } from './templateStudioModel'

export default function TemplateStudioPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSpace } = useSpace()
  const templateId = params.templateId as string
  
  const {
    templates,
    loading,
    error,
    updateTemplate,
    createTemplate,
    deleteTemplate
  } = useTemplates()

  const [template, setTemplate] = useState<Template | null>(null)
  const [activeTab, setActiveTab] = useState('design')
  const [selectedComponent, setSelectedComponent] = useState<TemplateComponent | null>(null)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [components, setComponents] = useState<TemplateComponent[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isNewTemplate, setIsNewTemplate] = useState(templateId === 'new')

  // Load template data
  useEffect(() => {
    if (templateId === 'new') {
      setIsNewTemplate(true)
      setTemplate({
        id: '',
        name: '',
        displayName: '',
        description: '',
        category: 'Dashboard',
        version: '1.0.0',
        dataModelId: '',
        pages: [],
        sidebarConfig: {
          items: [],
          background: '#ffffff',
          textColor: '#374151',
          fontSize: '14px'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } else if (templates && templateId) {
      const foundTemplate = templates.find(t => t.id === templateId)
      if (foundTemplate) {
        setTemplate(foundTemplate)
        const templateComponents = foundTemplate.pages?.[0]?.components || []
        setComponents(templateComponents.map(comp => ({
          id: comp.id,
          type: comp.type,
          name: comp.type.charAt(0).toUpperCase() + comp.type.slice(1) + ' Component',
          props: comp.config || {},
          position: { x: comp.x, y: comp.y },
          size: { width: comp.width, height: comp.height }
        })))
      }
    }
  }, [templates, templateId])

  const handleSave = useCallback(async () => {
    if (!template) return
    
    setIsSaving(true)
    try {
      if (isNewTemplate) {
        await createTemplate({
          ...template,
          pages: [{
            id: 'main',
            name: 'main',
            displayName: 'Main Page',
            description: 'Main template page',
            components: components.map(comp => ({
              id: comp.id,
              type: comp.type,
              x: comp.position.x,
              y: comp.position.y,
              width: comp.size.width,
              height: comp.size.height,
              config: comp.props
            })),
            background: {
              type: 'color',
              color: '#ffffff'
            }
          }],
          updatedAt: new Date().toISOString()
        })
        router.push(`/${params.space}/studio`)
    } else {
        await updateTemplate({
          ...template,
          pages: [{
            id: 'main',
            name: 'main',
            displayName: 'Main Page',
            description: 'Main template page',
            components: components.map(comp => ({
              id: comp.id,
              type: comp.type,
              x: comp.position.x,
              y: comp.position.y,
              width: comp.size.width,
              height: comp.size.height,
              config: comp.props
            })),
            background: {
              type: 'color',
              color: '#ffffff'
            }
          }],
          updatedAt: new Date().toISOString()
        })
      }
      setIsDirty(false)
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSaving(false)
    }
  }, [template, templateId, components, updateTemplate, createTemplate, isNewTemplate, router, params.space])

  const addComponent = (type: string) => {
    const newComponent: TemplateComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
      props: getDefaultTemplateComponentProps(type),
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 }
    }
    
    setComponents(prev => [...prev, newComponent])
    setIsDirty(true)
  }

  const updateComponent = (id: string, updates: Partial<TemplateComponent>) => {
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

  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredComponents = TEMPLATE_COMPONENT_LIBRARY.filter(comp => 
    selectedCategory === 'All' || comp.category === selectedCategory
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading template...</p>
        </div>
      </div>
    )
  }

  if (error || (!template && !isNewTemplate)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">The template you're looking for doesn't exist.</p>
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
              <h1 className="text-xl font-bold">
                {isNewTemplate ? 'Create New Template' : template?.displayName}
              </h1>
              <p className="text-sm text-muted-foreground">Template Studio</p>
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_COMPONENT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredComponents.map(({ type, name, icon: Icon, description }) => (
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
              <TabsList className="flex gap-2 justify-start">
                <TabsTrigger value="design" className="justify-start">Design</TabsTrigger>
                <TabsTrigger value="settings" className="justify-start">Settings</TabsTrigger>
                <TabsTrigger value="preview" className="justify-start">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="design" className="mt-0">
                <div className="min-h-[600px] bg-white rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 relative">
                  <div className="text-center text-muted-foreground mb-6">
                    <Layout className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Template Canvas</h3>
                    <p>Drag components from the library to build your template</p>
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
                        {renderTemplateComponent(component)}
                </div>
              </div>
                  ))}
            </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Template Settings</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input 
                          id="template-name"
                          value={template?.name || ''}
                          onChange={(e) => setTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
                      <div>
                        <Label htmlFor="template-display-name">Display Name</Label>
                        <Input 
                          id="template-display-name"
                          value={template?.displayName || ''}
                          onChange={(e) => setTemplate(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                        />
          </div>
                      <div>
                        <Label htmlFor="template-description">Description</Label>
                        <Textarea 
                          id="template-description"
                          value={template?.description || ''}
                          onChange={(e) => setTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-category">Category</Label>
                        <Select 
                          value={template?.category || 'Dashboard'} 
                          onValueChange={(value) => setTemplate(prev => prev ? { ...prev, category: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dashboard">Dashboard</SelectItem>
                            <SelectItem value="Entity Management">Entity Management</SelectItem>
                            <SelectItem value="Analytics">Analytics</SelectItem>
                            <SelectItem value="Forms">Forms</SelectItem>
                            <SelectItem value="Reports">Reports</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="template-public"
                          checked={false}
                          onCheckedChange={() => {}}
                        />
                        <Label htmlFor="template-public">Make this template public</Label>
          </div>
                    </CardContent>
                  </Card>
        </div>
            </TabsContent>
            
              <TabsContent value="preview" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Template Preview</h3>
                  <Card>
                    <CardContent className="p-6">
                      <div className="min-h-[400px] bg-white border rounded p-4">
                        {components.length === 0 ? (
                          <div className="text-center text-muted-foreground">
                            <Layout className="h-12 w-12 mx-auto mb-2" />
                            <p>No components added yet</p>
                          </div>
                        ) : (
                          <div className="relative">
                            {components.map(component => (
                              <div
                                key={component.id}
                                className="absolute"
                                style={{
                                  left: component.position.x,
                                  top: component.position.y,
                                  width: component.size.width,
                                  height: component.size.height
                                }}
                              >
                                {renderTemplateComponent(component)}
                              </div>
                            ))}
                </div>
              )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

        <TemplateComponentPropertiesPanel
          selectedComponent={selectedComponent}
          updateComponent={updateComponent}
          duplicateComponent={duplicateComponent}
          deleteComponent={deleteComponent}
        />
                      </div>
                        </div>
  )
}
