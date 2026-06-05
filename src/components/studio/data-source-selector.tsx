'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Database,
  Search,
  Plus,
  ExternalLink,
  Table,
  FileText,
  Users,
  Building,
  Calendar,
  Package,
  ShoppingCart,
  BarChart3,
  Settings
} from 'lucide-react'
import { DataModelDialog } from '@/app/admin/features/data/components/DataModelDialog'
import { DataModel as AdminDataModel } from '@/app/admin/features/data/types'
import { showSuccess, showError } from '@/lib/toast-utils'

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
  icon?: string
  table_name: string
  attribute_count: number
  record_count: number
  is_external: boolean
  source_type: 'INTERNAL' | 'EXTERNAL'
  created_at: string
  updated_at: string
}

interface DataSourceSelectorProps {
  onSelect: (dataModel: DataModel) => void
  selectedModel?: DataModel | null
}

interface Space {
  id: string
  name: string
  slug?: string
}

// Mock data models - in real implementation, this would come from API
const mockDataModels: DataModel[] = [
  {
    id: 'users',
    name: 'users',
    display_name: 'Users',
    description: 'User accounts and profiles',
    icon: 'Users',
    table_name: 'users',
    attribute_count: 12,
    record_count: 1250,
    is_external: false,
    source_type: 'INTERNAL',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'companies',
    name: 'companies',
    display_name: 'Companies',
    description: 'Company information and details',
    icon: 'Building',
    table_name: 'companies',
    attribute_count: 18,
    record_count: 340,
    is_external: false,
    source_type: 'INTERNAL',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 'orders',
    name: 'orders',
    display_name: 'Orders',
    description: 'Customer orders and transactions',
    icon: 'ShoppingCart',
    table_name: 'orders',
    attribute_count: 15,
    record_count: 2890,
    is_external: false,
    source_type: 'INTERNAL',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-25T09:45:00Z'
  },
  {
    id: 'products',
    name: 'products',
    display_name: 'Products',
    description: 'Product catalog and inventory',
    icon: 'Package',
    table_name: 'products',
    attribute_count: 22,
    record_count: 156,
    is_external: false,
    source_type: 'INTERNAL',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-22T16:20:00Z'
  },
  {
    id: 'events',
    name: 'events',
    display_name: 'Events',
    description: 'Calendar events and schedules',
    icon: 'Calendar',
    table_name: 'events',
    attribute_count: 8,
    record_count: 89,
    is_external: false,
    source_type: 'INTERNAL',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-18T11:30:00Z'
  },
  {
    id: 'analytics',
    name: 'analytics',
    display_name: 'Analytics',
    description: 'Website analytics and metrics',
    icon: 'BarChart3',
    table_name: 'analytics',
    attribute_count: 14,
    record_count: 5670,
    is_external: true,
    source_type: 'EXTERNAL',
    created_at: '2024-01-06T00:00:00Z',
    updated_at: '2024-01-28T08:15:00Z'
  }
]

const iconMap: Record<string, any> = {
  Users,
  Building,
  ShoppingCart,
  Package,
  Calendar,
  BarChart3,
  Table,
  FileText,
  Settings
}

export function DataSourceSelector({ onSelect, selectedModel }: DataSourceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL')
  const [dataModels, setDataModels] = useState<DataModel[]>(mockDataModels)

  // Data Model Dialog state
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)

  // Load spaces for the dialog
  useEffect(() => {
    const loadSpaces = async () => {
      setSpacesLoading(true)
      try {
        const res = await fetch('/api/spaces?page=1&limit=200')
        const json = await res.json().catch(() => ({}))
        setSpaces(json.spaces || [])
      } catch (e) {
        // Silent error since this only affects the add dialog
        console.error('Failed to load spaces', e)
      } finally {
        setSpacesLoading(false)
      }
    }
    loadSpaces()
  }, [])

  const filteredModels = dataModels.filter(model => {
    const matchesSearch = model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'ALL' || model.source_type === selectedType
    return matchesSearch && matchesType
  })

  const handleModelSelect = (model: DataModel) => {
    onSelect(model)
  }

  const handleCreateModel = () => {
    setShowModelDialog(true)
  }

  const handleModelDialogSuccess = () => {
    // In a real app, we would re-fetch the data models here
    // For now, we'll just close the dialog as we are using mock data
    // Assuming backend creation worked
    // We could potentially try to fetch the new model if we had an endpoint
    showSuccess('Data model created. Note: List may not update immediately in this preview.')
  }

  const renderModelIcon = (iconName?: string) => {
    const IconComponent = iconName ? iconMap[iconName] : Table
    return <IconComponent className="h-5 w-5" />
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateModel}>
              <Plus className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Select Data Source</h3>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a data model to display records from
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search data models..."
            className="pl-9"
          />
        </div>
        <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INTERNAL">Internal</SelectItem>
            <SelectItem value="EXTERNAL">External</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Model */}
      {selectedModel && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderModelIcon(selectedModel.icon)}
                <div>
                  <h4 className="font-semibold">{selectedModel.display_name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedModel.is_external ? 'external' : 'internal'} label={selectedModel.source_type} />
                <Button size="sm" variant="outline" onClick={() => onSelect(null as any)}>
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Models List */}
      <div className="space-y-2 max-h-96 overflow-auto">
        {filteredModels.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No data models found</p>
              <Button variant="link" onClick={handleCreateModel}>
                Create one now
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredModels.map(model => (
            <Card
              key={model.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${selectedModel?.id === model.id ? 'ring-2 ring-primary' : ''
                }`}
              onClick={() => handleModelSelect(model)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderModelIcon(model.icon)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{model.display_name}</h4>
                        <StatusBadge status={model.is_external ? 'external' : 'internal'} label={model.source_type} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{model.attribute_count} attributes</span>
                        <span>{model.record_count.toLocaleString()} records</span>
                        <span>Table: {model.table_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm">
                      Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleCreateModel}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Model
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Database className="h-4 w-4 mr-2" />
          Connect External
        </Button>
      </div>

      {/* Data Model Dialog */}
      <DataModelDialog
        open={showModelDialog}
        onOpenChange={setShowModelDialog}
        spaces={spaces}
        onSuccess={handleModelDialogSuccess}
      />
    </div>
  )
}
