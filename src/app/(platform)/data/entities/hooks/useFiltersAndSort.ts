import { useState, Dispatch, SetStateAction } from 'react'
import { SortConfig } from '../types'

interface UseFiltersAndSortReturn {
  sortConfig: SortConfig | null
  filters: Record<string, any>
  optionSearch: Record<string, string>
  setSortConfig: (config: SortConfig | null) => void
  setFilters: (filters: Record<string, any>) => void
  setOptionSearch: Dispatch<SetStateAction<Record<string, string>>>
  handleSort: (attributeName: string) => void
  handleFilter: (attributeName: string, value: any) => void
  clearFilters: () => void
  getFilterCountForAttribute: (attribute: any) => number
  getFilterTagsForAttribute: (attribute: any) => string[]
}

export function useFiltersAndSort(): UseFiltersAndSortReturn {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [optionSearch, setOptionSearch] = useState<Record<string, string>>({})

  const handleSort = (attributeName: string) => {
    setSortConfig(prev => {
      if (prev?.key === attributeName) {
        return prev.direction === 'asc' 
          ? { key: attributeName, direction: 'desc' }
          : null
      }
      return { key: attributeName, direction: 'asc' }
    })
  }
  
  const clearFilters = () => {
    setSortConfig(null)
    setFilters({})
  }
   
  const handleFilter = (attributeName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [attributeName]: value
    }))
  }

  // Compute how many conditions are applied for a given attribute (for badge display)
  const getFilterCountForAttribute = (attribute: any): number => {
    const raw = filters[attribute.name]
    if (raw === undefined || raw === null || raw === '') return 0

    const type = attribute.type?.toUpperCase()
    switch (type) {
      case 'SELECT':
      case 'MULTI_SELECT':
      case 'USERS':
      case 'USER':
      case 'ENTITY':
      case 'ENTITIES':
      case 'TAGS':
      case 'STATUS': {
        const parts = Array.isArray(raw) ? raw : String(raw).split(',')
        return parts.filter((p: any) => String(p).trim() !== '').length
      }
      case 'NUMBER':
      case 'DATE':
      case 'DATETIME':
      case 'CURRENCY':
      case 'PERCENTAGE':
      case 'RATING': {
        const [min, max] = String(raw).split(',')
        let c = 0
        if (min && String(min).trim() !== '') c += 1
        if (max && String(max).trim() !== '') c += 1
        return c
      }
      case 'BOOLEAN':
        return 1
      default:
        return 1
    }
  }

  // Build display tags for header based on active filters per attribute
  const getFilterTagsForAttribute = (attribute: any): string[] => {
    const raw = filters[attribute.name]
    if (raw === undefined || raw === null || raw === '') return []
    const type = attribute.type?.toUpperCase()

    if (['SELECT','MULTI_SELECT','USERS','USER','ENTITY','ENTITIES','TAGS','STATUS'].includes(type)) {
      const parts = Array.isArray(raw) ? raw : String(raw).split(',')
      return parts.map((p: any) => String(p).trim()).filter(Boolean)
    }

    if (['NUMBER','CURRENCY','PERCENTAGE','RATING'].includes(type)) {
      const [min, max] = String(raw).split(',')
      const tags: string[] = []
      if (min && String(min).trim() !== '') tags.push(`≥ ${min}`)
      if (max && String(max).trim() !== '') tags.push(`≤ ${max}`)
      return tags
    }

    if (['DATE','DATETIME'].includes(type)) {
      const [from, to] = String(raw).split(',')
      const tags: string[] = []
      if (from && String(from).trim() !== '') tags.push(`from ${from}`)
      if (to && String(to).trim() !== '') tags.push(`to ${to}`)
      return tags
    }

    if (type === 'BOOLEAN') {
      return [String(raw) === 'true' ? 'Yes' : String(raw) === 'false' ? 'No' : String(raw)]
    }

    // default text-like
    return [String(raw)]
  }

  return {
    sortConfig,
    filters,
    optionSearch,
    setSortConfig,
    setFilters,
    setOptionSearch,
    handleSort,
    handleFilter,
    clearFilters,
    getFilterCountForAttribute,
    getFilterTagsForAttribute
  }
}
