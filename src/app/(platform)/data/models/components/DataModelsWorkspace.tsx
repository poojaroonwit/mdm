'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Database, Edit, Folder, FolderOpen, FolderPlus, Plus, Search, Trash2 } from 'lucide-react'

type DataModel = {
  id: string
  name: string
  display_name: string
  slug?: string
  description?: string | null
  folder_id?: string | null
  created_at: string
  is_active: boolean
  data_model_attributes?: any
}

interface DataModelsWorkspaceProps {
  folders: any[]
  models: DataModel[]
  search: string
  selectedFolder: string | null
  onCreateFolder: () => void
  onCreateModel: () => void
  onDeleteModel: (model: DataModel) => void
  onEditModel: (model: DataModel) => void
  onSearchChange: (search: string) => void
  onSelectFolder: (folderId: string | null) => void
}

export function DataModelsWorkspace({
  folders,
  models,
  search,
  selectedFolder,
  onCreateFolder,
  onCreateModel,
  onDeleteModel,
  onEditModel,
  onSearchChange,
  onSelectFolder
}: DataModelsWorkspaceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Folders
            </CardTitle>
            <CardDescription>Organize your data models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onSelectFolder(null)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                All Models
              </Button>
              {folders.length > 0 ? (
                folders.map((folder: any) => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name}
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No folders yet</p>
                  <p className="text-xs">Create folders to organize your models</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Models
                </CardTitle>
                <CardDescription>{selectedFolder ? 'Models in selected folder' : 'All data models'}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onCreateFolder}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
                <Button size="sm" onClick={onCreateModel}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Model
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>{model.display_name}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{model.description}</TableCell>
                    <TableCell>
                      <StatusBadge status={model.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell>{(model as any).data_model_attributes?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEditModel(model)}>
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDeleteModel(model)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!models.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No models found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
