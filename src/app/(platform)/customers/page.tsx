'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Filter, 
  Download,
  Upload
} from 'lucide-react'
import { CustomerBulkActions } from './components/CustomerBulkActions'
import { CustomerDetailDialog } from './components/CustomerDetailDialog'
import {
  CustomerAttributeFilterInput,
  CustomerColumnFilter,
  CustomerFilterType
} from './components/CustomerFilterControls'
import { CustomerFilterDrawer } from './components/CustomerFilterDrawer'
import { CustomersTable } from './components/CustomersTable'
import { useCustomerLookupOptions } from './hooks/useCustomerLookupOptions'

type ApiCustomer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  companies?: { name?: string | null } | null
  positions?: { name?: string | null } | null
  sources?: { name?: string | null } | null
  industries?: { name?: string | null } | null
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [companiesMulti, setCompaniesMulti] = useState<string[]>([])
  const [industriesMulti, setIndustriesMulti] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const {
    companies: companiesOptions,
    industries: industriesOptions,
    sources: sourcesOptions,
    positions: positionsOptions,
  } = useCustomerLookupOptions()
  
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDataModelId, setCustomerDataModelId] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const [sourcesMulti, setSourcesMulti] = useState<string[]>([])
  const [eventsMulti, setEventsMulti] = useState<string[]>([])
  const [positionsMulti, setPositionsMulti] = useState<string[]>([])
  const [businessProfilesMulti, setBusinessProfilesMulti] = useState<string[]>([])
  const [titlesMulti, setTitlesMulti] = useState<string[]>([])
  const [callStatusesMulti, setCallStatusesMulti] = useState<string[]>([])

  // Sorting and column filtering state
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})
  const [showColumnFilters, setShowColumnFilters] = useState<Record<string, boolean>>({})
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [customerAttributes, setCustomerAttributes] = useState<any[]>([])
  const [relatedAttributes, setRelatedAttributes] = useState<any[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)
  const [groupedAttributes, setGroupedAttributes] = useState<Record<string, any[]>>({})
  const [openAccordionSections, setOpenAccordionSections] = useState<string[]>(['customer'])

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer)
    setShowCustomerDetail(true)
  }

  const handleBulkEdit = () => {
    console.log('Bulk edit selected customers:', selectedCustomers)
  }

  // Fetch customer data model attributes
  const loadCustomerAttributes = async () => {
    if (!customerDataModelId) {
      console.log('No customerDataModelId available for loading attributes')
      return
    }
    console.log('Loading customer attributes for model ID:', customerDataModelId)
    setLoadingAttributes(true)
    try {
      const res = await fetch(`/api/data-models/${customerDataModelId}/attributes`)
      if (!res.ok) {
        console.error('Failed to fetch attributes:', res.status, res.statusText)
        return
      }
      const json = await res.json()
      const attributes = json.attributes || []
      console.log('Loaded customer attributes:', attributes)
      setCustomerAttributes(attributes)
      
      // Group attributes by data model
      const grouped: Record<string, any[]> = {
        customer: attributes.map((attr: any) => ({ ...attr, dataModelName: 'Customer' }))
      }
      setGroupedAttributes(grouped)
    } catch (error) {
      console.error('Error loading customer attributes:', error)
    } finally {
      setLoadingAttributes(false)
    }
  }

  // Fetch related data model attributes
  const loadRelatedAttributes = async () => {
    if (!customerDataModelId) {
      console.log('No customerDataModelId available for loading related attributes')
      return
    }
    console.log('Loading related attributes for model ID:', customerDataModelId)
    try {
      const res = await fetch(`/api/data-models/${customerDataModelId}/related-attributes`)
      if (!res.ok) {
        console.error('Failed to fetch related attributes:', res.status, res.statusText)
        return
      }
      const json = await res.json()
      const relatedAttrs = json.relatedAttributes || []
      console.log('Loaded related attributes:', relatedAttrs)
      setRelatedAttributes(relatedAttrs)
      
      // Group related attributes by data model
      const groupedByModel: Record<string, any[]> = {}
      relatedAttrs.forEach((attr: any) => {
        const modelName = attr.related_model || 'Unknown'
        if (!groupedByModel[modelName.toLowerCase()]) {
          groupedByModel[modelName.toLowerCase()] = []
        }
        groupedByModel[modelName.toLowerCase()].push({
          ...attr,
          dataModelName: modelName
        })
      })
      
      console.log('Grouped related attributes:', groupedByModel)
      
      // Merge with existing grouped attributes
      setGroupedAttributes(prev => ({
        ...prev,
        ...groupedByModel
      }))
    } catch (error) {
      console.error('Error loading related attributes:', error)
    }
  }

  // Helper functions for sorting and filtering
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleColumnFilter = (field: string, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value === '__all__' ? '' : value
    }))
    setPage(1)
  }

  const clearColumnFilter = (field: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[field]
      return newFilters
    })
    setPage(1)
  }

  const toggleColumnFilter = (field: string) => {
    setShowColumnFilters(prev => {
      const isCurrentlyOpen = prev[field]
      if (isCurrentlyOpen) {
        // If clicking the same filter, close it
        return {
          ...prev,
          [field]: false
        }
      } else {
        // If opening a new filter, close all others first
        return {
          [field]: true
        }
      }
    })
  }

  const getColumnFilterOptions = (field: string) => {
    switch (field) {
      case 'company':
        return companiesOptions.map(option => ({ value: option.name, label: option.name }))
      case 'industry':
        return industriesOptions.map(option => ({ value: option.name, label: option.name }))
      case 'source':
        return sourcesOptions.map(option => ({ value: option.name, label: option.name }))
      case 'position':
        return positionsOptions.map(option => ({ value: option.name, label: option.name }))
      case 'status':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      default:
        return []
    }
  }

  const renderFilterInput = (attribute: any) => {
    const fieldName = attribute.name || attribute.field_name

    return (
      <CustomerAttributeFilterInput
        attribute={attribute}
        value={columnFilters[fieldName]}
        onColumnFilter={handleColumnFilter}
      />
    )
  }

  const getColumnFilterComponent = (field: string, type: CustomerFilterType) => (
    <CustomerColumnFilter
      field={field}
      isOpen={showColumnFilters[field] || false}
      options={getColumnFilterOptions(field)}
      type={type}
      value={columnFilters[field] || ''}
      onClear={clearColumnFilter}
      onColumnFilter={handleColumnFilter}
      onToggle={toggleColumnFilter}
    />
  )
  async function loadCustomers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (companiesMulti.length) params.set('companies', companiesMulti.join(','))
      if (industriesMulti.length) params.set('industries', industriesMulti.join(','))
      if (sourcesMulti.length) params.set('sources', sourcesMulti.join(','))
      if (eventsMulti.length) params.set('events', eventsMulti.join(','))
      if (positionsMulti.length) params.set('positions', positionsMulti.join(','))
      if (businessProfilesMulti.length) params.set('business_profiles', businessProfilesMulti.join(','))
      if (titlesMulti.length) params.set('titles', titlesMulti.join(','))
      if (callStatusesMulti.length) params.set('call_statuses', callStatusesMulti.join(','))
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      
      // Add sorting parameters
      if (sortField) {
        params.set('sort', sortField)
        params.set('order', sortDirection)
      }
      
      // Add column filters
      Object.entries(columnFilters).forEach(([field, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'object' && (value.min || value.max || value.from || value.to)) {
            if (value.min) params.set(`${field}_min`, value.min)
            if (value.max) params.set(`${field}_max`, value.max)
            if (value.from) params.set(`${field}_from`, value.from)
            if (value.to) params.set(`${field}_to`, value.to)
          } else {
            params.set(field, value)
          }
        }
      })
      
      params.set('limit', String(limit))
      params.set('page', String(page))

      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load customers')
      const json = await res.json()
      setCustomers(json.customers || [])
      setTotalCount(json.pagination?.total || (json.customers?.length ?? 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Fetch Customer data model id for import/export
  useEffect(() => {
    async function fetchCustomerModelId() {
      try {
        const res = await fetch('/api/data-models?limit=100&search=Customer')
        if (!res.ok) return
        const json = await res.json()
        const models: any[] = json.dataModels || []
        const customerModel = models.find(m =>
          (m.name && m.name.toLowerCase() === 'customer') ||
          (m.display_name && m.display_name.toLowerCase() === 'customer')
        ) || models.find(m =>
          (m.name && m.name.toLowerCase().includes('customer')) ||
          (m.display_name && m.display_name.toLowerCase().includes('customer'))
        )
        if (customerModel?.id) {
          setCustomerDataModelId(customerModel.id)
          console.log('Customer data model ID:', customerModel.id)
        } else {
          console.log('No customer data model found. Available models:', models.map(m => ({ id: m.id, name: m.name, display_name: m.display_name })))
        }
      } catch (error) {
        console.error('Error fetching customer model ID:', error)
      }
    }
    fetchCustomerModelId()
  }, [])

  // Load attributes when customerDataModelId changes
  useEffect(() => {
    if (customerDataModelId) {
      loadCustomerAttributes()
      loadRelatedAttributes()
    }
  }, [customerDataModelId])

  // Load attributes when filter drawer opens
  useEffect(() => {
    if (showFilterDrawer && customerDataModelId) {
      loadCustomerAttributes()
      loadRelatedAttributes()
    }
  }, [showFilterDrawer, customerDataModelId])

  async function handleImportFileSelected(file: File) {
    if (!file || !customerDataModelId) return
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('dataModelId', customerDataModelId)
      form.append('mapping', JSON.stringify({}))
      const res = await fetch('/api/import-export/import', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Import failed')
        return
      }
      toast.success('Import started')
      setTimeout(() => { loadCustomers() }, 1000)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleExport(allSelectedOnly = false) {
    if (!customerDataModelId) return
    setExporting(true)
    try {
      const filters: any = {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        companies: companiesMulti.length ? companiesMulti : undefined,
        industries: industriesMulti.length ? industriesMulti : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }
      if (allSelectedOnly && selectedCustomers.length > 0) {
        filters.ids = selectedCustomers
      }
      const res = await fetch('/api/import-export/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataModelId: customerDataModelId,
          format: 'xlsx',
          filters,
          columns: [],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Export failed')
        return
      }
      toast.success('Export job created')
    } finally {
      setExporting(false)
    }
  }

  // Refetch when filters change (debounced for search)
  useEffect(() => {
    const id = setTimeout(() => {
      loadCustomers()
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery, statusFilter, companiesMulti, industriesMulti, sourcesMulti, eventsMulti, positionsMulti, businessProfilesMulti, titlesMulti, callStatusesMulti, dateFrom, dateTo, page, limit, sortField, sortDirection, columnFilters])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer data and relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilterDrawer(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFileSelected(file)
              }}
            />
            <Button variant="outline" size="sm" disabled={!customerDataModelId || importing} onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" disabled={!customerDataModelId || exporting} onClick={() => handleExport(false)}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="space-y-6">
          <CustomerBulkActions
            customerDataModelId={customerDataModelId}
            exporting={exporting}
            selectedCount={selectedCustomers.length}
            onBulkEdit={handleBulkEdit}
            onExportSelected={() => handleExport(true)}
          />

          <CustomersTable
            customers={customers}
            getColumnFilterComponent={getColumnFilterComponent}
            limit={limit}
            loading={loading}
            page={page}
            selectedCustomers={selectedCustomers}
            sortDirection={sortDirection}
            sortField={sortField}
            totalCount={totalCount}
            onCustomerClick={handleCustomerClick}
            onLimitChange={setLimit}
            onPageChange={setPage}
            onSelectedCustomersChange={setSelectedCustomers}
            onSort={handleSort}
          />
        </div>

        <CustomerDetailDialog
          customer={selectedCustomer}
          open={showCustomerDetail}
          onOpenChange={setShowCustomerDetail}
        />
        <CustomerFilterDrawer
          columnFilters={columnFilters}
          companiesOptions={companiesOptions}
          groupedAttributes={groupedAttributes}
          loadingAttributes={loadingAttributes}
          open={showFilterDrawer}
          openAccordionSections={openAccordionSections}
          setColumnFilters={setColumnFilters}
          setOpen={setShowFilterDrawer}
          setOpenAccordionSections={setOpenAccordionSections}
          onColumnFilter={handleColumnFilter}
          renderFilterInput={renderFilterInput}
        />
      </div>
    </MainLayout>
  )
}
