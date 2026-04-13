'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Hash } from 'lucide-react'
import { Calendar, CheckSquare, Clock, Code, Link as LinkIcon, Mail, Phone } from 'lucide-react'
import type { Attribute, DataRecord } from '@/app/data/entities/types'

export function renderCellValue(record: DataRecord, attribute: Attribute) {
  const value = (record?.values || {})[attribute.name]
  if (value === undefined || value === null || value === '') return <span className="text-muted-foreground">—</span>

  switch (attribute.type?.toUpperCase()) {
    case 'EMAIL':
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{String(value)}</a>
        </div>
      )

    case 'URL':
      return (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {String(value)}
          </a>
        </div>
      )

    case 'PHONE':
      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">{String(value)}</a>
        </div>
      )

    case 'DATE':
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      )

    case 'DATETIME':
    case 'DATETIME_TZ':
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(value).toLocaleString()}</span>
        </div>
      )

    case 'TIME':
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{String(value)}</span>
        </div>
      )

    case 'BOOLEAN':
      return (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={value ? 'text-green-700' : 'text-red-700'}>
            {value ? 'True' : 'False'}
          </span>
        </div>
      )

    case 'SELECT': {
      let selectOptions: any[] = []
      try {
        if (attribute.options) {
          if (Array.isArray(attribute.options)) selectOptions = attribute.options
          else if (typeof attribute.options === 'string') {
            const parsed = JSON.parse(attribute.options)
            if (Array.isArray(parsed)) selectOptions = parsed
            else if (parsed?.options && Array.isArray(parsed.options)) selectOptions = parsed.options
            else selectOptions = Object.values(parsed)
          } else if (typeof attribute.options === 'object') {
            if (attribute.options.options && Array.isArray(attribute.options.options)) selectOptions = attribute.options.options
            else selectOptions = Object.values(attribute.options)
          }
        }
      } catch {
        selectOptions = []
      }
      if (!Array.isArray(selectOptions)) selectOptions = []
      const selectedOption = selectOptions.find((opt: any) => (typeof opt === 'object' ? opt.value : opt) === value)
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <CheckSquare className="h-3 w-3" />
          {selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : String(value)}
        </Badge>
      )
    }

    case 'MULTI_SELECT': {
      let multiSelectOptions: any[] = []
      try {
        if (attribute.options) {
          if (Array.isArray(attribute.options)) multiSelectOptions = attribute.options
          else if (typeof attribute.options === 'string') {
            const parsed = JSON.parse(attribute.options)
            if (Array.isArray(parsed)) multiSelectOptions = parsed
            else if (parsed?.options && Array.isArray(parsed.options)) multiSelectOptions = parsed.options
            else multiSelectOptions = Object.values(parsed)
          } else if (typeof attribute.options === 'object') {
            if (attribute.options.options && Array.isArray(attribute.options.options)) multiSelectOptions = attribute.options.options
            else multiSelectOptions = Object.values(attribute.options)
          }
        }
      } catch {
        multiSelectOptions = []
      }
      if (!Array.isArray(multiSelectOptions)) multiSelectOptions = []
      const selectedValues = Array.isArray(value) ? value : String(value).split(',')
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val: string, index: number) => {
            const option = multiSelectOptions.find((opt: any) => (typeof opt === 'object' ? opt.value : opt) === val.trim())
            return (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {option ? (typeof option === 'object' ? option.label : option) : val.trim()}
              </Badge>
            )
          })}
        </div>
      )
    }

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return (
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{String(value)}</span>
        </div>
      )

    case 'JSON':
      return (
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-muted-foreground" />
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </code>
        </div>
      )

    default:
      return <span>{String(value)}</span>
  }
}

