'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Layout,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  FileText,
  Database,
  BarChart3,
  MoreHorizontal,
  ArrowRight,
  Users as UsersIcon,
  Grid3X3,
  List
} from 'lucide-react'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import { Template } from '@/lib/template-generator'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { Z_INDEX } from '@/lib/z-index'

// Helper to load page icon dynamically
const loadPageIcon = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || Layout
  } catch {
    return Layout
  }
}

// Page Icon Component
function PageIcon({ page, templates }: { page: SpacesEditorPage; templates: Template[] }) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string }>>(Layout)

  useEffect(() => {
    if (page.icon) {
      loadPageIcon(page.icon).then(setIconComponent)
    } else {
      setIconComponent(Layout)
    }
  }, [page.icon])

  if (page.icon && IconComponent !== Layout) {
    return <IconComponent className="h-5 w-5" />
  }

  // Fallback to template-based icon
  if (page.templateId) {
    const template = templates.find(t => t.id === page.templateId)
    if (template) {
      switch (template.category) {
        case 'Entity Management':
          return <Database className="h-5 w-5" />
        case 'Analytics':
          return <BarChart3 className="h-5 w-5" />
        case 'Forms':
          return <FileText className="h-5 w-5" />
        default:
          return <Layout className="h-5 w-5" />
      }
    }
  }

  return <Layout className="h-5 w-5" />
}

interface PagesManagementProps {
  spaceId: string
  pages: SpacesEditorPage[]
  templates: Template[]
  onCreatePage: (pageData: Partial<SpacesEditorPage>) => Promise<SpacesEditorPage>
  onUpdatePage: (pageId: string, updates: Partial<SpacesEditorPage>) => Promise<void>
  onDeletePage: (pageId: string) => Promise<void>
  onAssignTemplate: (pageId: string, templateId: string) => Promise<void>
  onEditPage: (page: SpacesEditorPage) => void
  onViewPage: (page: SpacesEditorPage) => void
  onResetPages?: () => Promise<void>
}

export function PagesManagement({
  spaceId,
  pages,
  templates,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onAssignTemplate,
  onEditPage,
  onViewPage,
  onResetPages
}: PagesManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingPage, setEditingPage] = useState<SpacesEditorPage | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'routes'>('cards')

  const [newPageForm, setNewPageForm] = useState({
    name: '',
    displayName: '',
    description: '',
    templateId: '',
    icon: ''
  })

  const handleCreatePage = async () => {
    try {
      await onCreatePage({
        name: newPageForm.name,
        displayName: newPageForm.displayName,
        description: newPageForm.description,
        icon: newPageForm.icon
      })

      setNewPageForm({ name: '', displayName: '', description: '', templateId: '', icon: '' })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return

    try {
      await onCreatePage({
        name: newPageForm.name,
        displayName: newPageForm.displayName,
        description: newPageForm.description,
        templateId: selectedTemplate.id,
        isCustom: false,
        icon: newPageForm.icon
      })

      setNewPageForm({ name: '', displayName: '', description: '', templateId: '', icon: '' })
      setSelectedTemplate(null)
      setShowTemplateDialog(false)
    } catch (error) {
      console.error('Failed to create page from template:', error)
    }
  }

  const handleDeletePage = async (page: SpacesEditorPage) => {
    if (window.confirm(`Are you sure you want to delete "${page.displayName}"?`)) {
      try {
        await onDeletePage(page.id)
      } catch (error) {
        console.error('Failed to delete page:', error)
      }
    }
  }

  const getPageStatus = (page: SpacesEditorPage) => {
    if (page.templateId) {
      return { label: 'Template', variant: 'default' as const }
    }
    return { label: 'Custom', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pages</h2>
          <p className="text-muted-foreground">
            Manage your space pages and assign templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'routes')}>
            <TabsList className="flex gap-2 justify-start">
              <TabsTrigger value="cards" className="flex items-center gap-2 justify-start">
                <Grid3X3 className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="routes" className="flex items-center gap-2 justify-start">
                <List className="h-4 w-4" />
                Routes
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {onResetPages && pages.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to remove all pages? This action cannot be undone.')) {
                  onResetPages()
                }
              }}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            From Template
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-3">
        {pages.map(page => {
          const status = getPageStatus(page)
          const template = page.templateId ? templates.find(t => t.id === page.templateId) : null

          return (
            <Card key={page.id} className="hover:shadow-md transition-all duration-200 shadow-sm bg-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <PageIcon page={page} templates={templates} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{page.displayName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          {!page.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {page.description || 'No description provided'}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Path:</span>
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{page.path}</code>
                        </div>
                        {template && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Template:</span>
                            <span>{template.displayName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Created:</span>
                          <span>{new Date(page.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPage(page)}
                      className="border-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onEditPage(page)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPage(page)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditPage(page)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePage(page)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <Card className="shadow-sm bg-transparent">
          <CardContent className="py-12 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pages created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first page to get started with Space Studio
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)} className="border-0">
                <Plus className="h-4 w-4 mr-2" />
                From Template
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new page for your application with a unique name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Page Icon</Label>
              <IconPickerPopover
                value={newPageForm.icon}
                onChange={(icon) => setNewPageForm(prev => ({ ...prev, icon }))}
                zIndex={Z_INDEX.dialogDropdown}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-name">Page Name</Label>
              <Input
                id="page-name"
                value={newPageForm.name}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-display-name">Display Name</Label>
              <Input
                id="page-display-name"
                value={newPageForm.displayName}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="My Page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-description">Description</Label>
              <Input
                id="page-description"
                value={newPageForm.description}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A description of this page"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Page from Template</DialogTitle>
            <DialogDescription>
              Choose from available templates to quickly create a new page with pre-configured content and layout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Page Icon</Label>
              <IconPickerPopover
                value={newPageForm.icon}
                onChange={(icon) => setNewPageForm(prev => ({ ...prev, icon }))}
                zIndex={Z_INDEX.dialogDropdown}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-page-name">Page Name</Label>
              <Input
                id="template-page-name"
                value={newPageForm.name}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-page-display-name">Display Name</Label>
              <Input
                id="template-page-display-name"
                value={newPageForm.displayName}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="My Page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-page-description">Description</Label>
              <Input
                id="template-page-description"
                value={newPageForm.description}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A description of this page"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {templates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${selectedTemplate?.id === template.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                      }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {template.category === 'Entity Management' && <Database className="h-4 w-4" />}
                          {template.category === 'Analytics' && <BarChart3 className="h-4 w-4" />}
                          {template.category === 'Forms' && <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{template.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              v{template.version}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate}
            >
              Create from Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
