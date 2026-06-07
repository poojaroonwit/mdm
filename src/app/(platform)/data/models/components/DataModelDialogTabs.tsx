'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, MoreVertical, Plus, Trash2 } from 'lucide-react'

type ModelForm = {
  name: string
  display_name: string
  description: string
  source_type: string
  slug: string
  folder_id: string
}

type Attribute = {
  id: string
  data_model_id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
  options?: any[]
  created_at: string
  updated_at: string
}

interface DataModelDetailsTabProps {
  folders: any[]
  form: ModelForm
  selectedSpaceIds: string[]
  spaces: any[]
  spacesError: string | null
  spacesLoading: boolean
  slugEdited: boolean
  setForm: (form: ModelForm) => void
  setSelectedSpaceIds: (spaceIds: string[]) => void
  setSlugEdited: (edited: boolean) => void
}

interface DataModelAttributesTabProps {
  attributes: Attribute[]
  attributesLoading: boolean
  onCreateAttribute: () => void
  onDeleteAttribute: (attributeId: string) => void
  onOpenAttribute: (attribute: Attribute) => void
}

interface DataModelOptionsTabProps {
  attributes: Attribute[]
}

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')

export function DataModelDetailsTab({
  folders,
  form,
  selectedSpaceIds,
  spaces,
  spacesError,
  spacesLoading,
  slugEdited,
  setForm,
  setSelectedSpaceIds,
  setSlugEdited
}: DataModelDetailsTabProps) {
  return (
    <TabsContent value="model" className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <p className="text-xs text-muted-foreground">The internal name used for the data model. This will be used in API calls and database references.</p>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value
                    setForm({ ...form, name, slug: !slugEdited ? toSlug(name) : form.slug })
                  }}
                  placeholder="Enter model name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <p className="text-xs text-muted-foreground">The human-readable name that will be shown in the interface.</p>
                <Input
                  value={form.display_name}
                  onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                  placeholder="Enter display name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-generated from the name but can be customized.</p>
            <Input
              value={form.slug}
              onChange={(event) => {
                setForm({ ...form, slug: event.target.value.toLowerCase() })
                setSlugEdited(true)
              }}
              placeholder="auto-generated-from-name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <p className="text-xs text-muted-foreground">Optional description explaining the purpose and usage of this data model.</p>
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Type</label>
              <p className="text-xs text-muted-foreground">Choose whether this model uses internal data or connects to an external database.</p>
              <Select value={form.source_type} onValueChange={(value) => setForm({ ...form, source_type: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">In-app database</SelectItem>
                  <SelectItem value="EXTERNAL">External datasource</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Associated Spaces</label>
              <p className="text-xs text-muted-foreground">Select which spaces this data model will be available in.</p>
              {spacesLoading ? (
                <div className="text-sm text-muted-foreground">Loading spaces...</div>
              ) : spacesError ? (
                <div className="text-sm text-red-500">{spacesError}</div>
              ) : (
                <MultiSelect
                  options={spaces.map(space => ({ value: space.id, label: space.name }))}
                  selected={selectedSpaceIds}
                  onChange={setSelectedSpaceIds}
                  placeholder="Select spaces..."
                  className="w-full"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Folder</label>
              <p className="text-xs text-muted-foreground">Organize this model within the currently active space.</p>
              <Select
                value={form.folder_id || '__root__'}
                onValueChange={(value) => setForm({ ...form, folder_id: value === '__root__' ? '' : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">No folder</SelectItem>
                  {folders.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}

export function DataModelAttributesTab({
  attributes,
  attributesLoading,
  onCreateAttribute,
  onDeleteAttribute,
  onOpenAttribute
}: DataModelAttributesTabProps) {
  return (
    <TabsContent value="attributes" className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Model Attributes</h3>
          <Button size="sm" onClick={onCreateAttribute}>
            <Plus className="h-4 w-4 mr-2" />
            Add Attribute
          </Button>
        </div>

        {attributesLoading ? (
          <div className="text-center py-4">Loading attributes...</div>
        ) : (
          <div className="h-[500px] overflow-y-auto border border-border rounded-lg bg-background">
            <div className="space-y-2 p-4">
              {attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="group flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-background shadow-lg"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onOpenAttribute(attribute)
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">{attribute.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {attribute.name} - {attribute.is_required ? 'Required' : 'Optional'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenAttribute(attribute)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-xs">Edit</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted" onClick={(event) => event.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(event) => {
                          event.stopPropagation()
                          onOpenAttribute(attribute)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Attribute
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteAttribute(attribute.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Attribute
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {attributes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No attributes found for this model.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  )
}

export function DataModelOptionsTab({ attributes }: DataModelOptionsTabProps) {
  const selectableAttributes = attributes.filter(attribute => attribute.type === 'SELECT' || attribute.type === 'MULTI_SELECT')

  return (
    <TabsContent value="options" className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Attribute Options</h3>
        <p className="text-sm text-muted-foreground">
          Manage options for select-type attributes. Select an attribute from the Attributes tab to configure its options.
        </p>

        {selectableAttributes.length > 0 ? (
          <div className="space-y-4">
            {selectableAttributes.map((attribute) => (
              <div key={attribute.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{attribute.display_name}</h4>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Type: {attribute.type} - Options: {attribute.options?.length || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No select-type attributes found. Add SELECT or MULTI_SELECT attributes in the Attributes tab.
          </div>
        )}
      </div>
    </TabsContent>
  )
}
