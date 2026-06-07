'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, X } from 'lucide-react'

export type CustomerFilterType = 'text' | 'select' | 'number' | 'date'

type SelectOption = {
  label: string
  value: string
}

interface CustomerAttributeFilterInputProps {
  attribute: any
  value: any
  onColumnFilter: (field: string, value: any) => void
}

interface CustomerColumnFilterProps {
  field: string
  isOpen: boolean
  options: SelectOption[]
  type: CustomerFilterType
  value: any
  onClear: (field: string) => void
  onColumnFilter: (field: string, value: any) => void
  onToggle: (field: string) => void
}

export function CustomerAttributeFilterInput({
  attribute,
  value,
  onColumnFilter
}: CustomerAttributeFilterInputProps) {
  const fieldName = attribute.name || attribute.field_name
  const currentValue = value || '__all__'

  switch (attribute.data_type) {
    case 'number':
    case 'integer':
    case 'float':
      return (
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min"
            value={currentValue?.min || ''}
            onChange={(event) => onColumnFilter(fieldName, { ...currentValue, min: event.target.value })}
          />
          <Input
            type="number"
            placeholder="Max"
            value={currentValue?.max || ''}
            onChange={(event) => onColumnFilter(fieldName, { ...currentValue, max: event.target.value })}
          />
        </div>
      )
    case 'date':
    case 'datetime':
      return (
        <div className="space-y-2">
          <Input
            type="date"
            placeholder="From"
            value={currentValue?.from || ''}
            onChange={(event) => onColumnFilter(fieldName, { ...currentValue, from: event.target.value })}
          />
          <Input
            type="date"
            placeholder="To"
            value={currentValue?.to || ''}
            onChange={(event) => onColumnFilter(fieldName, { ...currentValue, to: event.target.value })}
          />
        </div>
      )
    case 'boolean':
      return (
        <Select value={currentValue} onValueChange={(newValue) => onColumnFilter(fieldName, newValue)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'select':
    case 'enum':
      return (
        <Select value={currentValue} onValueChange={(newValue) => onColumnFilter(fieldName, newValue)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`All ${attribute.display_name || fieldName}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All {attribute.display_name || fieldName}</SelectItem>
            {attribute.options?.map((option: any) => {
              const optionValue = String(option.value ?? '')
              if (optionValue === '') return null
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  {option.label || option.value}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )
    case 'text':
    case 'string':
    default:
      return (
        <Input
          placeholder={`Filter by ${attribute.display_name || fieldName}`}
          value={currentValue}
          onChange={(event) => onColumnFilter(fieldName, event.target.value)}
        />
      )
  }
}

export function CustomerColumnFilter({
  field,
  isOpen,
  options,
  type,
  value,
  onClear,
  onColumnFilter,
  onToggle
}: CustomerColumnFilterProps) {
  if (!isOpen) {
    return (
      <button onClick={() => onToggle(field)} className="ml-2 p-1 hover:bg-muted rounded">
        <Filter className="h-3 w-3" />
      </button>
    )
  }

  const renderFilterContent = () => {
    switch (type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(newValue) => onColumnFilter(field, newValue)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`All ${field}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {field}</SelectItem>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(event) => onColumnFilter(field, { ...value, min: event.target.value })}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(event) => onColumnFilter(field, { ...value, max: event.target.value })}
              className="w-full"
              onBlur={() => setTimeout(() => onToggle(field), 200)}
            />
          </div>
        )
      case 'date':
        return (
          <div className="space-y-2">
            <Input
              type="date"
              placeholder="From"
              value={value?.from || ''}
              onChange={(event) => onColumnFilter(field, { ...value, from: event.target.value })}
              className="w-full"
            />
            <Input
              type="date"
              placeholder="To"
              value={value?.to || ''}
              onChange={(event) => onColumnFilter(field, { ...value, to: event.target.value })}
              className="w-full"
              onBlur={() => setTimeout(() => onToggle(field), 200)}
            />
          </div>
        )
      case 'text':
      default:
        return (
          <Input
            placeholder={`Filter ${field}...`}
            value={value}
            onChange={(event) => onColumnFilter(field, event.target.value)}
            className="pr-6"
            onBlur={() => setTimeout(() => onToggle(field), 200)}
          />
        )
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-full left-0 z-10 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[200px]">
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClear(field)}
            className="absolute top-1 right-1 h-5 w-5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {renderFilterContent()}
      </div>
    </div>
  )
}
