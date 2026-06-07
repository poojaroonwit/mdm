'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDebouncedCallback } from 'use-debounce'
import { useSpace } from '@/contexts/space-context'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { ReportsTreeView } from '@/components/reports/ReportsTreeView'
import { AdvancedFilters } from '@/components/reports/AdvancedFilters'
import { ReportTemplatesDialog } from '@/components/reports/ReportTemplatesDialog'
import { IntegrationSelectionModal } from '@/components/reports/IntegrationSelectionModal'
import { EmbedReportDialog } from '@/components/reports/EmbedReportDialog'
import type { SpacesEditorConfig, SpacesEditorPage } from '@/lib/space-studio-manager'
import { CreateDashboardDialog } from './CreateDashboardDialog'
import { MergedBIReportsToolbar } from './MergedBIReportsToolbar'

export type ReportSource = 'BUILT_IN' | 'BUILT_IN_VISUALIZE' | 'CUSTOM_EMBED_LINK' | 'POWER_BI' | 'GRAFANA' | 'LOOKER_STUDIO'

export interface Report {
  id: string
  name: string
  description?: string
  source: ReportSource
  category_id?: string
  folder_id?: string
  owner?: string
  link?: string
  workspace?: string
  embed_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ReportCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface ReportFolder {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

type SpacesEditorResponse = {
  config: SpacesEditorConfig | null
}

function readSpacesEditorConfig(data: SpacesEditorResponse | SpacesEditorConfig | null): SpacesEditorConfig | null {
  if (!data) return null
  if ('config' in data) return data.config
  return data
}

function createEmptySpacesEditorConfig(spaceId: string): SpacesEditorConfig {
  const now = new Date().toISOString()

  return {
    id: `config_${spaceId}_${Date.now()}`,
    spaceId,
    pages: [],
    layoutConfig: {},
    sidebarConfig: {
      items: [],
      background: '#ffffff',
      textColor: '#374151',
      fontSize: '14px',
    },
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  }
}

function getSpacesEditorPageTitle(page: Partial<SpacesEditorPage> & { title?: string }): string {
  return page.displayName || page.title || page.name || 'Untitled Page'
}

function toPageName(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `dashboard-${Date.now()}`
}

export function MergedBIReports() {
  const router = useRouter()
  const { status } = useSession()
  const { currentSpace, spaces } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(currentSpace?.id || 'all')

  // Reports State
  const [reports, setReports] = useState<Report[]>([])
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    source: '' as ReportSource | '',
    category: '',
    status: '',
    showFavorites: false,
    dateFrom: '',
    dateTo: ''
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [showCreateReportDialog, setShowCreateReportDialog] = useState(false)
  const [createReportSpaceId, setCreateReportSpaceId] = useState<string>(selectedSpaceId !== 'all' ? selectedSpaceId : '')
  const [dialogStep, setDialogStep] = useState<1 | 2>(1)
  const [spacePages, setSpacePages] = useState<Array<{ id: string; title: string }>>([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [pageMode, setPageMode] = useState<'existing' | 'create'>('existing')
  const [newPageName, setNewPageName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value)
  }, 300)

  const loadReports = useCallback(async () => {
    if (status !== 'authenticated') {
      setReports([])
      setCategories([])
      setFolders([])
      setReportsLoading(status === 'loading')
      return
    }

    try {
      setReportsLoading(true)
      const params = new URLSearchParams({
        ...(selectedSpaceId && selectedSpaceId !== 'all' && { space_id: selectedSpaceId }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filters.source && { source: filters.source }),
        ...(filters.category && { category_id: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      })

      const response = await fetch(`/api/reports?${params}`)
      if (response.status === 401) {
        setReports([])
        setCategories([])
        setFolders([])
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load reports')
      }

      const data = await response.json()
      let filteredReports = data.reports || []

      // Apply favorites filter
      if (filters.showFavorites) {
        const stored = localStorage.getItem('report_favorites')
        const favoriteIds = stored ? JSON.parse(stored) : []
        filteredReports = filteredReports.filter((r: Report) => favoriteIds.includes(r.id))
      }

      setReports(filteredReports)
      setCategories(data.categories || [])
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error loading reports:', error)
      showError(ToastMessages.LOAD_ERROR)
    } finally {
      setReportsLoading(false)
    }
  }, [
    status,
    selectedSpaceId,
    debouncedSearchTerm,
    filters.source,
    filters.category,
    filters.status,
    filters.showFavorites,
    filters.dateFrom,
    filters.dateTo,
  ])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Sync local selection when global space changes
  useEffect(() => {
    if (currentSpace?.id) {
      setSelectedSpaceId(currentSpace.id)
    }
  }, [currentSpace?.id])

  useEffect(() => {
    loadReports()
  }, [loadReports])


  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          report_ids: Array.from(selectedReports)
        })
      })
      if (!response.ok) throw new Error('Failed to delete reports')
      showSuccess(`${selectedReports.size} reports deleted`)
      setSelectedReports(new Set())
      loadReports()
    } catch (error: any) {
      showError(error.message || ToastMessages.DELETE_ERROR)
    }
  }

  const resetCreateDialog = () => {
    setDialogStep(1)
    setSpacePages([])
    setSelectedPageId('')
    setPageMode('existing')
    setNewPageName('')
    setIsCreating(false)
  }

  const handleNextStep = async () => {
    if (!createReportSpaceId) return
    setPagesLoading(true)
    try {
      const res = await fetch(`/api/spaces-editor/${createReportSpaceId}`)
      if (!res.ok) throw new Error('Failed to load pages')
      const data = await res.json()
      const config = readSpacesEditorConfig(data)
      const pages: Array<{ id: string; title: string }> = (config?.pages || []).map((p: any) => ({
        id: p.id,
        title: getSpacesEditorPageTitle(p),
      }))
      setSpacePages(pages)
      setSelectedPageId(pages[0]?.id || '')
      setPageMode(pages.length > 0 ? 'existing' : 'create')
      setDialogStep(2)
    } catch (error: any) {
      showError(error.message || 'Failed to load pages')
    } finally {
      setPagesLoading(false)
    }
  }

  const handleConfirmCreate = async () => {
    if (!createReportSpaceId) return
    const selectedSpace = spaces.find(s => s.id === createReportSpaceId)
    if (!selectedSpace) return

    setIsCreating(true)
    try {
      let pageId = selectedPageId

      if (pageMode === 'create') {
        const configRes = await fetch(`/api/spaces-editor/${createReportSpaceId}`)
        if (!configRes.ok) throw new Error('Failed to load space config')
        const data = await configRes.json()
        const config = readSpacesEditorConfig(data) || createEmptySpacesEditorConfig(createReportSpaceId)
        const now = new Date().toISOString()
        const pageTitle = newPageName.trim() || 'New Dashboard'
        const pageName = toPageName(pageTitle)
        const newPage: SpacesEditorPage = {
          id: crypto.randomUUID(),
          name: pageName,
          displayName: pageTitle,
          description: 'Dashboard page',
          isCustom: true,
          path: `/${pageName}`,
          order: (config.pages || []).length + 1,
          isActive: true,
          components: [],
          createdAt: now,
          updatedAt: now,
        }
        const updatedConfig: SpacesEditorConfig = {
          ...config,
          pages: [...(config.pages || []), newPage],
          updatedAt: now,
        }
        const saveRes = await fetch(`/api/spaces-editor/${createReportSpaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig),
        })
        if (!saveRes.ok) throw new Error('Failed to create page')
        pageId = newPage.id
      }

      // Create draft report linked to this page
      const pageName = pageMode === 'create'
        ? (newPageName.trim() || 'New Dashboard')
        : (spacePages.find(p => p.id === pageId)?.title || 'Dashboard')

      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pageName,
          source: 'BUILT_IN',
          space_ids: [createReportSpaceId],
          link: `/${selectedSpace.slug}/studio/page/${pageId}`,
          is_active: false,
          metadata: { page_id: pageId, space_id: createReportSpaceId },
        }),
      })
      if (!reportRes.ok) throw new Error('Failed to create report')

      setShowCreateReportDialog(false)
      resetCreateDialog()
      router.push(`/${selectedSpace.slug}/studio/page/${pageId}?editMode=true`)
    } catch (error: any) {
      showError(error.message || 'Failed to create dashboard')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <MergedBIReportsToolbar
        selectedSpaceId={selectedSpaceId}
        setSelectedSpaceId={setSelectedSpaceId}
        setCreateReportSpaceId={setCreateReportSpaceId}
        setShowCreateReportDialog={setShowCreateReportDialog}
        setShowIntegrationModal={setShowIntegrationModal}
        setShowEmbedModal={setShowEmbedModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        selectedReports={selectedReports}
        setSelectedReports={setSelectedReports}
        reports={reports}
        handleBulkDelete={handleBulkDelete}
        loadReports={loadReports}
      />
      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilters
          filters={filters}
          categories={categories}
          onFiltersChange={setFilters}
          onClear={() => setFilters({ source: '', category: '', status: '', showFavorites: false, dateFrom: '', dateTo: '' })}
        />
      )}

      {/* Reports View */}
      <ReportsTreeView
        reports={reports}
        categories={categories}
        folders={folders}
        loading={reportsLoading}
        searchTerm={searchTerm}
        selectedReports={selectedReports}
        onReportSelect={(reportId, selected) => {
          setSelectedReports(prev => {
            const newSet = new Set(prev)
            if (selected) {
              newSet.add(reportId)
            } else {
              newSet.delete(reportId)
            }
            return newSet
          })
        }}
        onReportClick={(report) => {
          if (report.source === 'BUILT_IN') {
            router.push(`/reports/${report.id}`)
          } else {
            // For external sources, open in new tab or embed
            if (report.embed_url) {
              window.open(report.embed_url, '_blank')
            } else if (report.link) {
              window.open(report.link, '_blank')
            }
          }
        }}
        onCategoryClick={(category) => {
          setSearchTerm(category.name)
        }}
        onRefresh={loadReports}
      />

      {/* Templates Dialog */}
      <ReportTemplatesDialog
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelectTemplate={(template) => {
          router.push(`/reports/new?template=${template.id}`)
        }}
      />

      {/* Integration Selection Modal */}
      <IntegrationSelectionModal
        open={showIntegrationModal}
        onOpenChange={setShowIntegrationModal}
        spaceId={currentSpace?.id}
        onSuccess={() => {
          setShowIntegrationModal(false)
          loadReports()
        }}
      />

      {/* Embed Report Modal */}
      <EmbedReportDialog
        open={showEmbedModal}
        onOpenChange={setShowEmbedModal}
        spaceId={currentSpace?.id}
        onSuccess={() => {
          setShowEmbedModal(false)
          loadReports()
        }}
      />

      <CreateDashboardDialog
        open={showCreateReportDialog}
        onOpenChange={(open) => {
          setShowCreateReportDialog(open)
          if (!open) resetCreateDialog()
        }}
        dialogStep={dialogStep}
        setDialogStep={setDialogStep}
        createReportSpaceId={createReportSpaceId}
        setCreateReportSpaceId={setCreateReportSpaceId}
        pagesLoading={pagesLoading}
        spacePages={spacePages}
        selectedPageId={selectedPageId}
        setSelectedPageId={setSelectedPageId}
        pageMode={pageMode}
        setPageMode={setPageMode}
        newPageName={newPageName}
        setNewPageName={setNewPageName}
        isCreating={isCreating}
        handleNextStep={handleNextStep}
        handleConfirmCreate={handleConfirmCreate}
      />
    </div>
  )
}

