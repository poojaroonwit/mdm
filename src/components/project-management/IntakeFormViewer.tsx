'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { showError, showSuccess } from '@/lib/toast-utils'
import { Loader2 } from 'lucide-react'

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'user' | 'email' | 'url' | 'file'
  required?: boolean
  options?: string[]
  placeholder?: string
  validation?: Record<string, any>
}

interface IntakeFormViewerProps {
  formId: string
  onSubmit?: (submission: any) => void
  onCancel?: () => void
}

export function IntakeFormViewer({ formId, onSubmit, onCancel }: IntakeFormViewerProps) {
  const [form, setForm] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadForm()
  }, [formId])

  const loadForm = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/intake-forms/${formId}`)
      if (response.ok) {
        const data = await response.json()
        setForm(data.form)
      } else {
        showError('Failed to load form')
      }
    } catch (error) {
      console.error('Error loading form:', error)
      showError('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const newErrors: Record<string, string> = {}
    const formFields = (form?.formFields || []) as FormField[]
    formFields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/intake-forms/${formId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      const result = await response.json()
      if (response.ok) {
        showSuccess('Your submission has been received')
        onSubmit?.(result.submission)
        // Reset form
        setFormData({})
        setErrors({})
      } else {
        showError(result.error || 'Failed to submit form')
      }
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!form || !form.isActive) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">This form is not available.</p>
        </CardContent>
      </Card>
    )
  }

  const formFields = (form.formFields || []) as FormField[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.name}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => {
            const selectOptions = (field.options || []).filter((option) => option.trim())

            return (
              <div key={field.id}>
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'text' && (
                <Input
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'email' && (
                <Input
                  id={field.name}
                  type="email"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'url' && (
                <Input
                  id={field.name}
                  type="url"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'select' && (
                selectOptions.length > 0 ? (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder || 'Enter value'}
                    className="mt-1"
                    required={field.required}
                  />
                )
              )}
              {field.type === 'number' && (
                <Input
                  id={field.name}
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || '')}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'date' && (
                <Input
                  id={field.name}
                  type="date"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'checkbox' && (
                <div className="mt-2 flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={formData[field.name] || false}
                    onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                  />
                  <Label htmlFor={field.name} className="font-normal">
                    {field.placeholder || field.label}
                  </Label>
                </div>
              )}
              {errors[field.name] && (
                <p className="text-sm text-red-500 mt-1">{errors[field.name]}</p>
              )}
              </div>
            )
          })}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

