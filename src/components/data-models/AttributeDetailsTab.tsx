'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface AttributeDetailsTabProps {
  attribute: any
  isEditing: boolean
  editForm: any
  setEditForm: (form: any) => void
  incrementConfig: any
  setIncrementConfig: (config: any) => void
}

export function AttributeDetailsTab({
  attribute,
  isEditing,
  editForm,
  setEditForm,
  incrementConfig,
  setIncrementConfig,
}: AttributeDetailsTabProps) {
  return (          <TabsContent value="details" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Configure the basic properties of this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="attribute_name"
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md font-mono text-sm">
                          {attribute.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="display_name"
                          value={editForm.display_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          placeholder="Display Name"
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md">
                          {attribute.display_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    {isEditing ? (
                      <Select
                        value={editForm.type || ''}
                        onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="datetime">DateTime</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="multiselect">Multi-Select</SelectItem>
                          <SelectItem value="attachment">Attachment</SelectItem>
                          <SelectItem value="user">User (Single)</SelectItem>
                          <SelectItem value="user_multi">User (Multi-Select)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-muted rounded-md">
                        <Badge variant="secondary">{attribute.type}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Describe this attribute..."
                        rows={3}
                      />
                    ) : (
                      <div className="p-2 bg-muted rounded-md min-h-[60px]">
                        {attribute.description || 'No description provided'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Validation Rules</CardTitle>
                  <CardDescription>
                    Configure validation and constraints for this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Required</Label>
                      <p className="text-sm text-muted-foreground">
                        This attribute must have a value
                      </p>
                    </div>
                    {isEditing ? (
                      <Switch
                        checked={editForm.is_required || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_required: checked })}
                      />
                    ) : (
                      <StatusBadge status={attribute.is_required ? 'required' : 'optional'} label={attribute.is_required ? 'Required' : 'Optional'} />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Unique</Label>
                      <p className="text-sm text-muted-foreground">
                        Values must be unique across all records
                      </p>
                    </div>
                    {isEditing ? (
                      <Switch
                        checked={editForm.is_unique || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_unique: checked })}
                      />
                    ) : (
                      <StatusBadge status={attribute.is_unique ? 'unique' : 'not-unique'} label={attribute.is_unique ? 'Unique' : 'Not Unique'} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_value">Default Value</Label>
                    {isEditing ? (
                      <Input
                        id="default_value"
                        value={editForm.default_value || ''}
                        onChange={(e) => setEditForm({ ...editForm, default_value: e.target.value })}
                        placeholder="Default value (optional)"
                      />
                    ) : (
                      <div className="p-2 bg-muted rounded-md">
                        {attribute.default_value || 'No default value'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {attribute.type === 'number' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Increment Configuration</CardTitle>
                    <CardDescription>
                      Configure automatic number generation for this attribute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Auto-Increment</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically generate sequential numbers for new records
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={incrementConfig.enabled}
                          onCheckedChange={(checked) => setIncrementConfig({ ...incrementConfig, enabled: checked })}
                        />
                      ) : (
                        <StatusBadge status={incrementConfig.enabled ? 'enabled' : 'disabled'} />
                      )}
                    </div>

                    {incrementConfig.enabled && (
                      <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="prefix">Prefix</Label>
                            {isEditing ? (
                              <Input
                                id="prefix"
                                value={incrementConfig.prefix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, prefix: e.target.value })}
                                placeholder="e.g., ID-"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.prefix || 'No prefix'}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="suffix">Suffix</Label>
                            {isEditing ? (
                              <Input
                                id="suffix"
                                value={incrementConfig.suffix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, suffix: e.target.value })}
                                placeholder="e.g., -2024"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.suffix || 'No suffix'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_value">Start Value</Label>
                            {isEditing ? (
                              <Input
                                id="start_value"
                                type="number"
                                value={incrementConfig.startValue}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, startValue: parseInt(e.target.value) || 1 })}
                                min="1"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.startValue}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="step">Step</Label>
                            {isEditing ? (
                              <Input
                                id="step"
                                type="number"
                                value={incrementConfig.step}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, step: parseInt(e.target.value) || 1 })}
                                min="1"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.step}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">Preview</div>
                          <div className="text-sm text-blue-700">
                            Next value: {incrementConfig.prefix}{incrementConfig.startValue}{incrementConfig.suffix}
                          </div>
                          <div className="text-sm text-blue-700">
                            Following: {incrementConfig.prefix}{incrementConfig.startValue + incrementConfig.step}{incrementConfig.suffix}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
  )
}

