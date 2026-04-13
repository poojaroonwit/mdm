'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody, DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Database,
  Globe,
  Image,
  Plus,
  Edit,
  Trash2,
  Upload,
  Save,
  X,
  Languages,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AssetType {
  id: string
  code: string
  name: string
  description?: string
  category: string
  isActive: boolean
  isSystem: boolean
  sortOrder: number
}

interface Asset {
  id: string
  code: string
  name: string
  description?: string
  logo?: string
  icon?: string
  color?: string
  isActive: boolean
  isSystem: boolean
  sortOrder: number
  metadata?: any
  assetType: AssetType
}

interface Language {
  id: string
  code: string
  name: string
  nativeName: string
  flag?: string
  isActive: boolean
  isDefault: boolean
}

interface Localization {
  id: string
  languageId: string
  entityType: string
  entityId: string
  field: string
  value: string
  language: Language
}

export function AssetManagement() {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [localizations, setLocalizations] = useState<Localization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('assets')
  const [selectedAssetType, setSelectedAssetType] = useState<string>('database_type')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')

  // Dialog states
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [showLocalizationDialog, setShowLocalizationDialog] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)

  // Form states
  const [assetForm, setAssetForm] = useState({
    code: '',
    name: '',
    description: '',
    icon: '',
    color: '',
    sortOrder: 0,
    metadata: {},
  })
  const [languageForm, setLanguageForm] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  })
  const [localizationForm, setLocalizationForm] = useState({
    entityType: 'asset',
    entityId: '',
    field: 'name',
    value: '',
  })

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

      if (typesRes.ok) {
        const types = await typesRes.json()
        setAssetTypes(types)
      }

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json()
        setAssets(assetsData)
      }

      if (languagesRes.ok) {
        const langs = await languagesRes.json()
        setLanguages(langs)
        if (langs.length > 0 && !selectedLanguage) {
          setSelectedLanguage(langs[0].code)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAsset = async () => {
    try {
      const assetType = assetTypes.find((t) => t.code === selectedAssetType)
      if (!assetType) {
        toast.error('Please select an asset type')
        return
      }

      const payload = {
        assetTypeId: assetType.id,
        ...assetForm,
      }

      if (editingAsset) {
        const res = await fetch(`/api/admin/assets/${editingAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Asset updated successfully')
      } else {
        const res = await fetch('/api/admin/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create')
        toast.success('Asset created successfully')
      }

      setShowAssetDialog(false)
      setEditingAsset(null)
      setAssetForm({
        code: '',
        name: '',
        description: '',
        icon: '',
        color: '',
        sortOrder: 0,
        metadata: {},
      })
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
      const res = await fetch(`/api/admin/assets/${asset.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
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

      const res = await fetch('/api/admin/assets/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()

      // Update asset with logo URL
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
      if (editingLanguage) {
        const res = await fetch(`/api/admin/assets/languages/${editingLanguage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(languageForm),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Language updated successfully')
      } else {
        const res = await fetch('/api/admin/assets/languages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(languageForm),
        })
        if (!res.ok) throw new Error('Failed to create')
        toast.success('Language created successfully')
      }

      setShowLanguageDialog(false)
      setEditingLanguage(null)
      setLanguageForm({
        code: '',
        name: '',
        nativeName: '',
        flag: '',
        isActive: true,
        isDefault: false,
        sortOrder: 0,
      })
      loadData()
    } catch (error) {
      toast.error('Failed to save language')
    }
  }

  const handleSaveLocalization = async () => {
    try {
      const res = await fetch('/api/admin/assets/localizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageCode: selectedLanguage,
          ...localizationForm,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      toast.success('Localization saved successfully')
      setShowLocalizationDialog(false)
      setLocalizationForm({
        entityType: 'asset',
        entityId: '',
        field: 'name',
        value: '',
      })
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

      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="assets" className="flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Asset Types
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-1.5">
            <Languages className="h-4 w-4" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="localizations" className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            Localizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assets</CardTitle>
                  <CardDescription>
                    Manage assets by type (database types, system types, etc.)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.id} value={type.code}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setEditingAsset(null)
                      setAssetForm({
                        code: '',
                        name: '',
                        description: '',
                        icon: '',
                        color: '',
                        sortOrder: 0,
                        metadata: {},
                      })
                      setShowAssetDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assets found. Click "Add Asset" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon/Logo</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {asset.logo ? (
                              <img
                                src={asset.logo}
                                alt={asset.name}
                                className="h-8 w-8 rounded"
                              />
                            ) : asset.icon ? (
                              <span className="text-2xl">{asset.icon}</span>
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`logo-${asset.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadLogo(asset.id, file)
                              }}
                            />
                            <label
                              htmlFor={`logo-${asset.id}`}
                              className="cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                              <Upload className="h-4 w-4" />
                            </label>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{asset.code}</code>
                        </TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {asset.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={asset.isActive ? 'default' : 'secondary'}>
                            {asset.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditAsset(asset)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!asset.isSystem && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAsset(asset)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Types</CardTitle>
              <CardDescription>Manage asset type categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <code className="text-sm">{type.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <Badge>{type.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? 'default' : 'secondary'}>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Languages</CardTitle>
                  <CardDescription>Manage supported languages</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingLanguage(null)
                    setLanguageForm({
                      code: '',
                      name: '',
                      nativeName: '',
                      flag: '',
                      isActive: true,
                      isDefault: false,
                      sortOrder: 0,
                    })
                    setShowLanguageDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {languages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No languages found. Click "Add Language" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flag</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Native Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {languages.map((lang) => (
                    <TableRow key={lang.id}>
                      <TableCell>{lang.flag || '🌐'}</TableCell>
                      <TableCell>
                        <code className="text-sm">{lang.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{lang.name}</TableCell>
                      <TableCell>{lang.nativeName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={lang.isActive ? 'default' : 'secondary'}>
                            {lang.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {lang.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLanguage(lang)
                            setLanguageForm({
                              code: lang.code,
                              name: lang.name,
                              nativeName: lang.nativeName,
                              flag: lang.flag || '',
                              isActive: lang.isActive,
                              isDefault: lang.isDefault,
                              sortOrder: 0,
                            })
                            setShowLanguageDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Localizations</CardTitle>
                  <CardDescription>Manage translations for assets</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.code}>
                          {lang.flag} {lang.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      setLocalizationForm({
                        entityType: 'asset',
                        entityId: '',
                        field: 'name',
                        value: '',
                      })
                      setShowLocalizationDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Translation
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Select an asset and language to manage translations
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Asset Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Asset' : 'Create Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? 'Update asset information'
                : 'Create a new asset for the selected type'}
            </DialogDescription>
          </DialogHeader>
                <DialogBody>
<div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={assetForm.code}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, code: e.target.value })
                  }
                  disabled={!!editingAsset}
                  placeholder="e.g., postgresql"
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={assetForm.name}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, name: e.target.value })
                  }
                  placeholder="e.g., PostgreSQL"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={assetForm.description}
                onChange={(e) =>
                  setAssetForm({ ...assetForm, description: e.target.value })
                }
                placeholder="Asset description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Input
                  value={assetForm.icon}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, icon: e.target.value })
                  }
                  placeholder="🐘"
                />
              </div>
              <div>
                <Label>Color (Hex)</Label>
                <Input
                  value={assetForm.color}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, color: e.target.value })
                  }
                  placeholder="#336791"
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={assetForm.sortOrder}
                  onChange={(e) =>
                    setAssetForm({
                      ...assetForm,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
                </DialogBody>
                <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLanguage ? 'Edit Language' : 'Add Language'}
            </DialogTitle>
          </DialogHeader>
                <DialogBody>
<div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code (ISO 639-1) *</Label>
                <Input
                  value={languageForm.code}
                  onChange={(e) =>
                    setLanguageForm({ ...languageForm, code: e.target.value })
                  }
                  disabled={!!editingLanguage}
                  placeholder="en"
                />
              </div>
              <div>
                <Label>Flag (Emoji)</Label>
                <Input
                  value={languageForm.flag}
                  onChange={(e) =>
                    setLanguageForm({ ...languageForm, flag: e.target.value })
                  }
                  placeholder="🇺🇸"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={languageForm.name}
                  onChange={(e) =>
                    setLanguageForm({ ...languageForm, name: e.target.value })
                  }
                  placeholder="English"
                />
              </div>
              <div>
                <Label>Native Name</Label>
                <Input
                  value={languageForm.nativeName}
                  onChange={(e) =>
                    setLanguageForm({
                      ...languageForm,
                      nativeName: e.target.value,
                    })
                  }
                  placeholder="English"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={languageForm.isActive}
                  onCheckedChange={(checked) =>
                    setLanguageForm({ ...languageForm, isActive: checked })
                  }
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={languageForm.isDefault}
                  onCheckedChange={(checked) =>
                    setLanguageForm({ ...languageForm, isDefault: checked })
                  }
                />
                <Label>Default</Label>
              </div>
            </div>
          </div>
                </DialogBody>
                <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLanguageDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLanguage}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Localization Dialog */}
      <Dialog
        open={showLocalizationDialog}
        onOpenChange={setShowLocalizationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Translation</DialogTitle>
            <DialogDescription>
              Add translation for {selectedLanguage}
            </DialogDescription>
          </DialogHeader>
                <DialogBody>
<div className="space-y-4">
            <div>
              <Label>Entity Type</Label>
              <Select
                value={localizationForm.entityType}
                onValueChange={(value) =>
                  setLocalizationForm({ ...localizationForm, entityType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="asset_type">Asset Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entity</Label>
              <Select
                value={localizationForm.entityId}
                onValueChange={(value) =>
                  setLocalizationForm({ ...localizationForm, entityId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {localizationForm.entityType === 'asset' &&
                    assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  {localizationForm.entityType === 'asset_type' &&
                    assetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Field</Label>
              <Select
                value={localizationForm.field}
                onValueChange={(value) =>
                  setLocalizationForm({ ...localizationForm, field: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Translation</Label>
              <Textarea
                value={localizationForm.value}
                onChange={(e) =>
                  setLocalizationForm({ ...localizationForm, value: e.target.value })
                }
                placeholder="Enter translation"
                rows={3}
              />
            </div>
          </div>
                </DialogBody>
                <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLocalizationDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLocalization}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

