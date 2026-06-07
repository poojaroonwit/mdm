import {
  Calendar,
  DollarSign,
  FileText,
  Hash,
  Image,
  Link,
  List,
  Mail,
  MapPin,
  Palette,
  Phone,
  Star,
  ToggleLeft,
  Type
} from 'lucide-react'

export interface RecordField {
  id: string
  name: string
  displayName: string
  type: string
  required: boolean
  visible: boolean
  editable: boolean
  width?: number
  order: number
  format?: string
  validation?: any
}

export interface RecordConfigData {
  id: string
  name: string
  description: string
  dataSource: string
  fields: RecordField[]
  layout: {
    mode: 'table' | 'list' | 'grid' | 'card'
    columns: number
    density: 'compact' | 'normal' | 'spacious'
    showHeaders: boolean
    showBorders: boolean
    alternatingRows: boolean
  }
  display: {
    showPagination: boolean
    pageSize: number
    showSearch: boolean
    showFilters: boolean
    showSorting: boolean
    showActions: boolean
  }
  styling: {
    theme: 'default' | 'minimal' | 'modern' | 'classic'
    primaryColor: string
    backgroundColor: string
    textColor: string
    borderColor: string
    borderRadius: number
    fontSize: 'small' | 'medium' | 'large'
    fontFamily: string
  }
  actions: {
    allowCreate: boolean
    allowEdit: boolean
    allowDelete: boolean
    allowExport: boolean
    allowImport: boolean
    allowBulkActions: boolean
  }
}

export const fieldTypeIcons: Record<string, any> = {
  TEXT: Type,
  NUMBER: Hash,
  EMAIL: Mail,
  PHONE: Phone,
  URL: Link,
  DATE: Calendar,
  DATETIME: Calendar,
  BOOLEAN: ToggleLeft,
  SELECT: List,
  MULTISELECT: List,
  TEXTAREA: FileText,
  RICH_TEXT: FileText,
  IMAGE: Image,
  FILE: FileText,
  LOCATION: MapPin,
  CURRENCY: DollarSign,
  PERCENTAGE: Hash,
  RATING: Star,
  COLOR: Palette,
  JSON: FileText
}

export const defaultRecordConfig: RecordConfigData = {
  id: '',
  name: 'Record Configuration',
  description: 'Configure how records are displayed',
  dataSource: '',
  fields: [],
  layout: {
    mode: 'table',
    columns: 2,
    density: 'normal',
    showHeaders: true,
    showBorders: true,
    alternatingRows: true
  },
  display: {
    showPagination: true,
    pageSize: 20,
    showSearch: true,
    showFilters: true,
    showSorting: true,
    showActions: true
  },
  styling: {
    theme: 'default',
    primaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 'medium',
    fontFamily: 'Inter'
  },
  actions: {
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
    allowImport: false,
    allowBulkActions: true
  }
}
