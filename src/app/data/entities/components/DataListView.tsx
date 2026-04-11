import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { DataRecord, Attribute } from '../types'
import { renderCellValue } from '../utils'

interface DataListViewProps {
  records: DataRecord[]
  attributes: Attribute[]
  onViewRecord: (record: DataRecord) => void
  onEditRecord: (record: DataRecord) => void
  onDeleteRecord: (record: DataRecord) => void
  hiddenColumns: Record<string, boolean>
  columnOrder: string[]
}

export function DataListView({
  records,
  attributes,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  hiddenColumns,
  columnOrder
}: DataListViewProps) {
  const orderedVisibleAttributes: Attribute[] = React.useMemo(() => {
    const idToAttr = new Map(attributes.map(a => [a.id, a]))
    return (columnOrder.length ? columnOrder : attributes.map(a => a.id))
      .map(id => idToAttr.get(id))
      .filter(Boolean) as Attribute[]
  }, [attributes, columnOrder])

  const visibleAttributes = orderedVisibleAttributes.filter(attr => !hiddenColumns[attr.id])

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <Card key={record.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleAttributes.slice(0, 4).map((attribute) => (
                  <div key={attribute.id} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      {attribute.display_name}
                    </div>
                    <div className="text-sm">
                      {renderCellValue(record.values?.[attribute.name], attribute)}
                    </div>
                  </div>
                ))}
                {visibleAttributes.length > 4 && (
                  <div className="text-xs text-muted-foreground">
                    +{visibleAttributes.length - 4} more fields
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 ml-4">
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
