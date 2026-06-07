import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Report, ReportCategory, ReportFolder } from '@/types/reports'
import { ReportPermissionsDialog } from './ReportPermissionsDialog'

interface ReportTreeForm {
  name: string
  description: string
  parent_id: string
}

interface ReportsTreeDialogsProps {
  categoryDialog: any
  categoryForm: ReportTreeForm
  deleteCategory: ReportCategory | null
  deleteFolder: ReportFolder | null
  editingCategory: ReportCategory | null
  editingFolder: ReportFolder | null
  folderDialog: any
  folderForm: ReportTreeForm
  permReportId: string | null
  reports: Report[]
  confirmDeleteCategory: () => void
  confirmDeleteFolder: () => void
  handleCreateCategory: () => void
  handleCreateFolder: () => void
  handleUpdateCategory: () => void
  handleUpdateFolder: () => void
  onRefresh?: () => void
  setCategoryForm: Dispatch<SetStateAction<ReportTreeForm>>
  setDeleteCategory: (category: ReportCategory | null) => void
  setDeleteFolder: (folder: ReportFolder | null) => void
  setEditingCategory: (category: ReportCategory | null) => void
  setEditingFolder: (folder: ReportFolder | null) => void
  setFolderForm: Dispatch<SetStateAction<ReportTreeForm>>
  setPermReportId: (reportId: string | null) => void
}

export function ReportsTreeDialogs({
  categoryDialog,
  categoryForm,
  deleteCategory,
  deleteFolder,
  editingCategory,
  editingFolder,
  folderDialog,
  folderForm,
  permReportId,
  reports,
  confirmDeleteCategory,
  confirmDeleteFolder,
  handleCreateCategory,
  handleCreateFolder,
  handleUpdateCategory,
  handleUpdateFolder,
  onRefresh,
  setCategoryForm,
  setDeleteCategory,
  setDeleteFolder,
  setEditingCategory,
  setEditingFolder,
  setFolderForm,
  setPermReportId
}: ReportsTreeDialogsProps) {
  return (
    <>
      <Dialog open={categoryDialog.isOpen} onOpenChange={(open) => open ? categoryDialog.open() : categoryDialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category information'
                : 'Create a new category to organize your reports'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                placeholder="Category description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              categoryDialog.close()
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '', parent_id: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={folderDialog.isOpen} onOpenChange={(open) => open ? folderDialog.open() : folderDialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Edit Folder' : 'Create Folder'}
            </DialogTitle>
            <DialogDescription>
              {editingFolder
                ? 'Update the folder information'
                : 'Create a new folder to organize your reports'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Name *</Label>
              <Input
                id="folder-name"
                value={folderForm.name}
                onChange={(event) => setFolderForm({ ...folderForm, name: event.target.value })}
                placeholder="Folder name"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">Description</Label>
              <Input
                id="folder-description"
                value={folderForm.description}
                onChange={(event) => setFolderForm({ ...folderForm, description: event.target.value })}
                placeholder="Folder description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              folderDialog.close()
              setEditingFolder(null)
              setFolderForm({ name: '', description: '', parent_id: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}>
              {editingFolder ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This action cannot be undone.
              {deleteCategory && reports.filter((report) => report.category_id === deleteCategory.id).length > 0 && (
                <span className="block mt-2 text-orange-600">
                  Warning: This category contains {reports.filter((report) => report.category_id === deleteCategory.id).length} report(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteFolder} onOpenChange={(open) => !open && setDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFolder?.name}"? This action cannot be undone.
              {deleteFolder && reports.filter((report) => report.folder_id === deleteFolder.id).length > 0 && (
                <span className="block mt-2 text-orange-600">
                  Warning: This folder contains {reports.filter((report) => report.folder_id === deleteFolder.id).length} report(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportPermissionsDialog
        reportId={permReportId || ''}
        open={!!permReportId}
        onOpenChange={(open) => !open && setPermReportId(null)}
        onSuccess={onRefresh}
      />
    </>
  )
}
