import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Trash2 } from 'lucide-react'
import { DataRecord, Attribute } from '../types'
import { renderCellValue } from '../utils'

interface DataTableViewProps {
  records: DataRecord[]
  attributes: Attribute[]
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (attributeName: string) => void
  onViewRecord: (record: DataRecord) => void
  onEditRecord: (record: DataRecord) => void
  onDeleteRecord: (record: DataRecord) => void
  hiddenColumns: Record<string, boolean>
  columnOrder: string[]
  tableDensity: 'compact' | 'normal' | 'spacious'
}

export function DataTableView({
  records,
  attributes,
  sortConfig,
  onSort,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  hiddenColumns,
  columnOrder,
  tableDensity
}: DataTableViewProps) {
  const getSortIcon = (attributeName: string) => {
    if (sortConfig?.key !== attributeName) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  const densityRowClass = tableDensity === 'compact' ? 'py-1' : tableDensity === 'spacious' ? 'py-4' : 'py-2'
  const densityCellClass = tableDensity === 'compact' ? 'px-2 py-1' : tableDensity === 'spacious' ? 'px-4 py-3' : 'px-3 py-2'

  const orderedVisibleAttributes: Attribute[] = React.useMemo(() => {
    const idToAttr = new Map(attributes.map(a => [a.id, a]))
    return (columnOrder.length ? columnOrder : attributes.map(a => a.id))
      .map(id => idToAttr.get(id))
      .filter(Boolean) as Attribute[]
  }, [attributes, columnOrder])

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {orderedVisibleAttributes
              .filter(attr => !hiddenColumns[attr.id])
              .map((attribute) => (
                <TableHead 
                  key={attribute.id}
                  className={`cursor-pointer hover:bg-muted/50 ${densityCellClass}`}
                  onClick={() => onSort(attribute.name)}
                >
                  <div className="flex items-center gap-2">
                    {attribute.display_name}
                    {getSortIcon(attribute.name)}
                  </div>
                </TableHead>
              ))}
            <TableHead className={densityCellClass}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className={densityRowClass}>
              {orderedVisibleAttributes
                .filter(attr => !hiddenColumns[attr.id])
                .map((attribute) => (
                  <TableCell key={attribute.id} className={densityCellClass}>
                    {renderCellValue(record.values?.[attribute.name], attribute)}
                  </TableCell>
                ))}
              <TableCell className={densityCellClass}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
