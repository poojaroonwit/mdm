'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { showError } from '@/lib/toast-utils'

interface DataModelDataOptions {
  interval?: number
  enabled?: boolean
  transport?: 'polling' | 'websocket' | 'hybrid'
  websocketUrl?: string
  onDataUpdate?: (data: any) => void
  onError?: (error: Error) => void
  filters?: any[]
  limit?: number
  offset?: number
}

interface DataModelDataState {
  data: any[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isConnected: boolean
  connectionCount: number
  total: number
  attributes: any[]
}

export function useDataModelData(
  dataModelId: string,
  customQuery: string = '',
  options: DataModelDataOptions = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    transport = 'polling',
    websocketUrl,
    onDataUpdate,
    onError,
    filters = [],
    limit,
    offset = 0
  } = options
  const shouldUsePolling = transport === 'polling' || transport === 'hybrid'
  const shouldUseWebSocket = transport === 'websocket' || transport === 'hybrid'

  const [state, setState] = useState<DataModelDataState>({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isConnected: false,
    connectionCount: 0,
    total: 0,
    attributes: []
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const fetchData = useCallback(async () => {
    if (!dataModelId) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/data-models/${dataModelId}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customQuery,
          filters,
          limit,
          offset
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setState(prev => ({
        ...prev,
        data: result.data || [],
        loading: false,
        lastUpdated: new Date(),
        isConnected: true,
        connectionCount: prev.connectionCount + 1,
        total: result.metadata?.total || 0,
        attributes: result.metadata?.attributes || []
      }))

      onDataUpdate?.(result.data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isConnected: false
      }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [dataModelId, customQuery, filters, limit, offset, onDataUpdate, onError])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (!websocketUrl) return

    try {
      const wsUrl = websocketUrl
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected for data model:', dataModelId)
        setState(prev => ({ ...prev, isConnected: true, error: null }))
        reconnectAttempts.current = 0
        
        // Send subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          dataModelId,
          customQuery,
          filters
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'data_update') {
            setState(prev => ({
              ...prev,
              data: message.data,
              lastUpdated: new Date(),
              connectionCount: prev.connectionCount + 1
            }))
            onDataUpdate?.(message.data)
          } else if (message.type === 'error') {
            setState(prev => ({ ...prev, error: message.error }))
            onError?.(new Error(message.error))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected for data model:', dataModelId)
        setState(prev => ({ ...prev, isConnected: false }))
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        } else {
          showError('Failed to reconnect to real-time data')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }))
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setState(prev => ({ ...prev, error: 'Failed to create WebSocket connection' }))
    }
  }, [dataModelId, customQuery, filters, websocketUrl, onDataUpdate, onError])

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setState(prev => ({ ...prev, isConnected: false }))
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Initial fetch
    fetchData()

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval)
  }, [fetchData, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    stopPolling()
    disconnectWebSocket()
    setState({
      data: [],
      loading: false,
      error: null,
      lastUpdated: null,
      isConnected: false,
      connectionCount: 0,
      total: 0,
      attributes: []
    })
  }, [stopPolling, disconnectWebSocket])

  // Effect to handle polling
  useEffect(() => {
    if (enabled && shouldUsePolling && dataModelId) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, shouldUsePolling, dataModelId, startPolling, stopPolling])

  // Effect to handle WebSocket connection
  useEffect(() => {
    if (enabled && shouldUseWebSocket && dataModelId) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [enabled, shouldUseWebSocket, dataModelId, connectWebSocket, disconnectWebSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
      disconnectWebSocket()
    }
  }, [stopPolling, disconnectWebSocket])

  return {
    ...state,
    refresh,
    reset,
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket
  }
}
