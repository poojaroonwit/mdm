// @ts-nocheck
'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'

export function ChartFilterDialog(props: any) {
  const {
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    widget,
    attributes,
    filters,
    setFilters,
    updateProperty,
  } = props

  return (
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Configure Filters</DialogTitle>
        </DialogHeader>
        {(() => {
      const dimsObj = (widget.properties?.chartDimensions || {}) as Record<string, any>
      const selectedSet = new Set<string>([
        ...([] as string[]).concat(
          Array.isArray(dimsObj.rows) ? dimsObj.rows : (dimsObj.rows ? [dimsObj.rows] : []),
          Array.isArray(dimsObj.columns) ? dimsObj.columns : (dimsObj.columns ? [dimsObj.columns] : []),
          Array.isArray(dimsObj.values) ? dimsObj.values : (dimsObj.values ? [dimsObj.values] : [])
        )
      ].filter(Boolean))
      const allowedAttrs = attributes.filter(a => selectedSet.has(a.name))

      // Use top-level filters state

      const generateId = () => `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const addCondition = (groupId: string, parentGroup: FilterGroup): FilterGroup => {
        if (parentGroup.id === groupId) {
          return {
            ...parentGroup,
            items: [...parentGroup.items, {
              id: generateId(),
              type: 'condition',
              attribute: allowedAttrs[0]?.name || '',
              operator: 'equals',
              value: ''
            }]
          }
        }
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => 
            item.type === 'group' ? addCondition(groupId, item) : item
          )
        }
      }

      const addGroup = (groupId: string, parentGroup: FilterGroup): FilterGroup => {
        if (parentGroup.id === groupId) {
          return {
            ...parentGroup,
            items: [...parentGroup.items, {
              id: generateId(),
              type: 'group',
              logic: 'AND',
              items: []
            }]
          }
        }
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => 
            item.type === 'group' ? addGroup(groupId, item) : item
          )
        }
      }

      const removeItem = (itemId: string, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.filter(item => item.id !== itemId).map(item =>
            item.type === 'group' ? {
              ...item,
              items: item.items // Keep nested items, just remove direct children
            } : item
          )
        }
      }

      const updateItem = (itemId: string, updates: Partial<FilterCondition | FilterGroup>, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.map((item: FilterItem) => {
            if (item.id === itemId) {
              return { ...item, ...updates } as FilterItem
            }
            return item.type === 'group' ? updateItem(itemId, updates, item) : item
          })
        }
      }

      const updateCondition = (itemId: string, field: keyof FilterCondition, value: any, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => {
            if (item.id === itemId && item.type === 'condition') {
              return { ...item, [field]: value }
            }
            return item.type === 'group' ? updateCondition(itemId, field, value, item) : item
          })
        }
      }

      const saveFilters = (newFilters: FilterGroup | null) => {
        setFilters(newFilters)
        updateProperty('rowFilters', newFilters)
      }

      const FilterItemComponent: React.FC<{ item: FilterItem; parentGroup: FilterGroup; depth?: number }> = ({ item, parentGroup, depth = 0 }) => {
        const isCondition = item.type === 'condition'
        const indent = depth * 16

        if (isCondition) {
          const cond = item as FilterCondition
          return (
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${indent}px` }}>
              <div className="flex items-center gap-2 flex-1 border rounded-[6px] p-2 bg-muted">
                <select
                  className="min-w-[160px] rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                  value={cond.attribute}
                  onChange={(e) => saveFilters(updateCondition(cond.id, 'attribute', e.target.value, parentGroup))}
                >
                  {allowedAttrs.map(attr => (
                    <option key={attr.name} value={attr.name}>{attr.name}</option>
                  ))}
                </select>
                <select
                  className="w-36 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                  value={cond.operator}
                  onChange={(e) => saveFilters(updateCondition(cond.id, 'operator', e.target.value, parentGroup))}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not equals</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Not contains</option>
                  <option value="starts_with">Starts with</option>
                  <option value="ends_with">Ends with</option>
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                  <option value="greater_or_equal">Greater or equal</option>
                  <option value="less_or_equal">Less or equal</option>
                  <option value="is_null">Is null</option>
                  <option value="is_not_null">Is not null</option>
                </select>
                {!['is_null', 'is_not_null'].includes(cond.operator) && (
                  <input
                    type="text"
                    className="min-w-[160px] rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                    value={cond.value}
                    onChange={(e) => saveFilters(updateCondition(cond.id, 'value', e.target.value, parentGroup))}
                    placeholder="Value"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => saveFilters(removeItem(cond.id, parentGroup))}
                className="p-1 hover:bg-destructive/10 rounded text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        } else {
          const group = item as FilterGroup
          return (
            <div className="space-y-1" style={{ paddingLeft: `${indent}px` }}>
              <div className="flex items-center gap-2 border rounded-[6px] p-2 bg-primary/10">
                <select
                  className="w-24 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0 font-semibold"
                  value={group.logic}
                  onChange={(e) => saveFilters(updateItem(group.id, { logic: e.target.value as FilterLogic }, parentGroup))}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <span className="text-[10px] text-muted-foreground">Group</span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => saveFilters(addCondition(group.id, parentGroup))}
                  className="p-1 hover:bg-primary/10 rounded text-primary"
                  title="Add condition"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => saveFilters(addGroup(group.id, parentGroup))}
                  className="p-1 hover:bg-primary/10 rounded text-primary"
                  title="Add group"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => saveFilters(removeItem(group.id, parentGroup))}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1 pl-4">
                {group.items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => saveFilters(addCondition(group.id, parentGroup))}
                    className="flex items-center gap-2 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Add condition
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-[16px]">
                      <span className="min-w-[160px]">Attribute</span>
                      <span className="w-36">Operator</span>
                      <span className="min-w-[160px]">Value</span>
                    </div>
                    {group.items.map((childItem) => (
                      <FilterItemComponent key={childItem.id} item={childItem} parentGroup={group} depth={depth + 1} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )
        }
      }

      if (!filters) {
        return (
          <button
            type="button"
            onClick={() => {
              const newGroup: FilterGroup = {
                id: generateId(),
                type: 'group',
                logic: 'AND',
                items: []
              }
              saveFilters(newGroup)
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs border rounded hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
            Add filter group
          </button>
        )
      }

      return (
        <div className="space-y-2">
          <FilterItemComponent item={filters} parentGroup={filters} depth={0} />
        </div>
      )
    })()}
        <DialogFooter>
          <button
            type="button"
            className="px-3 py-1.5 text-[12px] rounded-[2px] bg-input hover:bg-muted"
            onClick={() => setIsFilterDialogOpen(false)}
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
