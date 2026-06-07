'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { BarChart3, ChevronDown, Download, Filter, LayoutDashboard, Link as LinkIcon, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { showError, showSuccess, ToastMessages } from '@/lib/toast-utils'
import { exportReportsToExcel } from '@/lib/utils/export-utils'
import type { Report, ReportSource } from './MergedBIReports'

interface MergedBIReportsToolbarProps {
  selectedSpaceId: string
  setSelectedSpaceId: Dispatch<SetStateAction<string>>
  setCreateReportSpaceId: Dispatch<SetStateAction<string>>
  setShowCreateReportDialog: Dispatch<SetStateAction<boolean>>
  setShowIntegrationModal: Dispatch<SetStateAction<boolean>>
  setShowEmbedModal: Dispatch<SetStateAction<boolean>>
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  showFilters: boolean
  setShowFilters: Dispatch<SetStateAction<boolean>>
  filters: {
    source: ReportSource | ''
    category: string
    status: string
    showFavorites: boolean
    dateFrom: string
    dateTo: string
  }
  selectedReports: Set<string>
  setSelectedReports: Dispatch<SetStateAction<Set<string>>>
  reports: Report[]
  handleBulkDelete: () => Promise<void>
  loadReports: () => Promise<void>
}

export function MergedBIReportsToolbar({
  selectedSpaceId,
  setSelectedSpaceId,
  setCreateReportSpaceId,
  setShowCreateReportDialog,
  setShowIntegrationModal,
  setShowEmbedModal,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  selectedReports,
  setSelectedReports,
  reports,
  handleBulkDelete,
  loadReports
}: MergedBIReportsToolbarProps) {
  const activeFilterCount = [filters.source, filters.category, filters.status].filter(Boolean).length

  const handleBulkActivate = async () => {
    try {
      const response = await fetch('/api/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          report_ids: Array.from(selectedReports),
          is_active: true
        })
      })
      if (!response.ok) throw new Error('Failed to update reports')
      showSuccess(`${selectedReports.size} reports activated`)
      setSelectedReports(new Set())
      loadReports()
    } catch (error: any) {
      showError(error.message || ToastMessages.UPDATE_ERROR)
    }
  }

  const handleExport = () => {
    if (reports.length === 0) {
      showError('No reports to export')
      return
    }

    exportReportsToExcel(reports, `reports-${new Date().toISOString().split('T')[0]}`)
    showSuccess(`Exported ${reports.length} reports`)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            BI & Reports
          </h2>
          <p className="text-muted-foreground">
            Manage and organize your reports and dashboards from multiple sources
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[180px]"
            showAllOption={true}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add dashboard/Report
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => {
                setCreateReportSpaceId(selectedSpaceId !== 'all' ? selectedSpaceId : '')
                setShowCreateReportDialog(true)
              }}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Create new dashboard/report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowIntegrationModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Import dashboard from external
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmbedModal(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Embed custom report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setSearchTerm('')
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {selectedReports.size > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm(`Delete ${selectedReports.size} report(s)? This action cannot be undone.`)) {
                  handleBulkDelete()
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedReports.size})
            </Button>
            <Button variant="outline" onClick={handleBulkActivate}>
              Activate ({selectedReports.size})
            </Button>
          </>
        )}
        <Button variant="outline" onClick={loadReports}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </>
  )
}
