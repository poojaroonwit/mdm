'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { DrawerTrigger } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, GripVertical, Plus } from 'lucide-react'

type SettingsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  renderTrigger?: () => React.ReactNode
  // Single context bag to avoid a massive prop surface; kept as any for now
  ctx?: any
  // Direct props (alternative to ctx)
  attributes?: any[]
  columnOrder?: string[]
  hiddenColumns?: Record<string, boolean>
  onColumnOrderChange?: (order: string[]) => void
  onHiddenColumnsChange?: (hidden: Record<string, boolean>) => void
}

export function SettingsDrawer({ open, onOpenChange, renderTrigger, ctx, attributes: directAttributes, columnOrder: directColumnOrder, hiddenColumns: directHiddenColumns, onColumnOrderChange, onHiddenColumnsChange }: SettingsDrawerProps) {
  // Use ctx if provided, otherwise use direct props
  const useCtx = !!ctx
  const {
    tableDensity,
    setTableDensity,
    orderedAllAttributes,
    dragOverId,
    isDragging,
    onDragStartAttr,
    onDragOverAttr,
    onDragEnterAttr,
    onDropAttr,
    onDragEndAttr,
    isAdmin,
    renderStyleOverrides,
    setRenderStyleOverrides,
    labelOverrides,
    setLabelOverrides,
    editingComboId,
    setEditingComboId,
    hiddenColumns: ctxHiddenColumns,
    toggleColumnHidden,
    attributes: ctxAttributes,
    comboColumns,
    setComboColumns,
    setColumnOrder: ctxSetColumnOrder,
    showNewComboForm,
    setShowNewComboForm,
    newComboName,
    setNewComboName,
    newComboType,
    setNewComboType,
    newComboSeparator,
    setNewComboSeparator,
    newComboLeft,
    setNewComboLeft,
    newComboRight,
    setNewComboRight,
    groupingRows,
    setGroupingRows,
    addComboColumn,
  } = ctx || {} as any

  // Use direct props if ctx is not provided
  const attributes = useCtx ? ctxAttributes : (directAttributes || [])
  const hiddenColumns = useCtx ? ctxHiddenColumns : (directHiddenColumns || {})
  const setColumnOrder = useCtx ? ctxSetColumnOrder : (onColumnOrderChange || (() => { }))

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Table Settings"
      width="w-[720px]"
    >
      {renderTrigger && <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>}

      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">
          <Tabs defaultValue="table">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Table Setting</TabsTrigger>
              <TabsTrigger value="columns">Columns Setting</TabsTrigger>
              <TabsTrigger value="combination">Combination</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Density</h4>
                <div className="flex items-center gap-2">
                  <Button variant={tableDensity === 'compact' ? 'default' : 'outline'} onClick={() => setTableDensity('compact')}>Compact</Button>
                  <Button variant={tableDensity === 'comfortable' ? 'default' : 'outline'} onClick={() => setTableDensity('comfortable')}>Comfortable</Button>
                  <Button variant={tableDensity === 'spacious' ? 'default' : 'outline'} onClick={() => setTableDensity('spacious')}>Spacious</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="columns">
              <h4 className="font-medium mb-2">Columns</h4>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto border border-border rounded-md p-2">
                {orderedAllAttributes.map((attr: any) => (
                  <div
                    key={attr.id}
                    className={
                      "flex flex-col gap-2 border border-border rounded px-2 py-1 transition-colors select-none " +
                      (dragOverId === attr.id ? "bg-gray-100 dark:bg-gray-800 " : "bg-white dark:bg-gray-900 ")
                    }
                  >
                    <div
                      className={
                        "flex items-center justify-between gap-2 " +
                        (isDragging ? "cursor-grabbing" : "cursor-grab")
                      }
                      draggable
                      onDragStart={(e) => onDragStartAttr(e, attr.id)}
                      onDragOver={onDragOverAttr}
                      onDragEnter={() => onDragEnterAttr(attr.id)}
                      onDrop={(e) => onDropAttr(e, attr.id)}
                      onDragEnd={onDragEndAttr}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="w-40 truncate">{attr.display_name}</span>
                        {isAdmin && attr.type !== 'COMBO' && (
                          <>
                            <Select value={renderStyleOverrides[attr.id] || 'text'} onValueChange={(v: any) => setRenderStyleOverrides((prev: any) => ({ ...prev, [attr.id]: v }))}>
                              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="badge">Badge</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input className="h-8 w-40" placeholder="Custom label" value={labelOverrides[attr.id] || ''} onChange={(e) => setLabelOverrides((prev: any) => ({ ...prev, [attr.id]: e.target.value }))} />
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {attr.type === 'COMBO' && (
                          <Button size="sm" variant="outline" onClick={() => setEditingComboId((prev: string) => prev === attr.id ? null : attr.id)}>Edit</Button>
                        )}
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => toggleColumnHidden(attr.id)}>
                          {hiddenColumns[attr.id] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        {attr.type === 'COMBO' && (
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => {
                            setComboColumns((prev: any[]) => prev.filter((cc: any) => cc.id !== attr.id))
                            setColumnOrder((prev: string[]) => prev.filter((id: string) => id !== attr.id))
                          }}>✕</Button>
                        )}
                      </div>
                    </div>

                    {attr.type === 'COMBO' && editingComboId === attr.id && (
                      <div className="rounded border border-border bg-white dark:bg-gray-900 p-2">
                        {(() => {
                          const cc = comboColumns.find((c: any) => c.id === attr.id)
                          if (!cc) return null
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                <div className="space-y-1">
                                  <Label>Column Name</Label>
                                  <Input value={cc.name} onChange={(e) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, name: e.target.value } : c))} />
                                </div>
                                <div className="space-y-1">
                                  <Label>Type</Label>
                                  <Select value={cc.type} onValueChange={(v: any) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, type: v } : c))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="left-right">Left-Right</SelectItem>
                                      <SelectItem value="grouping">Grouping</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Separator</Label>
                                  <Input value={cc.separator} onChange={(e) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, separator: e.target.value } : c))} />
                                </div>
                              </div>

                              {cc.type === 'left-right' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                                  <div className="space-y-1">
                                    <Label>Left Attribute</Label>
                                    <Select value={cc.rows[0]} onValueChange={(v) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, rows: [v, c.rows[1] || v] } : c))}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                        {comboColumns.filter((c: any) => c.id !== cc.id).map((combo: any) => (<SelectItem key={combo.id} value={combo.id}>{combo.name} (Combo)</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Right Attribute</Label>
                                    <Select value={cc.rows[1]} onValueChange={(v) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, rows: [c.rows[0] || v, v] } : c))}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                        {comboColumns.filter((c: any) => c.id !== cc.id).map((combo: any) => (<SelectItem key={combo.id} value={combo.id}>{combo.name} (Combo)</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="font-medium">Grouping Rows</Label>
                                    <Button size="sm" variant="outline" onClick={() => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, rows: [...c.rows, ''] } : c))}>Add Row</Button>
                                  </div>
                                  <div className="space-y-2">
                                    {cc.rows.map((val: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <Select value={val} onValueChange={(v) => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, rows: c.rows.map((x: string, i: number) => i === idx ? v : x) } : c))}>
                                          <SelectTrigger className="w-64"><SelectValue placeholder={`Row ${idx + 1} attribute`} /></SelectTrigger>
                                          <SelectContent>
                                            {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                            {comboColumns.filter((c: any) => c.id !== cc.id).map((combo: any) => (<SelectItem key={combo.id} value={combo.id}>{combo.name} (Combo)</SelectItem>))}
                                          </SelectContent>
                                        </Select>
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setComboColumns((prev: any[]) => prev.map((c: any) => c.id === cc.id ? { ...c, rows: c.rows.filter((_: any, i: number) => i !== idx) } : c))}>✕</Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="combination" className="space-y-4">
              {isAdmin ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Combination Columns</h4>
                    <Button size="sm" onClick={() => setShowNewComboForm(!showNewComboForm)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Column
                    </Button>
                  </div>

                  {showNewComboForm && (
                    <div className="border border-border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h5 className="font-medium mb-3">Create New Combination Column</h5>
                      <div className="space-y-3">
                        <div className={`grid grid-cols-1 gap-2 items-end ${newComboType === 'left-right' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                          <div className="space-y-1">
                            <Label>Column Name</Label>
                            <Input placeholder="e.g., Full Name" value={newComboName} onChange={(e) => setNewComboName(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label>Type</Label>
                            <Select value={newComboType} onValueChange={(v: any) => setNewComboType(v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left-right">Left-Right</SelectItem>
                                <SelectItem value="grouping">Grouping</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {newComboType === 'left-right' && (
                            <div className="space-y-1">
                              <Label>Separator</Label>
                              <Input placeholder="e.g., ' ' or ', '" value={newComboSeparator} onChange={(e) => setNewComboSeparator(e.target.value)} />
                            </div>
                          )}
                        </div>

                        {newComboType === 'left-right' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                            <div className="space-y-1">
                              <Label>Left Attribute</Label>
                              <Select value={newComboLeft} onValueChange={(v) => setNewComboLeft(v)}>
                                <SelectTrigger><SelectValue placeholder="Select left attribute" /></SelectTrigger>
                                <SelectContent>
                                  {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                  {comboColumns.map((cc: any) => (<SelectItem key={cc.id} value={cc.id}>{cc.name} (Combo)</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Right Attribute</Label>
                              <Select value={newComboRight} onValueChange={(v) => setNewComboRight(v)}>
                                <SelectTrigger><SelectValue placeholder="Select right attribute" /></SelectTrigger>
                                <SelectContent>
                                  {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                  {comboColumns.map((cc: any) => (<SelectItem key={cc.id} value={cc.id}>{cc.name} (Combo)</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Grouping Rows</Label>
                              <Button size="sm" variant="outline" onClick={() => setGroupingRows((prev: string[]) => [...prev, ''])}>Add Row</Button>
                            </div>
                            <div className="space-y-2">
                              {groupingRows.map((val: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Select value={val} onValueChange={(v) => setGroupingRows((prev: string[]) => prev.map((x, i) => i === idx ? v : x))}>
                                    <SelectTrigger className="w-64"><SelectValue placeholder={`Row ${idx + 1} attribute`} /></SelectTrigger>
                                    <SelectContent>
                                      {attributes.map((a: any) => (<SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>))}
                                      {comboColumns.map((cc: any) => (<SelectItem key={cc.id} value={cc.id}>{cc.name} (Combo)</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setGroupingRows((prev: string[]) => prev.filter((_, i) => i !== idx))}>✕</Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button onClick={addComboColumn} disabled={!newComboName || (newComboType === 'left-right' ? (!newComboLeft || !newComboRight) : groupingRows.length === 0)}>
                            Add Column
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setShowNewComboForm(false)
                            setNewComboName('')
                            setNewComboType('left-right')
                            setNewComboSeparator(' ')
                            setNewComboLeft('')
                            setNewComboRight('')
                            setGroupingRows([])
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border border-border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Configuration</TableHead>
                          <TableHead>Separator</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comboColumns.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No combination columns created yet. Click "Add New Column" to create one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          comboColumns.map((cc: any) => (
                            <TableRow key={cc.id}>
                              <TableCell className="font-medium">{cc.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {cc.type === 'left-right' ? 'Left-Right' : 'Grouping'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {cc.type === 'left-right' ? (
                                  <span className="text-sm text-muted-foreground">
                                    {attributes.find((a: any) => a.id === cc.rows[0])?.display_name || 'Left'} + {attributes.find((a: any) => a.id === cc.rows[1])?.display_name || 'Right'}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {cc.rows.length} row{cc.rows.length !== 1 ? 's' : ''}: {cc.rows.map((rowId: string) => attributes.find((a: any) => a.id === rowId)?.display_name || 'Unknown').join(', ')}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {cc.separator || ' '}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setEditingComboId(cc.id)
                                    setShowNewComboForm(false)
                                  }}>
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setComboColumns((prev: any[]) => prev.filter((c: any) => c.id !== cc.id))
                                    setColumnOrder((prev: string[]) => prev.filter((id: string) => id !== cc.id))
                                  }}>
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">Admin only</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CentralizedDrawer>
  )
}

export default SettingsDrawer


