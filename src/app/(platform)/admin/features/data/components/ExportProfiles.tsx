'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Filter,
  X,
  Code,
  LayoutTemplate
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ExportProfile, DataSchema } from '../types'
import { Checkbox } from '@/components/ui/checkbox'

interface ExportProfilesProps {
  schemas: DataSchema[]
  spaceId?: string
  onRunProfile?: (profile: ExportProfile) => void
}

export function ExportProfiles({ schemas, spaceId, onRunProfile }: ExportProfilesProps) {
  const [profiles, setProfiles] = useState<ExportProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ExportProfile | null>(null)

  const [formData, setFormData] = useState<{
    name: string
    description: string
    type: 'STUDIO' | 'QUERY'
    config: {
      source: string
      tableName: string
      database: string
      columns: string[]
      limit?: number
      filters: Array<{
        column: string
        operator: string
        value: any
      }>
      query: string
    }
  }>({
    name: '',
    description: '',
    type: 'STUDIO',
    config: {
      source: 'builtin',
      tableName: '',
      database: 'system',
      columns: [],
      limit: undefined,
      filters: [],
      query: ''
    }
  })

  useEffect(() => {
    if (spaceId) {
        loadProfiles()
    }
  }, [spaceId])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/export-profiles?spaceId=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setProfiles(data)
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
      toast.error('Failed to load export profiles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (profile: ExportProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      type: profile.type,
      config: {
        source: profile.config.source || 'builtin',
        tableName: profile.config.tableName || '',
        database: profile.config.database || 'system',
        columns: profile.config.columns || [],
        limit: profile.config.limit,
        filters: profile.config.filters || [],
        query: profile.config.query || ''
      }
    })
    setShowDialog(true)
  }

  const handleCreate = () => {
    setEditingProfile(null)
    setFormData({
      name: '',
      description: '',
      type: 'STUDIO',
      config: {
        source: 'builtin',
        tableName: '',
        database: 'system',
        columns: [],
        limit: undefined,
        filters: [],
        query: ''
      }
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      const response = await fetch(`/api/admin/export-profiles/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Profile deleted')
        loadProfiles()
      } else {
        toast.error('Failed to delete profile')
      }
    } catch (error) {
       toast.error('Failed to delete profile')
    }
  }

  const handleSave = async () => {
    try {
      const url = editingProfile 
        ? `/api/admin/export-profiles/${editingProfile.id}`
        : '/api/admin/export-profiles'
      
      const method = editingProfile ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          spaceId
        })
      })

      if (response.ok) {
        toast.success(editingProfile ? 'Profile updated' : 'Profile created')
        setShowDialog(false)
        loadProfiles()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to save profile')
      }
    } catch (error) {
      toast.error('Failed to save profile')
    }
  }

  const getSelectedSchema = () => {
    return schemas.find(s => s.table === formData.config.tableName)
  }

  const addFilter = () => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        filters: [
          ...formData.config.filters,
          { column: '', operator: 'equals', value: '' }
        ]
      }
    })
  }

  const updateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...formData.config.filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        filters: newFilters
      }
    })
  }

  const removeFilter = (index: number) => {
    const newFilters = formData.config.filters.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        filters: newFilters
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Profiles</h3>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(profile => (
          <Card key={profile.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium">{profile.name}</CardTitle>
                <div className="flex gap-2">
                   {profile.type === 'STUDIO' ? (
                       <Badge variant="secondary" className="flex items-center gap-1">
                           <LayoutTemplate className="h-3 w-3" /> Studio
                       </Badge>
                   ) : (
                       <Badge variant="outline" className="flex items-center gap-1">
                           <Code className="h-3 w-3" /> Query
                       </Badge>
                   )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {profile.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                <span>
                     {profile.type === 'STUDIO' 
                        ? `${profile.config.tableName || 'No table'}` 
                        : 'Custom SQL'}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onRunProfile && onRunProfile(profile)}>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create Export Profile'}</DialogTitle>
            <DialogDescription>
              Configure your export settings using Studio or SQL Query
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-6 p-6 pt-2 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Profile Name"
                />
              </div>
               <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                   value={formData.description} 
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Optional description"
                />
              </div>
            </div>

            <Tabs value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="STUDIO">Studio Builder</TabsTrigger>
                <TabsTrigger value="QUERY">SQL Query</TabsTrigger>
              </TabsList>

              <TabsContent value="STUDIO" className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Source</Label>
                      <Select 
                        value={formData.config.source} 
                        onValueChange={(v) => setFormData({
                            ...formData, 
                            config: {...formData.config, source: v}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="builtin">Built-in Data Model</SelectItem>
                          {/* <SelectItem value="external">External Database (Coming Soon)</SelectItem> */}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Table</Label>
                      <Select 
                        value={formData.config.tableName} 
                         onValueChange={(v) => {
                             const schema = schemas.find(s => s.table === v)
                             setFormData({
                                ...formData, 
                                config: {
                                    ...formData.config, 
                                    tableName: v,
                                    columns: [] // reset columns
                                }
                            })
                         }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          {schemas.map(s => (
                              <SelectItem key={s.table} value={s.table}>{s.table}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {formData.config.tableName && (
                    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                        <Label className="text-base font-semibold">Columns</Label>
                        <ScrollArea className="h-32 rounded-md border p-2 bg-background">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {getSelectedSchema()?.columns.map(col => (
                                    <div key={col} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`col-${col}`} 
                                            checked={formData.config.columns.includes(col)}
                                            onCheckedChange={(checked) => {
                                                const current = formData.config.columns;
                                                const updated = checked 
                                                    ? [...current, col]
                                                    : current.filter(c => c !== col);
                                                 setFormData({
                                                    ...formData,
                                                    config: {...formData.config, columns: updated}
                                                })
                                            }}
                                        />
                                        <Label htmlFor={`col-${col}`} className="text-sm font-normal cursor-pointer">
                                            {col}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label>Limit (Optional)</Label>
                    <Input 
                        type="number" 
                        value={formData.config.limit || ''} 
                        onChange={(e) => setFormData({
                            ...formData, 
                            config: {...formData.config, limit: e.target.value ? parseInt(e.target.value) : undefined}
                        })}
                        placeholder="e.g. 1000"
                        className="max-w-[200px]"
                    />
                </div>

                <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Filters</Label>
                        <Button variant="outline" size="sm" onClick={addFilter} disabled={!formData.config.tableName}>
                            <Plus className="h-4 w-4 mr-2" /> Add Filter
                        </Button>
                     </div>
                     
                     <div className="space-y-2">
                        {formData.config.filters.map((filter, index) => (
                            <div key={index} className="flex gap-2 items-center bg-muted/30 p-2 rounded-md">
                                <Select 
                                    value={filter.column} 
                                    onValueChange={(v) => updateFilter(index, 'column', v)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getSelectedSchema()?.columns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={filter.operator} 
                                    onValueChange={(v) => updateFilter(index, 'operator', v)}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="gt">Greater Than</SelectItem>
                                        <SelectItem value="lt">Less Than</SelectItem>
                                        <SelectItem value="is_empty">Is Empty</SelectItem>
                                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                    </SelectContent>
                                </Select>

                                {filter.operator !== 'is_empty' && filter.operator !== 'is_not_empty' && (
                                     <Input 
                                        className="flex-1"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                        placeholder="Value"
                                     />
                                )}

                                <Button variant="ghost" size="icon" onClick={() => removeFilter(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {formData.config.filters.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                No filters applied
                            </div>
                        )}
                     </div>
                </div>

              </TabsContent>

              <TabsContent value="QUERY" className="space-y-4 pt-4">
                 <div className="space-y-2">
                    <Label>SQL Query</Label>
                    <Textarea 
                        className="font-mono min-h-[300px]" 
                        placeholder="SELECT * FROM users WHERE active = true;"
                        value={formData.config.query}
                        onChange={(e) => setFormData({
                            ...formData, 
                            config: {...formData.config, query: e.target.value}
                        })}
                    />
                    <p className="text-xs text-muted-foreground">
                        Write a standard SQL query. Only SELECT statements are allowed.
                    </p>
                 </div>
              </TabsContent>
            </Tabs>
          </DialogBody>

          <DialogFooter>
             <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
             <Button onClick={handleSave} disabled={!formData.name}>Save Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
