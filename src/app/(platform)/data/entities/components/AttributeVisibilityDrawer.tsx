'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Eye, GripVertical, Trash2 } from 'lucide-react'

interface AttributeVisibilityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTabId: string | null
  setSelectedTabId: (id: string | null) => void

  // Data
  recordLayoutSettings: any
  getTabAttributes: (tabId: string) => any[]
  getAvailableAttributesForTab: (tabId: string) => any[]

  // Actions
  addAttributeToTab: (tabId: string, attributeId: string) => void
  removeAttributeFromTab: (tabId: string, attributeId: string) => void
  updateEditableField: (attributeId: string, editable: boolean) => void

  // Drag state/handlers
  attrDragId: string | null
  attrDragOverId: string | null
  onAttrDragStart: (e: React.DragEvent, attributeId: string, tabId: string) => void
  onAttrDragOver: (e: React.DragEvent, attributeId: string) => void
  onAttrDragEnter: (e: React.DragEvent, attributeId: string) => void
  onAttrDrop: (e: React.DragEvent, attributeId: string, tabId: string) => void
  onAttrDragEnd: () => void
}

export function AttributeVisibilityDrawer(props: AttributeVisibilityDrawerProps) {
  const {
    open,
    onOpenChange,
    selectedTabId,
    setSelectedTabId,
    recordLayoutSettings,
    getTabAttributes,
    getAvailableAttributesForTab,
    addAttributeToTab,
    removeAttributeFromTab,
    updateEditableField,
    attrDragId,
    attrDragOverId,
    onAttrDragStart,
    onAttrDragOver,
    onAttrDragEnter,
    onAttrDrop,
    onAttrDragEnd,
  } = props

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) setSelectedTabId(null) }}
      title={recordLayoutSettings?.customTabs?.find((t: any) => t.id === selectedTabId)?.name || 'Attributes'}
      icon={Eye}
    >
      <div className="flex-1 overflow-y-auto">
        {selectedTabId && (() => {
          const tabAttributes = getTabAttributes(selectedTabId)
          const availableAttributes = getAvailableAttributesForTab(selectedTabId)
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-muted-foreground">Configure {recordLayoutSettings?.customTabs?.find((t: any) => t.id === selectedTabId)?.name} Attributes</h5>
                {availableAttributes.length > 0 && (
                  <Select onValueChange={(value) => addAttributeToTab(selectedTabId, value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add attribute..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAttributes.map((attr: any) => (
                        <SelectItem key={attr.id} value={attr.id}>
                          {attr.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <ScrollableList maxHeight="VIEWPORT" className="p-3">
                {tabAttributes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm font-medium">No attributes added to this tab</div>
                    <div className="text-xs mt-1">Use the dropdown above to add attributes</div>
                  </div>
                ) : (
                  tabAttributes.map((attr: any) => (
                    <div
                      key={attr.id}
                      className={`flex items-center gap-3 p-2 border border-border rounded transition-all duration-200 ${attrDragId === attr.id ? 'opacity-50 scale-95' : ''
                        } ${attrDragOverId === attr.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                      draggable
                      onDragStart={(e) => onAttrDragStart(e, attr.id, selectedTabId)}
                      onDragOver={(e) => onAttrDragOver(e, attr.id)}
                      onDragEnter={(e) => onAttrDragEnter(e, attr.id)}
                      onDrop={(e) => onAttrDrop(e, attr.id, selectedTabId)}
                      onDragEnd={onAttrDragEnd}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground" />
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{attr.display_name}</Label>
                        <div className="text-xs text-muted-foreground">{attr.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={recordLayoutSettings?.editableFields?.[attr.id] ? 'editable' : 'readonly'}
                          onValueChange={(value) => updateEditableField(attr.id, value === 'editable')}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editable">Edit</SelectItem>
                            <SelectItem value="readonly">Read</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAttributeFromTab(selectedTabId, attr.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollableList>
            </div>
          )
        })()}
      </div>
    </CentralizedDrawer>
  )
}

export default AttributeVisibilityDrawer


