export interface AssetType {
  id: string
  code: string
  name: string
  description?: string
  category: string
  isActive: boolean
  isSystem: boolean
  sortOrder: number
}

export interface Asset {
  id: string
  code: string
  name: string
  description?: string
  logo?: string
  icon?: string
  color?: string
  isActive: boolean
  isSystem: boolean
  sortOrder: number
  metadata?: any
  assetType: AssetType
}

export interface Language {
  id: string
  code: string
  name: string
  nativeName: string
  flag?: string
  isActive: boolean
  isDefault: boolean
}

export interface Localization {
  id: string
  languageId: string
  entityType: string
  entityId: string
  field: string
  value: string
  language: Language
}

export interface AssetForm {
  code: string
  name: string
  description: string
  icon: string
  color: string
  sortOrder: number
  metadata: Record<string, unknown>
}

export interface LanguageForm {
  code: string
  name: string
  nativeName: string
  flag: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}

export interface LocalizationForm {
  entityType: string
  entityId: string
  field: string
  value: string
}
