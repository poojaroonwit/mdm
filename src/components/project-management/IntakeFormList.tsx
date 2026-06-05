'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'
import { IntakeFormBuilder } from './IntakeFormBuilder'
import { IntakeForm } from './IntakeForm'
import { format } from 'date-fns'

interface IntakeForm {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    submissions: number
  }
}

interface IntakeFormListProps {
  spaceId: string
  onFormSelect?: (formId: string) => void
}

export function IntakeFormList({ spaceId, onFormSelect }: IntakeFormListProps) {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null)
  const [editingFormId, setEditingFormId] = useState<string | undefined>(undefined)
  const [viewingForm, setViewingForm] = useState<any>(null)

  useEffect(() => {
    loadForms()
  }, [spaceId])

  const loadForms = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/intake-forms?spaceId=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setForms(data.forms || [])
      }
    } catch (error) {
      console.error('Error loading forms:', error)
      showError('Failed to load intake forms')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingFormId(undefined)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (form: IntakeForm) => {
    setEditingFormId(form.id)
    setSelectedForm(form)
    setIsEditModalOpen(true)
  }

  const handleView = async (form: IntakeForm) => {
    try {
      const response = await fetch(`/api/intake-forms/${form.id}`)
      if (response.ok) {
        const data = await response.json()
        setViewingForm(data.form)
        setIsViewModalOpen(true)
      }
    } catch (error) {
      showError('Failed to load form')
    }
  }

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/intake-forms/${formId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        showSuccess('Form deleted successfully')
        loadForms()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete form')
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete form')
    }
  }

  const handleFormSaved = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    loadForms()
  }

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (!viewingForm) return

    try {
      const response = await fetch(`/api/intake-forms/${viewingForm.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })

      if (response.ok) {
        showSuccess('Form submitted successfully')
        setIsViewModalOpen(false)
        loadForms()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }
    } catch (error: any) {
      showError(error.message || 'Failed to submit form')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Intake Forms</h2>
          <p className="text-muted-foreground">
            Create and manage forms for ticket intake
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No intake forms created yet</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    {form.description && (
                      <CardDescription className="mt-1">{form.description}</CardDescription>
                    )}
                  </div>
                  <StatusBadge status={form.isActive ? 'active' : 'inactive'}>
                    {form.isActive ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {form.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{form._count?.submissions || 0}</span> submissions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {format(new Date(form.updatedAt), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(form)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(form)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Intake Form</DialogTitle>
          </DialogHeader>
          <IntakeFormBuilder
            spaceId={spaceId}
            onSave={handleFormSaved}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Intake Form</DialogTitle>
          </DialogHeader>
          {editingFormId && (
            <IntakeFormBuilder
              formId={editingFormId}
              spaceId={spaceId}
              onSave={handleFormSaved}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View/Submit Form Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingForm?.name}</DialogTitle>
          </DialogHeader>
          {viewingForm && (
            <IntakeForm
              formFields={viewingForm.formFields || []}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsViewModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
