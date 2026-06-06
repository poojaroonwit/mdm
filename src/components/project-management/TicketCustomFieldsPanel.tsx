'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toDateInputValue } from '@/lib/date-formatters'
import { SearchableSelect } from './SearchableSelect'
import type { TicketCustomField } from './ticket-detail-types'
import {
  ATTRIBUTE_INPUT_CLASS,
} from './ticket-detail-helpers'

interface TicketCustomFieldsPanelProps {
  customFields: TicketCustomField[]
  selectedProject: string
  setCustomFields: Dispatch<SetStateAction<TicketCustomField[]>>
}

interface TicketFieldInputProps {
  field: TicketCustomField
  index: number
  setCustomFields: Dispatch<SetStateAction<TicketCustomField[]>>
}

export function TicketCustomFieldInput({
  field,
  index,
  setCustomFields,
}: TicketFieldInputProps) {
  const updateField = (value: string) => {
    setCustomFields((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, value } : item
      )
    )
  }

  if (field.type === 'SELECT') {
    const fieldOptions = field.options || []

    if (fieldOptions.length === 0) {
      return (
        <Input
          value={field.value || ''}
          onChange={(event) => updateField(event.target.value)}
          placeholder="Enter value"
          className={ATTRIBUTE_INPUT_CLASS}
        />
      )
    }

    return (
      <SearchableSelect
        value={field.value || '__none__'}
        onValueChange={(value) => updateField(value === '__none__' ? '' : value)}
        options={[
          { value: '__none__', label: 'None' },
          ...fieldOptions.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ]}
        placeholder="Select value"
        searchPlaceholder={`Search ${field.displayName.toLowerCase()}...`}
        className={ATTRIBUTE_INPUT_CLASS}
      />
    )
  }

  if (field.type === 'DATE') {
    return (
      <Input
        type="date"
        value={toDateInputValue(field.value)}
        onChange={(event) => updateField(event.target.value)}
        className={ATTRIBUTE_INPUT_CLASS}
      />
    )
  }

  if (field.type === 'NUMBER') {
    return (
      <Input
        type="number"
        value={field.value || ''}
        onChange={(event) => updateField(event.target.value)}
        placeholder="Value"
        className={ATTRIBUTE_INPUT_CLASS}
      />
    )
  }

  return (
    <Input
      value={field.value || ''}
      onChange={(event) => updateField(event.target.value)}
      placeholder="Value"
      className={ATTRIBUTE_INPUT_CLASS}
    />
  )
}

export function TicketCustomFieldsPanel({
  customFields,
  selectedProject,
  setCustomFields,
}: TicketCustomFieldsPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <Label>Custom Fields</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          These fields are inherited from the selected project and apply to every ticket in that project.
        </p>
      </div>
      {!selectedProject ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Select a project to load its shared ticket fields.
        </div>
      ) : customFields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          This project has no shared custom fields yet.
        </div>
      ) : (
        <div className="space-y-3">
          {customFields.map((field, index) => (
            <div key={`${field.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
              <div className="space-y-2">
                <Label>{field.displayName}</Label>
                <TicketCustomFieldInput
                  field={field}
                  index={index}
                  setCustomFields={setCustomFields}
                />
              </div>
              <Input value={field.type} disabled className="bg-muted/70" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
