import { Calendar as CalendarIcon, Hash, Type as TypeIcon } from 'lucide-react'
import { Attribute } from './chartDataSourceTypes'

export const getAttributeTypeOptionClass = (type?: string) => {
  const t = (type || '').toLowerCase()
  if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) {
    return 'bg-warning/20 text-warning'
  }
  if (t.includes('date') || t.includes('time')) {
    return 'bg-primary/10 text-primary'
  }
  if (t.includes('bool')) {
    return 'bg-secondary/50 text-secondary-foreground'
  }
  return 'bg-muted text-muted-foreground'
}

export const getAttributeIcon = (type?: string) => {
  const t = (type || '').toLowerCase()
  if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) return Hash
  if (t.includes('date') || t.includes('time')) return CalendarIcon
  return TypeIcon
}

export const getEffectiveType = (
  dimKey: string,
  attr: Attribute | undefined,
  attributeTypeOverrides: Record<string, Record<string, string>>
): string => {
  const override = attributeTypeOverrides[dimKey]?.[attr?.name || '']
  return (override || attr?.type || 'text').toLowerCase()
}