// Render edit field for a given attribute and value, using provided setter
export function renderEditFieldHelper(
  attribute: Attribute,
  value: any,
  ctx: { onValueChange: (v: any) => void }
) {
  const handleValueChange = ctx.onValueChange
  switch (attribute.type?.toUpperCase()) {
    case 'TEXT':
    case 'TEXTAREA':
      return (
        <Input value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
      )
    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return (
        <Input type="number" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
      )
    case 'EMAIL':
      return (
        <Input type="email" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
      )
    case 'URL':
      return (
        <Input type="url" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
      )
    case 'PHONE':
      return (
        <Input type="tel" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
      )
    case 'DATE':
      return <Input type="date" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} />
    case 'DATETIME':
    case 'DATETIME_TZ':
      return <Input type="datetime-local" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} />
    case 'TIME':
      return <Input type="time" value={value || ''} onChange={(e) => handleValueChange(e.target.value)} />
    case 'BOOLEAN':
      return (
        <Select value={value ? 'true' : 'false'} onValueChange={(v) => handleValueChange(v === 'true')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'SELECT': {
      let selectOptions: any[] = []
      try {
        if (attribute.options) {
          if (Array.isArray(attribute.options)) selectOptions = attribute.options
          else if (typeof attribute.options === 'string') {
            const parsed = JSON.parse(attribute.options)
            if (Array.isArray(parsed)) selectOptions = parsed
            else if (parsed?.options && Array.isArray(parsed.options)) selectOptions = parsed.options
            else selectOptions = Object.entries(parsed).map(([key, val]) => ({ value: key, label: val }))
          } else if (typeof attribute.options === 'object') {
            if ((attribute.options as any).options && Array.isArray((attribute.options as any).options)) selectOptions = (attribute.options as any).options
            else selectOptions = Object.entries(attribute.options).map(([key, val]) => ({ value: key, label: val as any }))
          }
        }
      } catch {
        selectOptions = []
      }
      if (!Array.isArray(selectOptions)) selectOptions = []
      return (
        <Select value={value || ''} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${attribute.display_name}`} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions
              .map((option: any, index: number) => {
                const optionValue = String(option.value ?? option ?? '')
                const optionLabel = option.label || option || ''
                return { optionValue, optionLabel, index }
              })
              .filter(({ optionValue }) => optionValue !== '')
              .map(({ optionValue, optionLabel, index }) => (
                <SelectItem key={`${optionValue}-${index}`} value={optionValue}>
                  {optionLabel}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )
    }
    case 'MULTI_SELECT': {
      let multiSelectOptions: any[] = []
      try {
        if (attribute.options) {
          if (Array.isArray(attribute.options)) multiSelectOptions = attribute.options
          else if (typeof attribute.options === 'string') {
            const parsed = JSON.parse(attribute.options)
            if (Array.isArray(parsed)) multiSelectOptions = parsed
            else if (parsed?.options && Array.isArray(parsed.options)) multiSelectOptions = parsed.options
            else multiSelectOptions = Object.entries(parsed).map(([key, val]) => ({ value: key, label: val }))
          } else if (typeof attribute.options === 'object') {
            if ((attribute.options as any).options && Array.isArray((attribute.options as any).options)) multiSelectOptions = (attribute.options as any).options
            else multiSelectOptions = Object.entries(attribute.options).map(([key, val]) => ({ value: key, label: val as any }))
          }
        }
      } catch {
        multiSelectOptions = []
      }
      if (!Array.isArray(multiSelectOptions)) multiSelectOptions = []
      const selectedValues = Array.isArray(value) ? value : (value ? String(value).split(',') : [])
      const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
        let newValues: string[]
        if (checked) newValues = [...selectedValues, optionValue]
        else newValues = selectedValues.filter((v) => v !== optionValue)
        handleValueChange(newValues.join(','))
      }
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {multiSelectOptions.map((option: any, idx: number) => {
              const optionValue = option.value || option
              const optionLabel = option.label || option
              const isSelected = selectedValues.includes(optionValue)
              return (
                <div key={`${optionValue}-${idx}`} className="flex items-center space-x-2">
                  <Checkbox id={`${attribute.name}-${optionValue}`} checked={isSelected} onCheckedChange={(checked) => handleMultiSelectChange(optionValue, checked as boolean)} />
                  <Label htmlFor={`${attribute.name}-${optionValue}`} className="text-sm">{optionLabel}</Label>
                </div>
              )
            })}
          </div>
          {selectedValues.length > 0 && <div className="text-xs text-muted-foreground">Selected: {selectedValues.join(', ')}</div>}
        </div>
      )
    }
    default:
      return <Input value={value || ''} onChange={(e) => handleValueChange(e.target.value)} placeholder={`Enter ${attribute.display_name}`} />
  }
}

// Build the filter UI for a given attribute, based on provided context
export function getFilterComponentHelper(
  attribute: Attribute,
  ctx: {
    currentValue: any
    handleFilter: (name: string, value: any) => void
    baseRecords: DataRecord[]
    optionSearch: Record<string, string>
    setOptionSearch: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  }
) {
  const { currentValue, handleFilter, baseRecords, optionSearch, setOptionSearch } = ctx
  switch (attribute.type?.toUpperCase()) {
    case 'TEXT':
    case 'TEXTAREA':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Text Search
            </Label>
            <Input placeholder={`Search in ${attribute.display_name}...`} value={currentValue} onChange={(e) => handleFilter(attribute.name, e.target.value)} className="w-full" />
            <p className="text-xs text-muted-foreground">Enter text to search within this field</p>
          </div>
        </div>
      )
    case 'NUMBER':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Number Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min</Label>
                <Input type="number" placeholder="Min value" value={String(currentValue).split(',')[0] || ''} onChange={(e) => handleFilter(attribute.name, `${e.target.value},${String(currentValue).split(',')[1] || ''}`)} className="w-full" />
              </div>
              <div>
                <Label className="text-xs">Max</Label>
                <Input type="number" placeholder="Max value" value={String(currentValue).split(',')[1] || ''} onChange={(e) => handleFilter(attribute.name, `${String(currentValue).split(',')[0] || ''},${e.target.value}`)} className="w-full" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Set minimum and maximum values for filtering</p>
          </div>
        </div>
      )
    case 'SELECT':
    case 'MULTI_SELECT': {
      const attrOptionsRaw = attribute.options ? (typeof attribute.options === 'string' ? (() => { try { return JSON.parse(attribute.options) } catch { return null } })() : attribute.options) : null
      const optionValues: string[] = Array.isArray(attrOptionsRaw)
        ? attrOptionsRaw
            .map((opt: any) => (typeof opt === 'object' && opt !== null ? opt.value ?? opt.name ?? opt.label ?? '' : String(opt)))
            .filter(Boolean)
        : Array.from(new Set(baseRecords.map((record) => record.values?.[attribute.name]).filter((v: any) => v !== undefined && v !== null && v !== ''))).sort()
      const currentValues = currentValue ? (Array.isArray(currentValue) ? currentValue : String(currentValue).split(',')) : []
      const handleMultiSelectChange = (value: string, checked: boolean) => {
        let newValues: string[]
        if (checked) newValues = [...currentValues, value]
        else newValues = currentValues.filter((v) => v !== value)
        handleFilter(attribute.name, newValues.join(','))
      }
      const handleSelectAll = () => handleFilter(attribute.name, optionValues.join(','))
      const handleSelectNone = () => handleFilter(attribute.name, '')
      const searchValue = optionSearch[attribute.name] || ''
      const filteredOptions = optionValues.filter((v) => String(v).toLowerCase().includes(searchValue.toLowerCase()))
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{attribute.display_name}</span>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-6 px-2 text-xs">All</Button>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectNone} className="h-6 px-2 text-xs">None</Button>
              </div>
            </div>
          </div>
          <Input placeholder={`Search ${attribute.display_name}...`} value={searchValue} onChange={(e) => setOptionSearch((prev) => ({ ...prev, [attribute.name]: e.target.value }))} className="h-8" />
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
            {filteredOptions.map((val) => (
              <div key={val} className="flex items-center space-x-2">
                <Checkbox id={`filter-${attribute.name}-${val}`} checked={currentValues.includes(val)} onCheckedChange={(checked) => handleMultiSelectChange(val, checked as boolean)} />
                <Label htmlFor={`filter-${attribute.name}-${val}`} className="text-sm cursor-pointer flex-1">{String(val)}</Label>
              </div>
            ))}
            {filteredOptions.length === 0 && <div className="text-xs text-muted-foreground py-2">No options</div>}
          </div>
          {currentValues.length > 0 && <div className="text-xs text-muted-foreground">{currentValues.length} value{currentValues.length !== 1 ? 's' : ''} selected</div>}
        </div>
      )
    }
    case 'BOOLEAN':
      return (
        <Select value={currentValue || ''} onValueChange={(v) => handleFilter(attribute.name, v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'DATE':
      return (
        <Input
          type="date"
          value={String(currentValue) || ''}
          onChange={(e) => handleFilter(attribute.name, e.target.value)}
        />
      )
    case 'DATETIME':
    case 'DATETIME_TZ':
      return (
        <Input
          type="datetime-local"
          value={String(currentValue) || ''}
          onChange={(e) => handleFilter(attribute.name, e.target.value)}
        />
      )
    default:
      return (
        <Input
          value={String(currentValue) || ''}
          onChange={(e) => handleFilter(attribute.name, e.target.value)}
          placeholder={`Filter ${attribute.display_name}`}
        />
      )
  }
}


