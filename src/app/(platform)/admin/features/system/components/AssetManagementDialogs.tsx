'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'
import type {
  Asset,
  AssetForm,
  AssetType,
  Language,
  LanguageForm,
  LocalizationForm,
} from './asset-management-types'

interface AssetManagementDialogsProps {
  assets: Asset[]
  assetTypes: AssetType[]
  selectedLanguage: string
  showAssetDialog: boolean
  setShowAssetDialog: (open: boolean) => void
  editingAsset: Asset | null
  assetForm: AssetForm
  setAssetForm: (form: AssetForm) => void
  onSaveAsset: () => void
  showLanguageDialog: boolean
  setShowLanguageDialog: (open: boolean) => void
  editingLanguage: Language | null
  languageForm: LanguageForm
  setLanguageForm: (form: LanguageForm) => void
  onSaveLanguage: () => void
  showLocalizationDialog: boolean
  setShowLocalizationDialog: (open: boolean) => void
  localizationForm: LocalizationForm
  setLocalizationForm: (form: LocalizationForm) => void
  onSaveLocalization: () => void
}

export function AssetManagementDialogs({
  assets,
  assetTypes,
  selectedLanguage,
  showAssetDialog,
  setShowAssetDialog,
  editingAsset,
  assetForm,
  setAssetForm,
  onSaveAsset,
  showLanguageDialog,
  setShowLanguageDialog,
  editingLanguage,
  languageForm,
  setLanguageForm,
  onSaveLanguage,
  showLocalizationDialog,
  setShowLocalizationDialog,
  localizationForm,
  setLocalizationForm,
  onSaveLocalization,
}: AssetManagementDialogsProps) {
  return (
    <>
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Create Asset'}</DialogTitle>
            <DialogDescription>
              {editingAsset ? 'Update asset information' : 'Create a new asset for the selected type'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={assetForm.code}
                    onChange={(event) => setAssetForm({ ...assetForm, code: event.target.value })}
                    disabled={!!editingAsset}
                    placeholder="e.g., postgresql"
                  />
                </div>
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={assetForm.name}
                    onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })}
                    placeholder="e.g., PostgreSQL"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={assetForm.description}
                  onChange={(event) => setAssetForm({ ...assetForm, description: event.target.value })}
                  placeholder="Asset description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Input
                    value={assetForm.icon}
                    onChange={(event) => setAssetForm({ ...assetForm, icon: event.target.value })}
                    placeholder="icon"
                  />
                </div>
                <div>
                  <Label>Color (Hex)</Label>
                  <Input
                    value={assetForm.color}
                    onChange={(event) => setAssetForm({ ...assetForm, color: event.target.value })}
                    placeholder="#336791"
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={assetForm.sortOrder}
                    onChange={(event) => setAssetForm({ ...assetForm, sortOrder: parseInt(event.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveAsset}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLanguage ? 'Edit Language' : 'Add Language'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code (ISO 639-1) *</Label>
                  <Input
                    value={languageForm.code}
                    onChange={(event) => setLanguageForm({ ...languageForm, code: event.target.value })}
                    disabled={!!editingLanguage}
                    placeholder="en"
                  />
                </div>
                <div>
                  <Label>Flag</Label>
                  <Input
                    value={languageForm.flag}
                    onChange={(event) => setLanguageForm({ ...languageForm, flag: event.target.value })}
                    placeholder="flag"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={languageForm.name}
                    onChange={(event) => setLanguageForm({ ...languageForm, name: event.target.value })}
                    placeholder="English"
                  />
                </div>
                <div>
                  <Label>Native Name</Label>
                  <Input
                    value={languageForm.nativeName}
                    onChange={(event) => setLanguageForm({ ...languageForm, nativeName: event.target.value })}
                    placeholder="English"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={languageForm.isActive}
                    onCheckedChange={(checked) => setLanguageForm({ ...languageForm, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={languageForm.isDefault}
                    onCheckedChange={(checked) => setLanguageForm({ ...languageForm, isDefault: checked })}
                  />
                  <Label>Default</Label>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveLanguage}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLocalizationDialog} onOpenChange={setShowLocalizationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Translation</DialogTitle>
            <DialogDescription>Add translation for {selectedLanguage}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <Label>Entity Type</Label>
                <Select
                  value={localizationForm.entityType}
                  onValueChange={(value) => setLocalizationForm({ ...localizationForm, entityType: value })}
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
                  onValueChange={(value) => setLocalizationForm({ ...localizationForm, entityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {localizationForm.entityType === 'asset' && assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                    {localizationForm.entityType === 'asset_type' && assetTypes.map((type) => (
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
                  onValueChange={(value) => setLocalizationForm({ ...localizationForm, field: value })}
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
                  onChange={(event) => setLocalizationForm({ ...localizationForm, value: event.target.value })}
                  placeholder="Enter translation"
                  rows={3}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocalizationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveLocalization}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
