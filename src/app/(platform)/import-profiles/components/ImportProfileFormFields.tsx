'use client'

import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UserCombobox } from '@/components/ui/user-combobox'
import { Trash2 } from 'lucide-react'

interface SharingConfig {
  type: 'all_users' | 'group' | 'specific_users'
  targetId?: string
  targetGroup?: string
}

type ImportType = 'insert' | 'upsert' | 'delete'

interface DataModel {
  id: string
  name: string
  display_name: string
}

interface DataModelAttribute {
  id: string
  name: string
  display_name: string
  type?: string
  data_type?: string
  options?: unknown
}

interface ImportProfileFormData {
  name: string
  description: string
  dataModel: string
  fileTypes: string[]
  headerRow: number
  dataStartRow: number
  chunkSize: number
  maxItems: string
  importType: ImportType
  primaryKeyAttribute: string
  dateFormat: string
  timeFormat: string
  booleanFormat: string
  attributeMapping: Record<string, string>
  attributeOptions: Record<string, string[]>
  optionImportMapping: Record<string, Record<string, string>>
  selectedAttributes: string[]
  isPublic: boolean
  sharing: SharingConfig[]
}

interface ImportProfileFormFieldsProps {
  attributeSearch: string
  formData: ImportProfileFormData
  idPrefix?: string
  modelAttributes: DataModelAttribute[]
  models: DataModel[]
  selectedModelId: string
  addSharing: () => void
  removeSharing: (index: number) => void
  setAttributeSearch: (value: string) => void
  setFormData: Dispatch<SetStateAction<ImportProfileFormData>>
  setSelectedModelId: (value: string) => void
  toggleFileType: (fileType: string) => void
  toggleSelectedAttribute: (attribute: string) => void
  toggleSelectAllAttributes: (checked: boolean) => void
  updateAttributeMapping: (attribute: string, fileColumn: string) => void
  updateOptionImportMapping: (attribute: string, optionKey: string, mappedValue: string) => void
  updateSharing: (index: number, field: string, value: string) => void
}

const fileTypes = ['csv', 'xlsx', 'xls']
const importTypes = [
  { value: 'insert', label: 'Insert Only' },
  { value: 'upsert', label: 'Insert or Update' },
  { value: 'delete', label: 'Delete Records' }
]
const dateFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM-DD-YYYY']
const timeFormats = ['HH:mm:ss', 'HH:mm', 'h:mm:ss A', 'h:mm A']
const booleanFormats = ['true/false', 'yes/no', '1/0', 'Y/N', 'on/off', 'enabled/disabled']

const getOptionList = (attribute: DataModelAttribute, fallbackOptions: Record<string, string[]>) => {
  const source = attribute.options ?? fallbackOptions[attribute.name]

  if (Array.isArray(source)) {
    return source
      .map((item) => (typeof item === 'string' ? item : ((item as { value?: string; label?: string })?.value ?? (item as { label?: string })?.label ?? '')))
      .filter(Boolean)
  }

  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item : (item?.value ?? item?.label ?? '')))
          .filter(Boolean)
      }
    } catch {}
  }

  return []
}

const isSelectableAttribute = (attribute: DataModelAttribute) => {
  const type = (attribute.type || attribute.data_type || '').toUpperCase()
  return type === 'SELECT' || type === 'MULTI_SELECT'
}

