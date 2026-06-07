'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { UserCombobox } from '@/components/ui/user-combobox'
import { Trash2 } from 'lucide-react'

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

interface ExportProfileFormData {
  name: string
  description: string
  dataModel: string
  format: string
  columns: string[]
  filters: Array<{ attribute: string; operator: string; value: string }>
  isPublic: boolean
  sharing: SharingConfig[]
}

interface ExportProfileFormFieldsProps {
  columnSearch: string
  dataModels: DataModel[]
  formData: ExportProfileFormData
  idPrefix?: string
  loadingAttributes: boolean
  modelAttributes: Attribute[]
  operatorOptions: Array<{ value: string; label: string }>
  addFilter: () => void
  addSharing: () => void
  removeFilter: (index: number) => void
  removeSharing: (index: number) => void
  setColumnSearch: (value: string) => void
  setFormData: Dispatch<SetStateAction<ExportProfileFormData>>
  toggleColumn: (column: string) => void
  toggleSelectAllColumns: (checked: boolean) => void
  updateFilter: (index: number, field: string, value: string) => void
  updateSharing: (index: number, field: string, value: string) => void
}

export function ExportProfileFormFields({
  columnSearch,
  dataModels,
  formData,
  idPrefix = '',
  loadingAttributes,
  modelAttributes,
  operatorOptions,
  addFilter,
  addSharing,
  removeFilter,
  removeSharing,
  setColumnSearch,
  setFormData,
  toggleColumn,
  toggleSelectAllColumns,
  updateFilter,
  updateSharing,
}: ExportProfileFormFieldsProps) {
  const fieldId = (id: string) => `${idPrefix}${id}`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={fieldId('name')}>Profile Name</Label>
          <Input
            id={fieldId('name')}
            value={formData.name}
            onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Enter profile name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('dataModel')}>Data Model</Label>
          <Select value={formData.dataModel} onValueChange={(value) => setFormData((previous) => ({ ...previous, dataModel: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select data model" />
            </SelectTrigger>
            <SelectContent>
              {dataModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
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
          onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
          placeholder="Enter profile description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Format</Label>
          <RadioGroup value={formData.format} onValueChange={(value) => setFormData((previous) => ({ ...previous, format: value }))}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="xlsx" id={fieldId('xlsx')} />
              <Label htmlFor={fieldId('xlsx')}>Excel (.xlsx)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id={fieldId('csv')} />
              <Label htmlFor={fieldId('csv')}>CSV (.csv)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId('isPublic')}
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, isPublic: !!checked }))}
            />
            <Label htmlFor={fieldId('isPublic')}>Make this profile public</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <Label>Columns</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search column..."
                value={columnSearch}
                onChange={(event) => setColumnSearch(event.target.value)}
                className="h-8 w-56"
              />
              <Checkbox
                id={fieldId('selectAllColumns')}
                checked={modelAttributes.length > 0 && formData.columns.length === modelAttributes.length}
                onCheckedChange={(checked) => toggleSelectAllColumns(!!checked)}
              />
              <Label htmlFor={fieldId('selectAllColumns')} className="text-sm">Select All</Label>
            </div>
          </div>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {loadingAttributes ? (
              <div className="text-sm text-muted-foreground">Loading attributes...</div>
            ) : modelAttributes.length === 0 ? (
              <div className="text-sm text-muted-foreground">Select a data model to load columns.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {modelAttributes
                  .filter((attribute) => {
                    const query = columnSearch.trim().toLowerCase()
                    if (!query) return true
                    const name = (attribute.display_name || attribute.name || '').toLowerCase()
                    return name.includes(query)
                  })
                  .map((attribute) => (
                    <div key={attribute.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={fieldId(attribute.id)}
                        checked={formData.columns.includes(attribute.name)}
                        onCheckedChange={() => toggleColumn(attribute.name)}
                      />
                      <Label htmlFor={fieldId(attribute.id)} className="text-sm">
                        {attribute.display_name || attribute.name}
                      </Label>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Filters</Label>
          <div className="space-y-2">
            {formData.filters.map((filter, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <Select value={filter.attribute} onValueChange={(value) => updateFilter(index, 'attribute', value)}>
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelAttributes.map((attribute) => (
                      <SelectItem key={attribute.id} value={attribute.name}>
                        {attribute.display_name || attribute.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filter.operator} onValueChange={(value) => updateFilter(index, 'operator', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-4"
                  placeholder="Value"
                  value={filter.value}
                  onChange={(event) => updateFilter(index, 'value', event.target.value)}
                />
                <Button variant="ghost" size="sm" onClick={() => removeFilter(index)} className="col-span-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFilter}>
              Add Filter
            </Button>
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
                    onChange={(event) => updateSharing(index, 'targetGroup', event.target.value)}
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
      </div>
    </div>
  )
}
