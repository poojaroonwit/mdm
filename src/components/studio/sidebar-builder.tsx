'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColorInput } from './layout-config/ColorInput'
import { IconPicker } from '@/components/ui/icon-picker'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings, 
  Palette, 
  Type, 
  Minus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SidebarItem {
  id: string
  type: 'page' | 'divider' | 'group' | 'text'
  label: string
  icon?: string
  color?: string
  children?: SidebarItem[]
  isCollapsed?: boolean
  isVisible?: boolean
}

interface SidebarConfig {
  backgroundColor: string
  textColor: string
  iconSize: 'small' | 'medium' | 'large'
  showIcons: boolean
  collapsed: boolean
}

interface SidebarBuilderProps {
  items: SidebarItem[]
  config: SidebarConfig
  onUpdate: (items: SidebarItem[]) => void
  onConfigUpdate: (config: SidebarConfig) => void
}

function SortableSidebarItem({
  item,
  onToggleVisibility,
  onEdit,
  onDelete,
}: {
  item: SidebarItem
  onToggleVisibility: (id: string) => void
  onEdit: (item: SidebarItem) => void
  onDelete: (id: string) => void
}) {
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-lg bg-background ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {item.icon && (
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="text-sm font-medium">{item.label}</span>
          <span className="text-xs text-muted-foreground">({item.type})</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleVisibility(item.id)}
          >
            {item.isVisible !== false ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item)}
          >
            <Settings className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SidebarBuilder({ items, config, onUpdate, onConfigUpdate }: SidebarBuilderProps) {
  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<SidebarItem>>({
    type: 'page',
    label: '',
    icon: 'File',
    color: '#6b7280',
    isVisible: true
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(items, oldIndex, newIndex)
    onUpdate(newItems)
  }

  const handleAddItem = () => {
    if (!newItem.label) return

    const item: SidebarItem = {
      id: `item-${Date.now()}`,
      type: newItem.type as any,
      label: newItem.label,
      icon: newItem.icon,
      color: newItem.color,
      isVisible: newItem.isVisible,
      children: newItem.type === 'group' ? [] : undefined
    }

    onUpdate([...items, item])
    setNewItem({
      type: 'page',
      label: '',
      icon: 'File',
      color: '#6b7280',
      isVisible: true
    })
    setShowAddForm(false)
  }

  const handleUpdateItem = (id: string, updates: Partial<SidebarItem>) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
    onUpdate(updatedItems)
    setEditingItem(null)
  }

  const handleDeleteItem = (id: string) => {
    onUpdate(items.filter(item => item.id !== id))
  }

  const handleToggleVisibility = (id: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    )
    onUpdate(updatedItems)
  }

  const renderSidebarPreview = () => {
    return (
      <div 
        className="w-full h-64 bg-background border rounded-lg p-4 space-y-2 overflow-auto"
        style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
      >
        {items.filter(item => item.isVisible !== false).map(item => (
          <div key={item.id} className="flex items-center gap-2 p-2 rounded hover:bg-black/5">
            {config.showIcons && item.icon && (
              <div 
                className="flex-shrink-0"
                style={{ 
                  width: config.iconSize === 'small' ? '16px' : config.iconSize === 'medium' ? '20px' : '24px',
                  height: config.iconSize === 'small' ? '16px' : config.iconSize === 'medium' ? '20px' : '24px'
                }}
              >
                <div 
                  className="w-full h-full rounded"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            )}
            <span className="text-sm font-medium truncate">{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="w-full">
        <Tabs defaultValue="items">
          <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Add New Item */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showAddForm ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="item-type">Type</Label>
                    <Select 
                      value={newItem.type} 
                      onValueChange={(value) => setNewItem({ ...newItem, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="page">Page</SelectItem>
                        <SelectItem value="divider">Divider</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="item-label">Label</Label>
                    <Input
                      id="item-label"
                      value={newItem.label}
                      onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                      placeholder="Enter label"
                    />
                  </div>

                  {newItem.type === 'page' && (
                    <>
                      <div>
                        <Label htmlFor="item-icon">Icon</Label>
                        <IconPicker
                          value={newItem.icon}
                          onChange={(icon) => setNewItem({ ...newItem, icon })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="item-color">Color</Label>
                        <ColorInput
                          value={newItem.color || ''}
                          onChange={(color) => setNewItem({ ...newItem, color })}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#1e40af"
                          inputClassName="h-8 text-xs pl-7"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item-visible"
                      checked={newItem.isVisible}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isVisible: checked })}
                    />
                    <Label htmlFor="item-visible">Visible</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddItem} className="flex-1">
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sidebar Items</CardTitle>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {items.map((item) => (
                      <SortableSidebarItem
                        key={item.id}
                        item={item}
                        onToggleVisibility={handleToggleVisibility}
                        onEdit={setEditingItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {/* Sidebar Style Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Sidebar Styling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bg-color">Background Color</Label>
                <ColorInput
                  value={config.backgroundColor}
                  onChange={(color) => onConfigUpdate({ ...config, backgroundColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-8 text-xs pl-7"
                />
              </div>

              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <ColorInput
                  value={config.textColor}
                  onChange={(color) => onConfigUpdate({ ...config, textColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-8 text-xs pl-7"
                />
              </div>

              <div>
                <Label htmlFor="icon-size">Icon Size</Label>
                <Select 
                  value={config.iconSize} 
                  onValueChange={(value) => onConfigUpdate({ ...config, iconSize: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-icons"
                  checked={config.showIcons}
                  onCheckedChange={(checked) => onConfigUpdate({ ...config, showIcons: checked })}
                />
                <Label htmlFor="show-icons">Show Icons</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="collapsed"
                  checked={config.collapsed}
                  onCheckedChange={(checked) => onConfigUpdate({ ...config, collapsed: checked })}
                />
                <Label htmlFor="collapsed">Collapsed by Default</Label>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSidebarPreview()}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="text-sm">Edit Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-label">Label</Label>
                <Input
                  id="edit-label"
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                />
              </div>

              {editingItem.type === 'page' && (
                <>
                  <div>
                    <Label htmlFor="edit-icon">Icon</Label>
                    <IconPicker
                      value={editingItem.icon}
                      onChange={(icon) => setEditingItem({ ...editingItem, icon })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-color">Color</Label>
                    <ColorInput
                      value={editingItem.color || ''}
                      onChange={(color) => setEditingItem({ ...editingItem, color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#1e40af"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-visible"
                  checked={editingItem.isVisible !== false}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, isVisible: checked })}
                />
                <Label htmlFor="edit-visible">Visible</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateItem(editingItem.id, editingItem)}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
