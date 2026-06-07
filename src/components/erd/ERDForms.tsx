import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Attribute, DataModel, Relationship } from './erdTypes'

interface AttributeFormProps {
  model: DataModel | null
  attribute: Attribute | null
  onSave: (attribute: Attribute) => void
  onCancel: () => void
}

export function AttributeForm({ model, attribute, onSave, onCancel }: AttributeFormProps) {
  const [form, setForm] = useState({
    name: attribute?.name || '',
    display_name: attribute?.display_name || '',
    type: attribute?.type || 'TEXT',
    is_required: attribute?.is_required || false,
    is_unique: attribute?.is_unique || false,
    is_primary_key: attribute?.is_primary_key || false,
    is_foreign_key: attribute?.is_foreign_key || false,
    referenced_table: attribute?.referenced_table || '',
    referenced_column: attribute?.referenced_column || ''
  })

  const handleSave = () => {
    const updatedAttribute: Attribute = {
      id: attribute?.id || '',
      ...form,
      type: form.type.toUpperCase()
    }
    onSave(updatedAttribute)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., customer_id"
        />
      </div>

      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="e.g., Customer ID"
        />
      </div>

      <div>
        <Label htmlFor="type">Data Type</Label>
        <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="NUMBER">Number</SelectItem>
            <SelectItem value="BOOLEAN">Boolean</SelectItem>
            <SelectItem value="DATE">Date</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="SELECT">Select</SelectItem>
            <SelectItem value="JSON">JSON</SelectItem>
            <SelectItem value="USER">User (Single)</SelectItem>
            <SelectItem value="USER_MULTI">User (Multi-Select)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_required"
            checked={form.is_required}
            onCheckedChange={(checked) => setForm({ ...form, is_required: checked })}
          />
          <Label htmlFor="is_required">Required</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_unique"
            checked={form.is_unique}
            onCheckedChange={(checked) => setForm({ ...form, is_unique: checked })}
          />
          <Label htmlFor="is_unique">Unique</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_primary_key"
            checked={form.is_primary_key}
            onCheckedChange={(checked) => setForm({ ...form, is_primary_key: checked })}
          />
          <Label htmlFor="is_primary_key">Primary Key</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_foreign_key"
            checked={form.is_foreign_key}
            onCheckedChange={(checked) => setForm({ ...form, is_foreign_key: checked })}
          />
          <Label htmlFor="is_foreign_key">Foreign Key</Label>
        </div>
      </div>

      {form.is_foreign_key && (
        <div className="space-y-2">
          <div>
            <Label htmlFor="referenced_table">Referenced Table</Label>
            <Input
              id="referenced_table"
              value={form.referenced_table}
              onChange={(e) => setForm({ ...form, referenced_table: e.target.value })}
              placeholder="e.g., customers"
            />
          </div>
          <div>
            <Label htmlFor="referenced_column">Referenced Column</Label>
            <Input
              id="referenced_column"
              value={form.referenced_column}
              onChange={(e) => setForm({ ...form, referenced_column: e.target.value })}
              placeholder="e.g., id"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  )
}

interface RelationshipFormProps {
  relationship: Relationship | null
  models: DataModel[]
  onSave: (relationship: Relationship) => void
  onCancel: () => void
}

export function RelationshipForm({ relationship, models, onSave, onCancel }: RelationshipFormProps) {
  const [form, setForm] = useState({
    type: relationship?.type || 'one-to-many',
    label: relationship?.label || ''
  })

  const handleSave = () => {
    if (relationship) {
      onSave({ ...relationship, ...form })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="type">Relationship Type</Label>
        <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-to-one">One to One</SelectItem>
            <SelectItem value="one-to-many">One to Many</SelectItem>
            <SelectItem value="many-to-many">Many to Many</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="label">Label (Optional)</Label>
        <Input
          id="label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="e.g., belongs to, has many"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
