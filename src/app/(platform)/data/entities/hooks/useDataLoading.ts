import { useState, useEffect } from 'react'
import { DataModel, Attribute, DataRecord, SortConfig } from '../types'
import { DEFAULT_PAGINATION } from '@/lib/constants/defaults'

interface UseDataLoadingProps {
  modelId: string | null
  pagination: { page: number; limit: number; total: number; pages: number }
  sortConfig: SortConfig | null
  filters: Record<string, any>
}

interface UseDataLoadingReturn {
  loading: boolean
  dataModel: DataModel | null
  attributes: Attribute[]
  records: DataRecord[]
  baseRecords: DataRecord[]
  error: string | null
  setLoading: (loading: boolean) => void
  setDataModel: (model: DataModel | null) => void
  setAttributes: (attributes: Attribute[]) => void
  setRecords: (records: DataRecord[]) => void
  setBaseRecords: (records: DataRecord[]) => void
  setError: (error: string | null) => void
  setPagination: (pagination: any) => void
}

export function useDataLoading({
  modelId,
  pagination,
  sortConfig,
  filters
}: UseDataLoadingProps): UseDataLoadingReturn {
  const [loading, setLoading] = useState(false)
  const [dataModel, setDataModel] = useState<DataModel | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [records, setRecords] = useState<DataRecord[]>([])
  const [baseRecords, setBaseRecords] = useState<DataRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [paginationState, setPagination] = useState(pagination)

  // Load data model and attributes
  useEffect(() => {
    if (!modelId) return
    
    async function loadModelData() {
      setLoading(true)
      try {
        // Load model info
        console.log('🔍 Loading model info...')
        const modelRes = await fetch(`/api/data-models/${modelId}`)
        console.log('🔍 Model API Response:', modelRes.status, modelRes.statusText)
        if (modelRes.ok) {
          const modelData = await modelRes.json()
          console.log('🔍 Model Data:', modelData)
          setDataModel(modelData.dataModel)
        } else {
          console.error('❌ Model API Error:', modelRes.status, modelRes.statusText)
        }
        
        // Load attributes
        console.log('🔍 Loading attributes...')
        const attrRes = await fetch(`/api/data-models/${modelId}/attributes`)
        console.log('🔍 Attributes API Response:', attrRes.status, attrRes.statusText)
        if (attrRes.ok) {
          const attrData = await attrRes.json()
          console.log('🔍 Attributes Data:', attrData)
          console.log('🔍 Attributes count:', attrData.attributes?.length || 0)
          if (attrData.attributes && attrData.attributes.length > 0) {
            console.log('🔍 First 5 attributes:')
            attrData.attributes.slice(0, 5).forEach((attr: any) => {
              console.log(`   ${attr.name} (${attr.display_name}) - ${attr.type}`)
            })
          }
          setAttributes(attrData.attributes || [])
        } else {
          console.error('❌ Attributes API Error:', attrRes.status, attrRes.statusText)
        }
      } catch (error) {
        console.error('Error loading model data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadModelData()
  }, [modelId])
  
  // Load records with current filters and sorting
  useEffect(() => {
    if (!modelId) return
    
    async function loadRecords() {
      setLoading(true)
      try {
         const params = new URLSearchParams({
           data_model_id: modelId as string,
           page: pagination.page.toString(),
           limit: pagination.limit.toString(),
         })
         
         // Add filters
         Object.entries(filters).forEach(([key, value]) => {
           if (value !== '' && value !== null && value !== undefined) {
             params.append(`filter_${key}`, value)
           }
         })
         
         if (sortConfig) {
           params.append('sort_by', sortConfig.key)
           params.append('sort_direction', sortConfig.direction)
         }
        
        
        const apiUrl = `/api/data-records?${params}`
    
        
        const res = await fetch(apiUrl)
        
        if (res.ok) {
          const data = await res.json()
     
          setRecords(data.records || [])
          setPagination(data.pagination || { page: DEFAULT_PAGINATION.page, limit: DEFAULT_PAGINATION.limit, total: 0, pages: 0 })
        } else {
          console.error('❌ API Error:', res.status, res.statusText)
          const errorText = await res.text()
          console.error('❌ Error Response:', errorText.substring(0, 500))
          setError(`API Error: ${res.status} ${res.statusText}`)
          // Set empty state to show 0 records
          setRecords([])
          setPagination({ page: DEFAULT_PAGINATION.page, limit: DEFAULT_PAGINATION.limit, total: 0, pages: 0 })
        }
      } catch (error) {
        console.error('Error loading records:', error)
      } finally {
        setLoading(false)
      }
    }
    
     loadRecords()
  }, [modelId, pagination.page, sortConfig, filters])
  
  useEffect(() => {
    if (!modelId) return
    
    // Load a one-time unfiltered snapshot for option generation
    async function loadBaseSnapshot() {
      try {
        const params = new URLSearchParams({ data_model_id: modelId as string, page: '1', limit: '1000' })
        const res = await fetch(`/api/data-records?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setBaseRecords(Array.isArray(data.records) ? data.records : [])
        }
      } catch (_) {
        // ignore snapshot errors
      }
    }
    loadBaseSnapshot()
  }, [modelId])

  return {
    loading,
    dataModel,
    attributes,
    records,
    baseRecords,
    error,
    setLoading,
    setDataModel,
    setAttributes,
    setRecords,
    setBaseRecords,
    setError,
    setPagination
  }
}
