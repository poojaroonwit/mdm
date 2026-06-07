'use client'

import { useEffect, useState } from 'react'
import { Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { AssetManagementDialogs } from './AssetManagementDialogs'
import { AssetManagementTabs } from './AssetManagementTabs'
import type { Asset, AssetForm, AssetType, Language, LanguageForm, LocalizationForm } from './asset-management-types'

const emptyAssetForm: AssetForm = {
  code: '',
  name: '',
  description: '',
  icon: '',
  color: '',
  sortOrder: 0,
  metadata: {},
}

const emptyLanguageForm: LanguageForm = {
  code: '',
  name: '',
  nativeName: '',
  flag: '',
  isActive: true,
  isDefault: false,
  sortOrder: 0,
}

const emptyLocalizationForm: LocalizationForm = {
  entityType: 'asset',
  entityId: '',
  field: 'name',
  value: '',
}

export function AssetManagement() {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('assets')
  const [selectedAssetType, setSelectedAssetType] = useState('database_type')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [showLocalizationDialog, setShowLocalizationDialog] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)
  const [assetForm, setAssetForm] = useState<AssetForm>(emptyAssetForm)
  const [languageForm, setLanguageForm] = useState<LanguageForm>(emptyLanguageForm)
  const [localizationForm, setLocalizationForm] = useState<LocalizationForm>(emptyLocalizationForm)

  useEffect(() => {
    loadData()
  }, [selectedAssetType])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [typesRes, assetsRes, languagesRes] = await Promise.all([
        fetch('/api/admin/assets/types'),
        fetch(`/api/admin/assets?assetTypeCode=${selectedAssetType}`),
        fetch('/api/admin/assets/languages?isActive=true'),
      ])

      if (typesRes.ok) setAssetTypes(await typesRes.json())
      if (assetsRes.ok) setAssets(await assetsRes.json())
      if (languagesRes.ok) {
        const loadedLanguages = await languagesRes.json()
        setLanguages(loadedLanguages)
        if (loadedLanguages.length > 0 && !selectedLanguage) {
          setSelectedLanguage(loadedLanguages[0].code)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const resetAssetDialog = () => {
    setEditingAsset(null)
    setAssetForm(emptyAssetForm)
    setShowAssetDialog(true)
  }

  const resetLanguageDialog = () => {
    setEditingLanguage(null)
    setLanguageForm(emptyLanguageForm)
    setShowLanguageDialog(true)
  }

  const resetLocalizationDialog = () => {
    setLocalizationForm(emptyLocalizationForm)
    setShowLocalizationDialog(true)
  }

  const handleSaveAsset = async () => {
    try {
      const assetType = assetTypes.find((type) => type.code === selectedAssetType)
      if (!assetType) {
        toast.error('Please select an asset type')
        return
      }

      const payload = { assetTypeId: assetType.id, ...assetForm }
      const response = await fetch(editingAsset ? `/api/admin/assets/${editingAsset.id}` : '/api/admin/assets', {
        method: editingAsset ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save')
      toast.success(editingAsset ? 'Asset updated successfully' : 'Asset created successfully')
      setShowAssetDialog(false)
      setEditingAsset(null)
      setAssetForm(emptyAssetForm)
      loadData()
    } catch (error) {
      toast.error('Failed to save asset')
    }
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (asset.isSystem) {
      toast.error('Cannot delete system asset')
      return
    }
    if (!confirm(`Are you sure you want to delete ${asset.name}?`)) return

    try {
      const response = await fetch(`/api/admin/assets/${asset.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Asset deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete asset')
    }
  }

  const handleUploadLogo = async (assetId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('assetId', assetId)

      const uploadResponse = await fetch('/api/admin/assets/upload-logo', {
        method: 'POST',
        body: formData,
      })
      if (!uploadResponse.ok) throw new Error('Upload failed')

      const { url } = await uploadResponse.json()
      await fetch(`/api/admin/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: url }),
      })

      toast.success('Logo uploaded successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to upload logo')
    }
  }

  const handleSaveLanguage = async () => {
    try {
      const response = await fetch(
        editingLanguage ? `/api/admin/assets/languages/${editingLanguage.id}` : '/api/admin/assets/languages',
        {
          method: editingLanguage ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(languageForm),
        }
      )

      if (!response.ok) throw new Error('Failed to save')
      toast.success(editingLanguage ? 'Language updated successfully' : 'Language created successfully')
      setShowLanguageDialog(false)
      setEditingLanguage(null)
      setLanguageForm(emptyLanguageForm)
      loadData()
    } catch (error) {
      toast.error('Failed to save language')
    }
  }

  const handleSaveLocalization = async () => {
    try {
      const response = await fetch('/api/admin/assets/localizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageCode: selectedLanguage, ...localizationForm }),
      })

      if (!response.ok) throw new Error('Failed to save')
      toast.success('Localization saved successfully')
      setShowLocalizationDialog(false)
      setLocalizationForm(emptyLocalizationForm)
    } catch (error) {
      toast.error('Failed to save localization')
    }
  }

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setAssetForm({
      code: asset.code,
      name: asset.name,
      description: asset.description || '',
      icon: asset.icon || '',
      color: asset.color || '',
      sortOrder: asset.sortOrder,
      metadata: asset.metadata || {},
    })
    setShowAssetDialog(true)
  }

  const openEditLanguage = (language: Language) => {
    setEditingLanguage(language)
    setLanguageForm({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      flag: language.flag || '',
      isActive: language.isActive,
      isDefault: language.isDefault,
      sortOrder: 0,
    })
    setShowLanguageDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Asset Management
          </h2>
          <p className="text-muted-foreground">
            Manage database types, system types, logos, and localizations
          </p>
        </div>
      </div>

      <AssetManagementTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        assetTypes={assetTypes}
        assets={assets}
        languages={languages}
        isLoading={isLoading}
        selectedAssetType={selectedAssetType}
        setSelectedAssetType={setSelectedAssetType}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        onAddAsset={resetAssetDialog}
        onEditAsset={openEditAsset}
        onDeleteAsset={handleDeleteAsset}
        onUploadLogo={handleUploadLogo}
        onAddLanguage={resetLanguageDialog}
        onEditLanguage={openEditLanguage}
        onAddLocalization={resetLocalizationDialog}
      />

      <AssetManagementDialogs
        assets={assets}
        assetTypes={assetTypes}
        selectedLanguage={selectedLanguage}
        showAssetDialog={showAssetDialog}
        setShowAssetDialog={setShowAssetDialog}
        editingAsset={editingAsset}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        onSaveAsset={handleSaveAsset}
        showLanguageDialog={showLanguageDialog}
        setShowLanguageDialog={setShowLanguageDialog}
        editingLanguage={editingLanguage}
        languageForm={languageForm}
        setLanguageForm={setLanguageForm}
        onSaveLanguage={handleSaveLanguage}
        showLocalizationDialog={showLocalizationDialog}
        setShowLocalizationDialog={setShowLocalizationDialog}
        localizationForm={localizationForm}
        setLocalizationForm={setLocalizationForm}
        onSaveLocalization={handleSaveLocalization}
      />
    </div>
  )
}
