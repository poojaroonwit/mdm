/**
 * Comprehensive Attribute Management Service
 * Handles all CRUD operations, validation, and common attribute management needs
 */

import { Attribute as PrismaAttribute } from '@prisma/client'

export interface Attribute extends Omit<PrismaAttribute, 'validationRules' | 'options' | 'description'> {
  data_model_id: string
  display_name: string
  is_required: boolean
  description?: string | null
  is_unique: boolean
  is_primary_key?: boolean
  is_foreign_key?: boolean
  order: number
  default_value?: string
  validation_rules?: any
  options?: Array<{ value: string; label: string; color?: string; order: number }>
  created_at: string
  updated_at: string
}

export interface AttributeFormData {
  name: string
  display_name: string
  type: string
  description?: string
  is_required: boolean
  is_unique: boolean
  is_primary_key?: boolean
  is_foreign_key?: boolean
  default_value?: string
  validation_rules?: any
  options?: Array<{ value: string; label: string; color?: string; order: number }>
}

export interface AttributeManagementOptions {
  modelId: string
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export class AttributeManagementService {
  private modelId: string
  private onSuccess?: (message: string) => void
  private onError?: (error: string) => void

  constructor(options: AttributeManagementOptions) {
    this.modelId = options.modelId
    this.onSuccess = options.onSuccess
    this.onError = options.onError
  }

  /**
   * Load all attributes for a model
   */
  async loadAttributes(): Promise<Attribute[]> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes`)
      if (!response.ok) {
        throw new Error(`Failed to load attributes: ${response.status}`)
      }
      const data = await response.json()
      return data.attributes || []
    } catch (error) {
      this.handleError('Failed to load attributes', error)
      return []
    }
  }

  /**
   * Create a new attribute
   */
  async createAttribute(attributeData: AttributeFormData): Promise<Attribute | null> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeData)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create attribute')
      }

      const data = await response.json()
      this.handleSuccess('Attribute created successfully')
      return data.attribute
    } catch (error) {
      this.handleError('Failed to create attribute', error)
      return null
    }
  }

  /**
   * Update an existing attribute
   */
  async updateAttribute(attributeId: string, attributeData: Partial<AttributeFormData>): Promise<Attribute | null> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes/${attributeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeData)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to update attribute')
      }

      const data = await response.json()
      this.handleSuccess('Attribute updated successfully')
      return data.attribute
    } catch (error) {
      this.handleError('Failed to update attribute', error)
      return null
    }
  }

  /**
   * Delete an attribute
   */
  async deleteAttribute(attributeId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes/${attributeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to delete attribute')
      }

      this.handleSuccess('Attribute deleted successfully')
      return true
    } catch (error) {
      this.handleError('Failed to delete attribute', error)
      return false
    }
  }

  /**
   * Reorder attributes
   */
  async reorderAttributes(attributeOrders: Array<{ id: string; order: number }>): Promise<boolean> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attribute_orders: attributeOrders })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to reorder attributes')
      }

      this.handleSuccess('Attribute order updated successfully')
      return true
    } catch (error) {
      this.handleError('Failed to reorder attributes', error)
      return false
    }
  }

  /**
   * Duplicate an attribute
   */
  async duplicateAttribute(attributeId: string, newName?: string): Promise<Attribute | null> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes/${attributeId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to duplicate attribute')
      }

      const data = await response.json()
      this.handleSuccess('Attribute duplicated successfully')
      return data.attribute
    } catch (error) {
      this.handleError('Failed to duplicate attribute', error)
      return null
    }
  }

  /**
   * Bulk delete attributes
   */
  async bulkDeleteAttributes(attributeIds: string[]): Promise<boolean> {
    try {
      const response = await fetch(`/api/data-models/${this.modelId}/attributes/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attribute_ids: attributeIds })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to delete attributes')
      }

      this.handleSuccess(`${attributeIds.length} attributes deleted successfully`)
      return true
    } catch (error) {
      this.handleError('Failed to delete attributes', error)
      return false
    }
  }

  /**
   * Export attributes to JSON
   */
  async exportAttributes(): Promise<string> {
    try {
      const attributes = await this.loadAttributes()
      const exportData = {
        model_id: this.modelId,
        attributes: attributes.map(attr => ({
          name: attr.name,
          display_name: attr.display_name,
          type: attr.type,
          description: attr.description,
          is_required: attr.is_required,
          is_unique: attr.is_unique,
          default_value: attr.default_value,
          validation_rules: attr.validation_rules,
          options: attr.options
        }))
      }
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      this.handleError('Failed to export attributes', error)
      return ''
    }
  }

  /**
   * Import attributes from JSON
   */
  async importAttributes(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData)
      if (!importData.attributes || !Array.isArray(importData.attributes)) {
        throw new Error('Invalid import data format')
      }

      const results = await Promise.allSettled(
        importData.attributes.map((attr: any) => this.createAttribute(attr))
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        this.handleSuccess(`${successful} attributes imported successfully`)
      }
      if (failed > 0) {
        this.handleError(`${failed} attributes failed to import`)
      }

      return successful > 0
    } catch (error) {
      this.handleError('Failed to import attributes', error)
      return false
    }
  }

  /**
   * Validate attribute data
   */
  validateAttribute(data: AttributeFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push('Name is required')
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
      errors.push('Name must start with a letter and contain only letters, numbers, and underscores')
    }

    if (!data.display_name?.trim()) {
      errors.push('Display name is required')
    }

    if (!data.type?.trim()) {
      errors.push('Type is required')
    }

    // Validate options for select/multiselect types
    if ((data.type === 'select' || data.type === 'multiselect') && (!data.options || data.options.length === 0)) {
      errors.push('Options are required for select/multiselect types')
    }

    // Validate reference fields for data entity types
    if (data.type === 'data_entity' && !data.validation_rules?.reference_model_id) {
      errors.push('Reference model is required for data entity types')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get attribute templates/presets
   */
  getAttributeTemplates(): Record<string, Partial<AttributeFormData>> {
    return {
      'text': {
        type: 'text',
        is_required: false,
        is_unique: false
      },
      'email': {
        type: 'email',
        is_required: true,
        is_unique: true,
        validation_rules: { format: 'email' }
      },
      'phone': {
        type: 'phone',
        is_required: false,
        is_unique: false,
        validation_rules: { format: 'phone' }
      },
      'date': {
        type: 'date',
        is_required: false,
        is_unique: false
      },
      'number': {
        type: 'number',
        is_required: false,
        is_unique: false,
        validation_rules: { min: 0 }
      },
      'select': {
        type: 'select',
        is_required: false,
        is_unique: false,
        options: [
          { value: 'option1', label: 'Option 1', color: '#1e40af', order: 0 },
          { value: 'option2', label: 'Option 2', color: '#10B981', order: 1 }
        ]
      },
      'multiselect': {
        type: 'multiselect',
        is_required: false,
        is_unique: false,
        options: [
          { value: 'tag1', label: 'Tag 1', color: '#F59E0B', order: 0 },
          { value: 'tag2', label: 'Tag 2', color: '#EF4444', order: 1 }
        ]
      }
    }
  }

  private handleSuccess(message: string) {
    if (this.onSuccess) {
      this.onSuccess(message)
    }
  }

  private handleError(message: string, error?: any) {
    const errorMessage = error instanceof Error ? error.message : message
    if (this.onError) {
      this.onError(errorMessage)
    }
  }
}

/**
 * Hook for using attribute management service
 */
export function useAttributeManagement(modelId: string, options?: {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}) {
  return new AttributeManagementService({
    modelId,
    onSuccess: options?.onSuccess,
    onError: options?.onError
  })
}
