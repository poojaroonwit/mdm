'use client'

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { DataModel, Attribute, DataRecord, SortConfig, AdvancedFilter, FilterSet } from '@/app/data/entities/types'
import { renderCellValue, renderEditFieldHelper, getFilterComponentHelper } from '@/app/data/entities/utils'
import { AdvancedFiltersDialog } from '@/app/data/entities/components/AdvancedFiltersDialog'
import { SettingsDrawer } from '@/app/data/entities/components/SettingsDrawer'
import { RecordDetailDrawer } from '@/app/data/entities/components/RecordDetailDrawer'
import { RecordDetailModal } from '@/app/data/entities/components/RecordDetailModal'
import { PageHeader } from '@/app/data/entities/components/PageHeader'
import { DataTableView } from '@/app/data/entities/components/DataTableView'
import { DataGridView } from '@/app/data/entities/components/DataGridView'
import { DataListView } from '@/app/data/entities/components/DataListView'
import { PaginationControls } from '@/app/data/entities/components/PaginationControls'
import { useDataLoading } from '@/app/data/entities/hooks/useDataLoading'
import { useFiltersAndSort } from '@/app/data/entities/hooks/useFiltersAndSort'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default function DataEntitiesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const modelParam = searchParams.get('model')
  const pathSegments = (pathname || '').split('/').filter(Boolean)
  const modelFromPath = (() => {
    const idx = pathSegments.lastIndexOf('entities')
    return idx >= 0 && idx < pathSegments.length - 1 ? pathSegments[idx + 1] : null
  })()
  const modelId = modelParam || modelFromPath
  const recordQueryId = searchParams.get('record')

  // View modes state
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'grid'>('table')
  const [recordDetailOpen, setRecordDetailOpen] = useState(false)
  const [recordDetailMode, setRecordDetailMode] = useState<'drawer' | 'modal' | 'page'>('drawer')
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null)
  const [recordFormData, setRecordFormData] = useState<Record<string, any>>({})

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Use custom hooks
  const {
    sortConfig,
    filters,
    optionSearch,
    setSortConfig,
    setFilters,
    setOptionSearch,
    handleSort,
    handleFilter,
    clearFilters,
    getFilterCountForAttribute,
    getFilterTagsForAttribute
  } = useFiltersAndSort()

  const {
    loading,
    dataModel,
    attributes,
    records,
    baseRecords,
    error,
    setLoading,
    setDataModel,
    setAttributes,
    setRecords,
    setBaseRecords,
    setError,
    setPagination: setPaginationState
  } = useDataLoading({
    modelId,
    pagination,
    sortConfig,
    filters
  })

  // Record layout settings
  const [recordLayoutSettings, setRecordLayoutSettings] = useState({
    displayMode: 'page',
    layoutColumns: '2',
    labelPosition: 'top',
    labelWidthMode: 'auto' as 'auto' | 'custom',
    labelCustomWidthPx: 120,
    listViewOrder: [] as string[],
    gridViewOrder: [] as string[],
    editableFields: {} as Record<string, boolean>,
    showCreated: true,
    showUpdated: true,
    showExported: true,
    showImported: true,
    showViewed: true,
    customTabs: [] as Array<{ id: string; name: string; enabled: boolean; icon: string; showLabel: boolean }>,
    tabCount: 0,
    activityFields: {
      showCreated: true,
      showUpdated: true,
      showExported: true,
      showImported: true,
      showViewed: true
    }
  })

  // Tab drag and drop state
  const [tabDragId, setTabDragId] = useState<string | null>(null)
  const [tabDragOverId, setTabDragOverId] = useState<string | null>(null)

  // Column management state
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({})
  const [sheetColWidths, setSheetColWidths] = useState<Record<string, number>>({})

  // Sheet resize state
  const sheetResizeState = useRef<{ attrId: string | null; startX: number; startWidth: number }>({
    attrId: null,
    startX: 0,
    startWidth: 0
  })

  // Drag and drop state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Table density state
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'spacious'>('normal')

  // Combo attributes (computed)
  const comboAttributes: Attribute[] = useMemo(() => {
    const baseComboAttrs = [
      {
        id: 'created_at',
        name: 'created_at',
        display_name: 'Created',
        type: 'DATETIME',
        required: false,
        unique: false,
        data_model_id: dataModel?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'updated_at',
        name: 'updated_at',
        display_name: 'Updated',
        type: 'DATETIME',
        required: false,
        unique: false,
        data_model_id: dataModel?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    return baseComboAttrs as any
  }, [dataModel?.id])

  // Initialize column order when attributes change
  useEffect(() => {
    if (attributes.length > 0 && columnOrder.length === 0) {
      setColumnOrder(attributes.map(a => a.id))
    }
  }, [attributes])

  // Helper functions
  const renderEditField = (attribute: Attribute, value: any) => {
    return renderEditFieldHelper(attribute, value, {
      onValueChange: (newValue: any) => {
        setRecordFormData(prev => ({ ...prev, [attribute.name]: newValue }))
      }
    })
  }

  const getFilterComponent = (attribute: Attribute) => {
    return getFilterComponentHelper(attribute, {
      currentValue: filters[attribute.name] || '',
      handleFilter,
      baseRecords,
      optionSearch,
      setOptionSearch,
    })
  }

  const getSortIcon = (attributeName: string) => {
    if (sortConfig?.key !== attributeName) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  // Early returns for loading and error states
  if (!modelId) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">No Model Selected</h2>
            <p className="text-muted-foreground">Please select a data model from the sidebar.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loading && !dataModel) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          dataModel={dataModel}
          viewMode={viewMode}
          onViewModeChange={(mode: string) => setViewMode(mode as "table" | "list" | "grid")}
          onClose={() => router.push('/data/entities')}
          showCloseButton={!!dataModel}
          recordDetailOpen={recordDetailOpen}
          displayMode={recordLayoutSettings.displayMode}
        />

        {/* Main content area */}
        <div className="space-y-4">
          {/* Filters and controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {records.length} of {pagination.total} records
              </span>
            </div>
          </div>

          {/* Records display */}
          {viewMode === 'table' && (
            <DataTableView
              records={records}
              attributes={attributes}
              sortConfig={sortConfig}
              onSort={handleSort}
              onViewRecord={(record) => {
                setSelectedRecord(record)
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onEditRecord={(record) => {
                setSelectedRecord(record)
                setRecordFormData(record.values || {})
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onDeleteRecord={(record) => {
                console.log('Delete record:', record.id)
              }}
              hiddenColumns={hiddenColumns}
              columnOrder={columnOrder}
              tableDensity={tableDensity}
            />
          )}
          {viewMode === 'list' && (
            <DataListView
              records={records}
              attributes={attributes}
              onViewRecord={(record) => {
                setSelectedRecord(record)
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onEditRecord={(record) => {
                setSelectedRecord(record)
                setRecordFormData(record.values || {})
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onDeleteRecord={(record) => {
                console.log('Delete record:', record.id)
              }}
              hiddenColumns={hiddenColumns}
              columnOrder={columnOrder}
            />
          )}
          {viewMode === 'grid' && (
            <DataGridView
              records={records}
              attributes={attributes}
              onViewRecord={(record) => {
                setSelectedRecord(record)
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onEditRecord={(record) => {
                setSelectedRecord(record)
                setRecordFormData(record.values || {})
                setRecordDetailOpen(true)
                setRecordDetailMode('drawer')
              }}
              onDeleteRecord={(record) => {
                console.log('Delete record:', record.id)
              }}
              hiddenColumns={hiddenColumns}
              columnOrder={columnOrder}
            />
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalRecords={pagination.total}
              recordsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          )}
        </div>

        {/* Record Detail Components */}
        <RecordDetailDrawer
          open={recordDetailOpen && recordDetailMode === 'drawer'}
          onOpenChange={setRecordDetailOpen}
          record={selectedRecord}
          attributes={attributes}
          onSave={(recordData) => {
            console.log('Save record:', recordData)
            setRecordDetailOpen(false)
          }}
          onDelete={(recordId) => {
            console.log('Delete record:', recordId)
            setRecordDetailOpen(false)
          }}
          renderEditField={renderEditField}
        />

        <RecordDetailModal
          open={recordDetailOpen && recordDetailMode === 'modal'}
          onOpenChange={setRecordDetailOpen}
          record={selectedRecord}
          attributes={attributes}
          onSave={(recordData) => {
            console.log('Save record:', recordData)
            setRecordDetailOpen(false)
          }}
          onDelete={(recordId) => {
            console.log('Delete record:', recordId)
            setRecordDetailOpen(false)
          }}
          renderEditField={renderEditField}
        />

        {/* Settings Drawer */}
        <SettingsDrawer
          open={false}
          onOpenChange={() => { }}
          attributes={attributes}
          columnOrder={columnOrder}
          hiddenColumns={hiddenColumns}
          onColumnOrderChange={(order: string[]) => setColumnOrder(order)}
          onHiddenColumnsChange={(hidden: Record<string, boolean>) => setHiddenColumns(hidden)}
        />
      </div>
    </MainLayout>
  )
}
