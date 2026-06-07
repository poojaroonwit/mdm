'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  ArrowLeft
} from 'lucide-react'
import { ExportProfileFormFields } from './components/ExportProfileFormFields'
import { ExportProfilesList } from './components/ExportProfilesList'

interface ExportProfile {
  id: string
  name: string
  description?: string
  data_model: string
  format: string
  columns: string[]
  filters: Array<{ attribute: string; operator: string; value: string }>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  export_profile_sharing: Array<{
    id: string
    sharing_type: string
    target_id?: string
    target_group?: string
  }>
}

interface SharingConfig {
  type: 'all_users' | 'group' | 'specific_users'
  targetId?: string
  targetGroup?: string
}

interface DataModel {
  id: string
  name: string
}

interface Attribute {
  id: string
  name: string
  display_name?: string
  data_type: string
}

const operatorOptions = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' }
]

export default function ExportProfilesPage() {
  const [profiles, setProfiles] = useState<ExportProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ExportProfile | null>(null)
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [modelAttributes, setModelAttributes] = useState<Attribute[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)
  const [columnSearch, setColumnSearch] = useState('')
  const [exporting, setExporting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataModel: '',
    format: 'xlsx',
    columns: [] as string[],
    filters: [{ attribute: '', operator: 'equals', value: '' }],
    isPublic: false,
    sharing: [] as SharingConfig[]
  })

  useEffect(() => {
    fetchProfiles()
    fetchDataModels()
  }, [])

  useEffect(() => {
    if (formData.dataModel) {
      fetchModelAttributes(formData.dataModel)
    } else {
      setModelAttributes([])
    }
  }, [formData.dataModel])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/export-profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDataModels = async () => {
    try {
      const response = await fetch('/api/data-models')
      if (response.ok) {
        const data = await response.json()
        setDataModels(data.dataModels || [])
      }
    } catch (error) {
      console.error('Error fetching data models:', error)
    }
  }

  const fetchModelAttributes = async (modelId: string) => {
    setLoadingAttributes(true)
    try {
      const response = await fetch(`/api/data-models/${modelId}/attributes`)
      if (response.ok) {
        const data = await response.json()
        setModelAttributes(data.attributes || [])
      }
    } catch (error) {
      console.error('Error fetching model attributes:', error)
    } finally {
      setLoadingAttributes(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/export-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        resetForm()
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const handleUpdate = async () => {
    if (!selectedProfile) return

    try {
      const response = await fetch(`/api/export-profiles/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setSelectedProfile(null)
        resetForm()
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedProfile) return

    try {
      const response = await fetch(`/api/export-profiles/${selectedProfile.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setSelectedProfile(null)
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dataModel: '',
      format: 'xlsx',
      columns: [],
      filters: [{ attribute: '', operator: 'equals', value: '' }],
      isPublic: false,
      sharing: []
    })
    setColumnSearch('')
  }

  const openEditDialog = (profile: ExportProfile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      dataModel: profile.data_model,
      format: profile.format,
      columns: profile.columns,
      filters: profile.filters.length > 0 ? profile.filters : [{ attribute: '', operator: 'equals', value: '' }],
      isPublic: profile.is_public,
      sharing: profile.export_profile_sharing.map(s => ({
        type: s.sharing_type as 'all_users' | 'group' | 'specific_users',
        targetId: s.target_id,
        targetGroup: s.target_group
      }))
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (profile: ExportProfile) => {
    setSelectedProfile(profile)
    setDeleteDialogOpen(true)
  }

  const addFilter = () => {
    setFormData(prev => ({
      ...prev,
      filters: [...prev.filters, { attribute: '', operator: 'equals', value: '' }]
    }))
  }

  const removeFilter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }))
  }

  const updateFilter = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const toggleColumn = (column: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }))
  }

  const toggleSelectAllColumns = (checked: boolean) => {
    if (checked) {
      const allColumnNames = modelAttributes.map(attr => attr.name)
      setFormData(prev => ({ ...prev, columns: allColumnNames }))
    } else {
      setFormData(prev => ({ ...prev, columns: [] }))
    }
  }

  const addSharing = () => {
    setFormData(prev => ({
      ...prev,
      sharing: [...prev.sharing, { type: 'all_users' }]
    }))
  }

  const removeSharing = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sharing: prev.sharing.filter((_, i) => i !== index)
    }))
  }

  const updateSharing = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sharing: prev.sharing.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }))
  }

  const handleExport = async (profileId: string) => {
    setExporting(profileId)
    try {
      const response = await fetch(`/api/export-profiles/${profileId}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${new Date().toISOString().split('T')[0]}.xlsx`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading profiles...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Export Profiles</h1>
            <p className="text-muted-foreground">
              Manage export profiles and configure sharing permissions
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Export Profile</DialogTitle>
                <DialogDescription>
                  Create a new export profile with custom columns, filters, and sharing settings
                </DialogDescription>
              </DialogHeader>
              <ExportProfileFormFields
                columnSearch={columnSearch}
                dataModels={dataModels}
                formData={formData}
                loadingAttributes={loadingAttributes}
                modelAttributes={modelAttributes}
                operatorOptions={operatorOptions}
                addFilter={addFilter}
                addSharing={addSharing}
                removeFilter={removeFilter}
                removeSharing={removeSharing}
                setColumnSearch={setColumnSearch}
                setFormData={setFormData}
                toggleColumn={toggleColumn}
                toggleSelectAllColumns={toggleSelectAllColumns}
                updateFilter={updateFilter}
                updateSharing={updateSharing}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name || !formData.dataModel}>
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <ExportProfilesList
            exporting={exporting}
            profiles={profiles}
            onCreateProfile={() => setCreateDialogOpen(true)}
            onDeleteProfile={openDeleteDialog}
            onEditProfile={openEditDialog}
            onExportProfile={handleExport}
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Export Profile</DialogTitle>
              <DialogDescription>
                Update the export profile settings and sharing configuration
              </DialogDescription>
            </DialogHeader>
            <ExportProfileFormFields
              columnSearch={columnSearch}
              dataModels={dataModels}
              formData={formData}
              idPrefix="edit-"
              loadingAttributes={loadingAttributes}
              modelAttributes={modelAttributes}
              operatorOptions={operatorOptions}
              addFilter={addFilter}
              addSharing={addSharing}
              removeFilter={removeFilter}
              removeSharing={removeSharing}
              setColumnSearch={setColumnSearch}
              setFormData={setFormData}
              toggleColumn={toggleColumn}
              toggleSelectAllColumns={toggleSelectAllColumns}
              updateFilter={updateFilter}
              updateSharing={updateSharing}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name || !formData.dataModel}>
                Update Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Export Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedProfile?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
