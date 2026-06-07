'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Database, Edit, FileText, Globe, Languages, Plus, Trash2, Upload } from 'lucide-react'
import type { Asset, AssetType, Language } from './asset-management-types'

interface AssetManagementTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  assetTypes: AssetType[]
  assets: Asset[]
  languages: Language[]
  isLoading: boolean
  selectedAssetType: string
  setSelectedAssetType: (assetType: string) => void
  selectedLanguage: string
  setSelectedLanguage: (language: string) => void
  onAddAsset: () => void
  onEditAsset: (asset: Asset) => void
  onDeleteAsset: (asset: Asset) => void
  onUploadLogo: (assetId: string, file: File) => void
  onAddLanguage: () => void
  onEditLanguage: (language: Language) => void
  onAddLocalization: () => void
}

export function AssetManagementTabs({
  activeTab,
  setActiveTab,
  assetTypes,
  assets,
  languages,
  isLoading,
  selectedAssetType,
  setSelectedAssetType,
  selectedLanguage,
  setSelectedLanguage,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onUploadLogo,
  onAddLanguage,
  onEditLanguage,
  onAddLocalization,
}: AssetManagementTabsProps) {
  return (
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
                  <CardDescription>Manage assets by type (database types, system types, etc.)</CardDescription>
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
                  <Button onClick={onAddAsset}>
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
                              <img src={asset.logo} alt={asset.name} className="h-8 w-8 rounded" />
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
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) onUploadLogo(asset.id, file)
                              }}
                            />
                            <label htmlFor={`logo-${asset.id}`} className="cursor-pointer text-muted-foreground hover:text-foreground">
                              <Upload className="h-4 w-4" />
                            </label>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{asset.code}</code>
                        </TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell className="text-muted-foreground">{asset.description || '-'}</TableCell>
                        <TableCell>
                          <StatusBadge status={asset.isActive ? 'active' : 'inactive'} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onEditAsset(asset)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!asset.isSystem && (
                              <Button variant="ghost" size="sm" onClick={() => onDeleteAsset(asset)}>
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
                        <StatusBadge status={type.isActive ? 'active' : 'inactive'} />
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
                <Button onClick={onAddLanguage}>
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
                    {languages.map((language) => (
                      <TableRow key={language.id}>
                        <TableCell>{language.flag || '-'}</TableCell>
                        <TableCell>
                          <code className="text-sm">{language.code}</code>
                        </TableCell>
                        <TableCell className="font-medium">{language.name}</TableCell>
                        <TableCell>{language.nativeName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={language.isActive ? 'active' : 'inactive'} />
                            {language.isDefault && <Badge variant="outline">Default</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => onEditLanguage(language)}>
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
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.code}>
                          {language.flag} {language.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={onAddLocalization}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Translation
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select an asset and language to manage translations</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
