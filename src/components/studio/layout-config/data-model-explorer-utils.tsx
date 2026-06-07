import { Calendar, DollarSign, Hash, Type } from 'lucide-react'

export function getAttributeIcon(type: string) {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('number') || lowerType.includes('integer') || lowerType.includes('decimal')) {
    return <Hash className="h-3 w-3 text-primary" />
  }
  if (lowerType.includes('date') || lowerType.includes('time')) {
    return <Calendar className="h-3 w-3 text-primary" />
  }
  if (lowerType.includes('money') || lowerType.includes('currency')) {
    return <DollarSign className="h-3 w-3 text-warning" />
  }
  return <Type className="h-3 w-3 text-muted-foreground" />
}

export function isNumeric(type: string): boolean {
  const lowerType = type.toLowerCase()
  return lowerType.includes('number') ||
    lowerType.includes('integer') ||
    lowerType.includes('decimal') ||
    lowerType.includes('float') ||
    lowerType.includes('money') ||
    lowerType.includes('currency')
}
