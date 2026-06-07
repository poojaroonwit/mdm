'use client'

import { useEffect, useState } from 'react'

export type LookupOption = {
  id: string
  name: string
}

type LookupKey =
  | 'companies'
  | 'industries'
  | 'sources'
  | 'events'
  | 'positions'
  | 'businessProfiles'
  | 'titles'
  | 'callStatuses'

const lookupConfigs: Array<{
  key: LookupKey
  endpoint: string
  responseKey: string
}> = [
  { key: 'companies', endpoint: '/api/companies?limit=200&page=1', responseKey: 'companies' },
  { key: 'industries', endpoint: '/api/industries?limit=200&page=1', responseKey: 'industries' },
  { key: 'sources', endpoint: '/api/sources?limit=200&page=1', responseKey: 'sources' },
  { key: 'events', endpoint: '/api/events?limit=200&page=1', responseKey: 'events' },
  { key: 'positions', endpoint: '/api/positions?limit=200&page=1', responseKey: 'positions' },
  { key: 'businessProfiles', endpoint: '/api/business-profiles?limit=200&page=1', responseKey: 'businessProfiles' },
  { key: 'titles', endpoint: '/api/titles?limit=200&page=1', responseKey: 'titles' },
  { key: 'callStatuses', endpoint: '/api/call-workflow-statuses?limit=200&page=1', responseKey: 'statuses' }
]

const initialOptions: Record<LookupKey, LookupOption[]> = {
  companies: [],
  industries: [],
  sources: [],
  events: [],
  positions: [],
  businessProfiles: [],
  titles: [],
  callStatuses: []
}

export function useCustomerLookupOptions() {
  const [options, setOptions] = useState(initialOptions)

  useEffect(() => {
    lookupConfigs.forEach(async ({ endpoint, key, responseKey }) => {
      try {
        const response = await fetch(endpoint)
        if (!response.ok) return
        const json = await response.json()
        const nextOptions = (json[responseKey] || []).map((item: any) => ({ id: item.id, name: item.name }))

        setOptions(prev => ({
          ...prev,
          [key]: nextOptions
        }))
      } catch {}
    })
  }, [])

  return options
}
