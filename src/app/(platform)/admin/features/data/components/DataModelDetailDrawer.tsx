'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Hash,
  List,
  Settings,
  Table,
  ToggleLeft,
  Type,
  XCircle,
} from 'lucide-react'

interface DatabaseSchema {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default?: string
    }>
  }>
  functions: string[]
}

interface DetailItem {
  type: 'model' | 'table'
  id: string
  name: string
  displayName?: string
  description?: string
}

interface DataModelDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDetailItem: DetailItem | null
  selectedAttribute: any | null
  setSelectedAttribute: (attribute: any | null) => void
  modelAttributes: any[]
  isLoadingAttributes: boolean
  attributeOptions: any[]
  isLoadingOptions: boolean
  databaseSchema: DatabaseSchema | null
  primaryColor: string
  onAttributeClick: (attribute: any) => void
}

function AttributeTypeIcon({ type }: { type?: string }) {
  const lowerType = type?.toLowerCase() || ''

  if (lowerType.includes('text') || lowerType.includes('string')) {
    return <Type className="h-3 w-3 text-muted-foreground" />
  }
  if (lowerType.includes('number') || lowerType.includes('int')) {
    return <Hash className="h-3 w-3 text-muted-foreground" />
  }
  if (lowerType.includes('bool')) {
    return <ToggleLeft className="h-3 w-3 text-muted-foreground" />
  }
  if (lowerType.includes('date')) {
    return <Calendar className="h-3 w-3 text-muted-foreground" />
  }

  return <Settings className="h-3 w-3 text-muted-foreground" />
}

function AttributePropertyGrid({
  selectedDetailItem,
  selectedAttribute,
}: {
  selectedDetailItem: DetailItem | null
  selectedAttribute: any
}) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/50 rounded-lg">
        <Label className="text-xs text-muted-foreground">
          {selectedDetailItem?.type === 'model' ? 'Display Name' : 'Column Name'}
        </Label>
        <p className="font-medium">{selectedAttribute.display_name || selectedAttribute.name}</p>
      </div>
      {selectedDetailItem?.type === 'model' && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <Label className="text-xs text-muted-foreground">Field Name</Label>
          <p className="font-mono text-sm">{selectedAttribute.name}</p>
        </div>
      )}
      <div className="p-3 bg-muted/50 rounded-lg">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <p className="font-mono text-sm">{selectedAttribute.type}</p>
      </div>
      {selectedDetailItem?.type === 'model' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">Required</Label>
            <p>{selectedAttribute.is_required ? 'Yes' : 'No'}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">Unique</Label>
            <p>{selectedAttribute.is_unique ? 'Yes' : 'No'}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">Nullable</Label>
            <p>{selectedAttribute.nullable ? 'Yes' : 'No'}</p>
          </div>
          {selectedAttribute.default !== undefined && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs text-muted-foreground">Default</Label>
              <p className="font-mono text-sm">{selectedAttribute.default || '-'}</p>
            </div>
          )}
        </div>
      )}
      {selectedAttribute.description && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <p className="text-sm">{selectedAttribute.description}</p>
        </div>
      )}
      {selectedAttribute.default_value && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <Label className="text-xs text-muted-foreground">Default Value</Label>
          <p className="font-mono text-sm">{selectedAttribute.default_value}</p>
        </div>
      )}
    </div>
  )
}

function isOptionAttribute(attribute: any) {
  const type = attribute.type?.toLowerCase()
  return type === 'dropdown' || type === 'select' || type === 'enum'
}

export function DataModelDetailDrawer({
  open,
  onOpenChange,
  selectedDetailItem,
  selectedAttribute,
  setSelectedAttribute,
  modelAttributes,
  isLoadingAttributes,
  attributeOptions,
  isLoadingOptions,
  databaseSchema,
  primaryColor,
  onAttributeClick,
}: DataModelDetailDrawerProps) {
  const table = databaseSchema?.tables.find((item) => item.name === selectedDetailItem?.name)
  const detailTitle = selectedAttribute
    ? selectedAttribute.display_name || selectedAttribute.name
    : selectedDetailItem?.displayName || selectedDetailItem?.name

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={detailTitle}
      description={
        selectedAttribute
          ? `Attribute of ${selectedDetailItem?.displayName || selectedDetailItem?.name}`
          : selectedDetailItem?.type === 'model'
            ? 'Data Model'
            : 'Database Table'
      }
      icon={selectedDetailItem?.type === 'model' ? Database : Table}
      headerActions={selectedAttribute && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setSelectedAttribute(null)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      width="w-[720px]"
      floating
      floatingMargin="16px"
    >
      <div className="flex-1 overflow-hidden">
        {!selectedAttribute ? (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <List className="h-3.5 w-3.5" />
                  {selectedDetailItem?.type === 'model' ? 'Attributes' : 'Columns'}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {selectedDetailItem?.type === 'model'
                    ? modelAttributes.length
                    : table?.columns.length || 0}
                </Badge>
              </div>

              {isLoadingAttributes ? (
                <div className="w-full space-y-3 p-4">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ) : selectedDetailItem?.type === 'model' ? (
                modelAttributes.length > 0 ? (
                  modelAttributes.map((attribute) => (
                    <div
                      key={attribute.id}
                      className="group p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/30 hover:bg-primary/5"
                      onClick={() => onAttributeClick(attribute)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-muted">
                            <AttributeTypeIcon type={attribute.type} />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{attribute.display_name || attribute.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{attribute.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attribute.is_required && (
                            <Badge variant="secondary" className="text-[9px] py-0 h-4">Required</Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <List className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No attributes defined</p>
                  </div>
                )
              ) : table && table.columns.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Column</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Type</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground text-xs">Nullable</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column, index) => (
                        <tr
                          key={index}
                          className="border-b last:border-0 cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => setSelectedAttribute(column)}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-medium">{column.name}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
                              {column.type}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {column.nullable ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              {column.default || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Table className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No columns found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            {selectedDetailItem?.type === 'model' && isOptionAttribute(selectedAttribute) ? (
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
                <TabsContent value="properties" className="space-y-4">
                  <AttributePropertyGrid
                    selectedDetailItem={selectedDetailItem}
                    selectedAttribute={selectedAttribute}
                  />
                </TabsContent>
                <TabsContent value="options" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Dropdown Options</Label>
                    <Badge variant="outline" className="text-[10px]">{attributeOptions.length}</Badge>
                  </div>
                  {isLoadingOptions ? (
                    <div className="w-full space-y-3 p-4">
                      <Skeleton className="h-10 w-full rounded-md" />
                      <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                  ) : attributeOptions.length > 0 ? (
                    <div className="space-y-2">
                      {attributeOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color || primaryColor }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{option.label || option.value}</div>
                            {option.value !== option.label && (
                              <div className="text-xs text-muted-foreground font-mono">{option.value}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <List className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No options defined</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <AttributePropertyGrid
                selectedDetailItem={selectedDetailItem}
                selectedAttribute={selectedAttribute}
              />
            )}
          </ScrollArea>
        )}
      </div>
    </CentralizedDrawer>
  )
}