export function ImportProfileFormFields({
  attributeSearch,
  formData,
  idPrefix = '',
  modelAttributes,
  models,
  selectedModelId,
  addSharing,
  removeSharing,
  setAttributeSearch,
  setFormData,
  setSelectedModelId,
  toggleFileType,
  toggleSelectedAttribute,
  toggleSelectAllAttributes,
  updateAttributeMapping,
  updateOptionImportMapping,
  updateSharing
}: ImportProfileFormFieldsProps) {
  const fieldId = (id: string) => `${idPrefix}${id}`
  const selectableAttributes = modelAttributes.filter(isSelectableAttribute)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile">
        <TabsList className="mb-2">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="mapping">Attribute Mapping</TabsTrigger>
          <TabsTrigger value="options">Attribute Option Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={fieldId('name')}>Profile Name</Label>
              <Input
                id={fieldId('name')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter profile name"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Model</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.display_name || model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('description')}>Description</Label>
            <Textarea
              id={fieldId('description')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter profile description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>File Types</Label>
              <div className="space-y-2">
                {fileTypes.map(fileType => (
                  <div key={fileType} className="flex items-center space-x-2">
                    <Checkbox
                      id={fieldId(fileType)}
                      checked={formData.fileTypes.includes(fileType)}
                      onCheckedChange={() => toggleFileType(fileType)}
                    />
                    <Label htmlFor={fieldId(fileType)} className="text-sm">
                      {fileType.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Import Type</Label>
              <RadioGroup
                value={formData.importType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, importType: value as ImportType }))}
              >
                {importTypes.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={fieldId(type.value)} />
                    <Label htmlFor={fieldId(type.value)} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={fieldId('isPublic')}
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
                />
                <Label htmlFor={fieldId('isPublic')}>Make this profile public</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={fieldId('headerRow')}>Header Row</Label>
              <Input
                id={fieldId('headerRow')}
                type="number"
                value={formData.headerRow}
                onChange={(e) => setFormData(prev => ({ ...prev, headerRow: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId('dataStartRow')}>Data Start Row</Label>
              <Input
                id={fieldId('dataStartRow')}
                type="number"
                value={formData.dataStartRow}
                onChange={(e) => setFormData(prev => ({ ...prev, dataStartRow: parseInt(e.target.value) || 2 }))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId('chunkSize')}>Chunk Size</Label>
              <Input
                id={fieldId('chunkSize')}
                type="number"
                value={formData.chunkSize}
                onChange={(e) => setFormData(prev => ({ ...prev, chunkSize: parseInt(e.target.value) || 1000 }))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldId('maxItems')}>Max Items (optional)</Label>
              <Input
                id={fieldId('maxItems')}
                type="number"
                value={formData.maxItems}
                onChange={(e) => setFormData(prev => ({ ...prev, maxItems: e.target.value }))}
                placeholder="No limit"
              />
            </div>
          </div>

          {formData.importType !== 'insert' && (
            <div className="space-y-2">
              <Label htmlFor={fieldId('primaryKeyAttribute')}>Primary Key Attribute</Label>
              <Select
                value={formData.primaryKeyAttribute}
                onValueChange={(value) => setFormData(prev => ({ ...prev, primaryKeyAttribute: value }))}
              >
                <SelectTrigger id={fieldId('primaryKeyAttribute')}>
                  <SelectValue placeholder="Select primary key attribute" />
                </SelectTrigger>
                <SelectContent>
                  {modelAttributes.map(attr => (
                    <SelectItem key={attr.id} value={attr.name}>
                      {attr.display_name || attr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={formData.dateFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={formData.timeFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, timeFormat: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Boolean Format</Label>
              <Select value={formData.booleanFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, booleanFormat: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {booleanFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Sharing Configuration</Label>
            <div className="space-y-2">
              {formData.sharing.map((share, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <Select value={share.type} onValueChange={(value) => updateSharing(index, 'type', value)}>
                    <SelectTrigger className="col-span-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="specific_users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                  {share.type === 'group' && (
                    <Input
                      className="col-span-4"
                      placeholder="Group name"
                      value={share.targetGroup || ''}
                      onChange={(e) => updateSharing(index, 'targetGroup', e.target.value)}
                    />
                  )}
                  {share.type === 'specific_users' && (
                    <div className="col-span-4">
                      <UserCombobox
                        value={share.targetId}
                        onValueChange={(value) => updateSharing(index, 'targetId', value)}
                        placeholder="Search user..."
                      />
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeSharing(index)} className="col-span-1">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSharing}>
                Add Sharing Rule
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Attribute Mapping</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search attribute..."
                value={attributeSearch}
                onChange={(e) => setAttributeSearch(e.target.value)}
                className="h-8 w-56"
              />
              <Checkbox
                id={fieldId('selectAllAttributes')}
                checked={modelAttributes.length > 0 && formData.selectedAttributes.length === modelAttributes.length}
                onCheckedChange={(checked) => toggleSelectAllAttributes(!!checked)}
              />
              <Label htmlFor={fieldId('selectAllAttributes')} className="text-sm">
                Select All
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            {modelAttributes.length === 0 && (
              <div className="text-sm text-muted-foreground">Select a data model to load attributes.</div>
            )}
            {modelAttributes
              .filter(attr => {
                const query = attributeSearch.trim().toLowerCase()
                if (!query) return true
                const name = (attr.display_name || attr.name || '').toLowerCase()
                return name.includes(query)
              })
              .map(attr => (
                <div key={attr.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 flex items-center gap-2">
                    <Checkbox
                      id={fieldId(`attr-${attr.id}`)}
                      checked={formData.selectedAttributes.includes(attr.name)}
                      onCheckedChange={() => toggleSelectedAttribute(attr.name)}
                    />
                    <label htmlFor={fieldId(`attr-${attr.id}`)} className="text-sm font-medium cursor-pointer">
                      {attr.display_name || attr.name}
                    </label>
                  </div>
                  <div className="col-span-7">
                    <Input
                      placeholder="File column name"
                      value={formData.attributeMapping[attr.name] || ''}
                      onChange={(e) => updateAttributeMapping(attr.name, e.target.value)}
                      disabled={!formData.selectedAttributes.includes(attr.name)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Label>Attribute Option Mapping</Label>
          <div className="space-y-3">
            {selectableAttributes.map(attr => {
              const optionList = getOptionList(attr, formData.attributeOptions)

              return (
                <div key={attr.id} className="rounded-md border p-3 space-y-3">
                  <div className="text-sm font-medium">{attr.display_name || attr.name}</div>
                  {optionList.length === 0 && (
                    <div className="text-xs text-muted-foreground">No options defined. Add options to map incoming values.</div>
                  )}
                  <div className="space-y-2">
                    {optionList.map((option) => (
                      <div key={option} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 text-sm">{option}</div>
                        <div className="col-span-7">
                          <Input
                            placeholder="Incoming value to map"
                            value={formData.optionImportMapping[attr.name]?.[option] || ''}
                            onChange={(e) => updateOptionImportMapping(attr.name, option, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {modelAttributes.length > 0 && selectableAttributes.length === 0 && (
              <div className="text-sm text-muted-foreground">No selectable attributes for this model.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
