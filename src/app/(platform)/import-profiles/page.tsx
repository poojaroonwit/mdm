'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  ArrowLeft
} from 'lucide-react'
import { ImportProfileFormFields } from './components/ImportProfileFormFields'
import { ImportProfilesList } from './components/ImportProfilesList'

interface ImportProfile {
  id: string
  name: string
  description?: string
  data_model: string
  file_types: string[]
  header_row: number
  data_start_row: number
  chunk_size: number
  max_items?: number
  import_type: 'insert' | 'upsert' | 'delete'
  primary_key_attribute?: string
  date_format: string
  time_format: string
  boolean_format: string
  attribute_mapping: Record<string, string>
  attribute_options: Record<string, string[]>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  import_profile_sharing: Array<{
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

type DataModel = { id: string; name: string; display_name: string }
type DataModelAttribute = { id: string; name: string; display_name: string; type?: string; data_type?: string }

export default function ImportProfilesPage() {
  const [profiles, setProfiles] = useState<ImportProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ImportProfile | null>(null)
  const [models, setModels] = useState<DataModel[]>([])
  const [modelAttributes, setModelAttributes] = useState<DataModelAttribute[]>([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [attributeSearch, setAttributeSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataModel: '',
    fileTypes: ['csv'],
    headerRow: 1,
    dataStartRow: 2,
    chunkSize: 1000,
    maxItems: '',
    importType: 'insert' as 'insert' | 'upsert' | 'delete',
    primaryKeyAttribute: '',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    booleanFormat: 'true/false',
    attributeMapping: {} as Record<string, string>,
    attributeOptions: {} as Record<string, string[]>,
    optionImportMapping: {} as Record<string, Record<string, string>>, // { [attributeName]: { [internalOption]: incomingValue } }
    selectedAttributes: [] as string[],
    isPublic: false,
    sharing: [] as SharingConfig[]
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (createDialogOpen || editDialogOpen) {
      void fetchDataModels()
    }
  }, [createDialogOpen, editDialogOpen])

  useEffect(() => {
    if (!selectedModelId) {
      setModelAttributes([])
      return
    }
    const m = models.find(x => x.id === selectedModelId)
    setFormData(prev => ({ ...prev, dataModel: m?.name || m?.display_name || '' }))
    void fetchModelAttributes(selectedModelId)
  }, [selectedModelId])

  useEffect(() => {
    if (!editDialogOpen || selectedModelId || !formData.dataModel) {
      return
    }

    const selectedModel = models.find(model => model.name === formData.dataModel || model.display_name === formData.dataModel)
    if (selectedModel) {
      setSelectedModelId(selectedModel.id)
    }
  }, [editDialogOpen, formData.dataModel, models, selectedModelId])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/import-profiles')
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
      const res = await fetch('/api/data-models?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setModels(data.dataModels || [])
      }
    } catch (e) {
      console.error('Error loading models', e)
    }
  }

  const fetchModelAttributes = async (id: string) => {
    try {
      const res = await fetch(`/api/data-models/${id}/attributes`)
      if (res.ok) {
        const data = await res.json()
        setModelAttributes(data.attributes || [])
      }
    } catch (e) {
      console.error('Error loading attributes', e)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/import-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxItems: formData.maxItems ? parseInt(formData.maxItems) : null
        })
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
      const response = await fetch(`/api/import-profiles/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxItems: formData.maxItems ? parseInt(formData.maxItems) : null
        })
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
      const response = await fetch(`/api/import-profiles/${selectedProfile.id}`, {
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
      fileTypes: ['csv'],
      headerRow: 1,
      dataStartRow: 2,
      chunkSize: 1000,
      maxItems: '',
      importType: 'insert',
      primaryKeyAttribute: '',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      booleanFormat: 'true/false',
      attributeMapping: {},
      attributeOptions: {},
      optionImportMapping: {},
      selectedAttributes: [],
      isPublic: false,
      sharing: []
    })
    setAttributeSearch('')
    setSelectedModelId('')
  }

  const openEditDialog = (profile: ImportProfile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      dataModel: profile.data_model,
      fileTypes: profile.file_types,
      headerRow: profile.header_row,
      dataStartRow: profile.data_start_row,
      chunkSize: profile.chunk_size,
      maxItems: profile.max_items?.toString() || '',
      importType: profile.import_type,
      primaryKeyAttribute: profile.primary_key_attribute || '',
      dateFormat: profile.date_format,
      timeFormat: profile.time_format,
      booleanFormat: profile.boolean_format,
      attributeMapping: profile.attribute_mapping,
      attributeOptions: profile.attribute_options,
      isPublic: profile.is_public,
      sharing: profile.import_profile_sharing.map(s => ({
        type: s.sharing_type as 'all_users' | 'group' | 'specific_users',
        targetId: s.target_id,
        targetGroup: s.target_group
      })),
      optionImportMapping: {},
      selectedAttributes: []
    })
    const selectedModel = models.find(model => model.name === profile.data_model || model.display_name === profile.data_model)
    setSelectedModelId(selectedModel?.id || '')
    setAttributeSearch('')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (profile: ImportProfile) => {
    setSelectedProfile(profile)
    setDeleteDialogOpen(true)
  }

  const toggleFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter(ft => ft !== fileType)
        : [...prev.fileTypes, fileType]
    }))
  }

  const updateAttributeMapping = (attribute: string, fileColumn: string) => {
    setFormData(prev => ({
      ...prev,
      attributeMapping: {
        ...prev.attributeMapping,
        [attribute]: fileColumn
      }
    }))
  }

  const toggleSelectedAttribute = (attribute: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedAttributes.includes(attribute)
      const next = isSelected
        ? prev.selectedAttributes.filter(a => a !== attribute)
        : [...prev.selectedAttributes, attribute]
      return { ...prev, selectedAttributes: next }
    })
  }

  const toggleSelectAllAttributes = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedAttributes: checked ? modelAttributes.map(a => a.name) : []
    }))
  }

  const updateOptionImportMapping = (attribute: string, optionKey: string, mappedValue: string) => {
    setFormData(prev => ({
      ...prev,
      optionImportMapping: {
        ...prev.optionImportMapping,
        [attribute]: {
          ...(prev.optionImportMapping[attribute] || {}),
          [optionKey]: mappedValue
        }
      }
    }))
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
            <h1 className="text-3xl font-bold tracking-tight">Import Profiles</h1>
            <p className="text-muted-foreground">
              Manage import profiles and configure data mapping, formats, and sharing permissions
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Import Profile</DialogTitle>
                <DialogDescription>
                  Create a new import profile with data mapping, format settings, and sharing configuration
                </DialogDescription>
              </DialogHeader>
              <ImportProfileFormFields
                attributeSearch={attributeSearch}
                formData={formData}
                modelAttributes={modelAttributes}
                models={models}
                selectedModelId={selectedModelId}
                addSharing={addSharing}
                removeSharing={removeSharing}
                setAttributeSearch={setAttributeSearch}
                setFormData={setFormData}
                setSelectedModelId={setSelectedModelId}
                toggleFileType={toggleFileType}
                toggleSelectedAttribute={toggleSelectedAttribute}
                toggleSelectAllAttributes={toggleSelectAllAttributes}
                updateAttributeMapping={updateAttributeMapping}
                updateOptionImportMapping={updateOptionImportMapping}
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
          <ImportProfilesList
            profiles={profiles}
            onCreateProfile={() => setCreateDialogOpen(true)}
            onDeleteProfile={openDeleteDialog}
            onEditProfile={openEditDialog}
          />
        </div>
        {/* Edit Dialog - Similar structure to create dialog but with pre-filled data */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Import Profile</DialogTitle>
              <DialogDescription>
                Update the import profile settings and sharing configuration
              </DialogDescription>
            </DialogHeader>
            {/* Similar form structure as create dialog but with edit-specific handlers */}
            <ImportProfileFormFields
              attributeSearch={attributeSearch}
              formData={formData}
              idPrefix="edit-"
              modelAttributes={modelAttributes}
              models={models}
              selectedModelId={selectedModelId}
              addSharing={addSharing}
              removeSharing={removeSharing}
              setAttributeSearch={setAttributeSearch}
              setFormData={setFormData}
              setSelectedModelId={setSelectedModelId}
              toggleFileType={toggleFileType}
              toggleSelectedAttribute={toggleSelectedAttribute}
              toggleSelectAllAttributes={toggleSelectAllAttributes}
              updateAttributeMapping={updateAttributeMapping}
              updateOptionImportMapping={updateOptionImportMapping}
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
              <DialogTitle>Delete Import Profile</DialogTitle>
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
