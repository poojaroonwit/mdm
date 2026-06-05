'use client'

import { useFormState } from '@/hooks/common/useFormState'
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

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'user'
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface IntakeFormProps {
  formFields: FormField[]
  onSubmit: (data: Record<string, any>) => void
  onCancel?: () => void
}

export function IntakeForm({ formFields, onSubmit, onCancel }: IntakeFormProps) {
  // Initialize form with empty values for all fields
  const initialValues = formFields.reduce((acc, field) => {
    acc[field.name] = field.type === 'checkbox' ? false : ''
    return acc
  }, {} as Record<string, any>)

  const {
    values: formData,
    errors,
    handleChange,
    handleSubmit: handleFormSubmit,
  } = useFormState({
    initialValues,
    validate: (values) => {
      const validationErrors: Record<string, string | null> = {}
      formFields.forEach((field) => {
        if (field.required && !values[field.name]) {
          validationErrors[field.name] = `${field.label} is required`
        }
      })
      return validationErrors
    },
    onSubmit: async (values) => {
      onSubmit(values)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    handleFormSubmit(e)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Request</CardTitle>
        <CardDescription>Fill out the form below to submit your request</CardDescription>
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
                  onChange={(e) => handleChange(field.name)(e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name)(e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'select' && (
                selectOptions.length > 0 ? (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={handleChange(field.name)}
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
                    onChange={(e) => handleChange(field.name)(e.target.value)}
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
                  onChange={(e) => handleChange(field.name)(parseFloat(e.target.value))}
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
                  onChange={(e) => handleChange(field.name)(e.target.value)}
                  className="mt-1"
                  required={field.required}
                />
              )}
              {field.type === 'checkbox' && (
                <div className="mt-2 flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={formData[field.name] || false}
                    onCheckedChange={handleChange(field.name)}
                  />
                  <Label htmlFor={field.name} className="font-normal">
                    {field.placeholder}
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
            <Button type="submit" className="flex-1">
              Submit Request
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

