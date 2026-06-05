'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'

interface RecordField {
  id: string
  name: string
  displayName: string
  type: string
  required: boolean
  visible: boolean
  editable: boolean
  width?: number
  order: number
  format?: string
}

interface RecordConfig {
  id: string
  name: string
  description: string
  dataSource: string
  fields: RecordField[]
  layout: {
    mode: 'table' | 'list' | 'grid' | 'card'
    columns: number
    density: 'compact' | 'normal' | 'spacious'
    showHeaders: boolean
    showBorders: boolean
    alternatingRows: boolean
  }
  display: {
    showPagination: boolean
    pageSize: number
    showSearch: boolean
    showFilters: boolean
    showSorting: boolean
    showActions: boolean
  }
  styling: {
    theme: 'default' | 'minimal' | 'modern' | 'classic'
    primaryColor: string
    backgroundColor: string
    textColor: string
    borderColor: string
    borderRadius: number
    fontSize: 'small' | 'medium' | 'large'
    fontFamily: string
  }
  actions: {
    allowCreate: boolean
    allowEdit: boolean
    allowDelete: boolean
    allowExport: boolean
    allowImport: boolean
    allowBulkActions: boolean
  }
}

interface RecordPreviewProps {
  config: RecordConfig
}

// Mock data for preview
const mockRecords = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    created_at: '2024-01-15',
    role: 'Admin'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 987-6543',
    status: 'Inactive',
    created_at: '2024-01-20',
    role: 'User'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 456-7890',
    status: 'Active',
    created_at: '2024-01-25',
    role: 'Manager'
  }
]

export function RecordPreview({ config }: RecordPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const visibleFields = config.fields.filter(field => field.visible)
  const totalPages = Math.ceil(mockRecords.length / config.display.pageSize)

  const getDensityClass = () => {
    switch (config.layout.density) {
      case 'compact': return 'py-1'
      case 'spacious': return 'py-4'
      default: return 'py-2'
    }
  }

  const getFontSizeClass = () => {
    switch (config.styling.fontSize) {
      case 'small': return 'text-sm'
      case 'large': return 'text-lg'
      default: return 'text-base'
    }
  }

  const renderFieldValue = (field: RecordField, record: any) => {
    const value = record[field.name] || ''
    
    switch (field.type) {
      case 'EMAIL':
        return <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
      case 'PHONE':
        return <a href={`tel:${value}`} className="text-primary hover:underline">{value}</a>
      case 'URL':
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>
      case 'BOOLEAN':
        return <StatusBadge status={value ? 'yes' : 'no'} label={value ? 'Yes' : 'No'} />
      case 'DATE':
      case 'DATETIME':
        return <span className="text-muted-foreground">{value}</span>
      default:
        return <span>{value}</span>
    }
  }

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table 
        className="w-full"
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          borderRadius: `${config.styling.borderRadius}px`,
          border: config.layout.showBorders ? `1px solid ${config.styling.borderColor}` : 'none'
        }}
      >
        {config.layout.showHeaders && (
          <thead>
            <tr 
              className="bg-muted/50"
              style={{ backgroundColor: config.styling.backgroundColor }}
            >
              {visibleFields.map(field => (
                <th
                  key={field.id}
                  className={`px-4 py-3 text-left font-medium ${getFontSizeClass()}`}
                  style={{ 
                    color: config.styling.textColor,
                    borderBottom: config.layout.showBorders ? `1px solid ${config.styling.borderColor}` : 'none'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{field.displayName}</span>
                    {config.display.showSorting && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => {
                          if (sortField === field.name) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField(field.name)
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              {config.display.showActions && (
                <th 
                  className="px-4 py-3 text-right font-medium"
                  style={{ 
                    color: config.styling.textColor,
                    borderBottom: config.layout.showBorders ? `1px solid ${config.styling.borderColor}` : 'none'
                  }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
        )}
        <tbody>
          {mockRecords.map((record, index) => (
            <tr
              key={record.id}
              className={`
                ${getDensityClass()}
                ${config.layout.alternatingRows && index % 2 === 0 ? 'bg-muted/20' : ''}
                hover:bg-muted/30
              `}
              style={{
                backgroundColor: config.layout.alternatingRows && index % 2 === 0 
                  ? 'rgba(0,0,0,0.02)' 
                  : 'transparent'
              }}
            >
              {visibleFields.map(field => (
                <td
                  key={field.id}
                  className={`px-4 ${getFontSizeClass()}`}
                  style={{ 
                    color: config.styling.textColor,
                    borderBottom: config.layout.showBorders ? `1px solid ${config.styling.borderColor}` : 'none'
                  }}
                >
                  {renderFieldValue(field, record)}
                </td>
              ))}
              {config.display.showActions && (
                <td className="px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {config.actions.allowEdit && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {config.actions.allowDelete && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCardView = () => (
    <div 
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${config.layout.columns}, 1fr)` }}
    >
      {mockRecords.map(record => (
        <Card
          key={record.id}
          style={{
            borderRadius: `${config.styling.borderRadius}px`,
            borderColor: config.styling.borderColor
          }}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              {visibleFields.map(field => (
                <div key={field.id} className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {field.displayName}:
                  </span>
                  <span className={`text-sm ${getFontSizeClass()}`}>
                    {renderFieldValue(field, record)}
                  </span>
                </div>
              ))}
            </div>
            {config.display.showActions && (
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                {config.actions.allowEdit && (
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {config.actions.allowDelete && (
                  <Button size="sm" variant="outline" className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{config.name}</h3>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        {config.actions.allowCreate && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {config.display.showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        
        {config.display.showFilters && (
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}

        {config.actions.allowExport && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Content */}
      <div 
        className="rounded-lg"
        style={{
          backgroundColor: config.styling.backgroundColor,
          borderRadius: `${config.styling.borderRadius}px`
        }}
      >
        {config.layout.mode === 'table' ? renderTableView() : renderCardView()}
      </div>

      {/* Pagination */}
      {config.display.showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * config.display.pageSize) + 1} to {Math.min(currentPage * config.display.pageSize, mockRecords.length)} of {mockRecords.length} records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
