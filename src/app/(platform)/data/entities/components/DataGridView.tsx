import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { DataRecord, Attribute } from '../types'
import { renderCellValue } from '../utils'

interface DataGridViewProps {
  records: DataRecord[]
  attributes: Attribute[]
  onViewRecord: (record: DataRecord) => void
  onEditRecord: (record: DataRecord) => void
  onDeleteRecord: (record: DataRecord) => void
  hiddenColumns: Record<string, boolean>
  columnOrder: string[]
}

export function DataGridView({
  records,
  attributes,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  hiddenColumns,
  columnOrder
}: DataGridViewProps) {
  const orderedVisibleAttributes: Attribute[] = React.useMemo(() => {
    const idToAttr = new Map(attributes.map(a => [a.id, a]))
    return (columnOrder.length ? columnOrder : attributes.map(a => a.id))
      .map(id => idToAttr.get(id))
      .filter(Boolean) as Attribute[]
  }, [attributes, columnOrder])

  const visibleAttributes = orderedVisibleAttributes.filter(attr => !hiddenColumns[attr.id])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => (
        <Card key={record.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Record #{record.id}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewRecord(record)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditRecord(record)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRecord(record)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleAttributes.slice(0, 6).map((attribute) => (
              <div key={attribute.id} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {attribute.display_name}
                </div>
                <div className="text-sm">
                  {renderCellValue(record.values?.[attribute.name], attribute)}
                </div>
              </div>
            ))}
            {visibleAttributes.length > 6 && (
              <div className="text-xs text-muted-foreground">
                +{visibleAttributes.length - 6} more fields
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
