'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { TabsContent } from '@/components/ui/tabs'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Edit, EyeOff, MoreVertical, Plus, Save, Settings, Trash2, X } from 'lucide-react'

interface AttributeOptionsTabProps {
  attribute: any
  showNewOption: boolean
  newOption: { value: string; label: string; color: string }
  setNewOption: (option: { value: string; label: string; color: string }) => void
  editingOption: number | null
  editingOptionData: { value: string; label: string; color: string }
  setEditingOptionData: (option: { value: string; label: string; color: string }) => void
  handleAddNewOption: () => void
  handleSaveNewOption: () => void
  handleCancelNewOption: () => void
  handleEditOption: (index: number, option: any) => void
  handleSaveOption: (index: number) => void
  handleCancelEditOption: () => void
  handleRemoveOption: (index: number) => void
  onSave: (attribute: any) => void
}

export function AttributeOptionsTab({
  attribute,
  showNewOption,
  newOption,
  setNewOption,
  editingOption,
  editingOptionData,
  setEditingOptionData,
  handleAddNewOption,
  handleSaveNewOption,
  handleCancelNewOption,
  handleEditOption,
  handleSaveOption,
  handleCancelEditOption,
  handleRemoveOption,
  onSave,
}: AttributeOptionsTabProps) {
  return (          <TabsContent value="options" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Attribute Options</CardTitle>
                      <CardDescription>
                        Available options for this attribute
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddNewOption}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Attribute Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(attribute as any).options && (attribute as any).options.length > 0 && (attribute as any).options.map((option: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        {/* Color Swatch */}
                        <div className="flex items-center gap-2">
                          <ColorInput
                            value={editingOption === index ? editingOptionData.color : option.color || '#1e40af'}
                            onChange={(color) => {
                              if (editingOption === index) {
                                setEditingOptionData({ ...editingOptionData, color })
                              } else {
                                // Update the option directly
                                const updatedOptions = [...((attribute as any).options || [])]
                                updatedOptions[index] = { ...updatedOptions[index], color }
                                onSave({ ...attribute, options: updatedOptions } as any)
                              }
                            }}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1e40af"
                            inputClassName="h-8 text-xs pl-7"
                          />
                        </div>

                        {/* Attribute Code */}
                        <div className="flex-1 min-w-0">
                          {editingOption === index ? (
                            <Input
                              value={editingOptionData.value}
                              onChange={(e) => setEditingOptionData({ ...editingOptionData, value: e.target.value })}
                              placeholder="Option value"
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm font-mono text-muted-foreground">{option.value}</div>
                          )}
                        </div>

                        {/* Attribute Label */}
                        <div className="flex-1 min-w-0">
                          {editingOption === index ? (
                            <Input
                              value={editingOptionData.label}
                              onChange={(e) => setEditingOptionData({ ...editingOptionData, label: e.target.value })}
                              placeholder="Option label"
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm font-medium">{option.label}</div>
                          )}
                        </div>

                        {/* Edit/Save Button */}
                        <div className="flex items-center gap-1">
                          {editingOption === index ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSaveOption(index)}
                                disabled={!editingOptionData.label || !editingOptionData.value}
                                className="h-8"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditOption}
                                className="h-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOption(index, option)}
                              className="h-8"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* 3-dot Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveOption(index)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Attribute Option
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}

                    {showNewOption && (
                      <div className="flex items-center gap-3 p-3 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {/* Color Swatch */}
                        <div className="flex items-center gap-2">
                          <ColorInput
                            value={newOption.color}
                            onChange={(color) => setNewOption({ ...newOption, color })}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1e40af"
                            inputClassName="h-8 text-xs pl-7"
                          />
                        </div>

                        {/* Attribute Code */}
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Option value"
                            value={newOption.value}
                            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                            className="h-8"
                          />
                        </div>

                        {/* Attribute Label */}
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Option label"
                            value={newOption.label}
                            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                            className="h-8"
                          />
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveNewOption}
                            disabled={!newOption.label || !newOption.value}
                            className="h-8"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNewOption}
                            className="h-8"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {(!(attribute as any).options || (attribute as any).options.length === 0) && !showNewOption && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-medium">No options yet</p>
                        <p className="text-sm">Add options for this {attribute.type} field</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
  )
}

