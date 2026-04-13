'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { VectorStoreList } from './components/VectorStoreList'
import { FileManagement } from '@/app/tools/vector-store/components/FileManagement'
import { Toaster } from 'react-hot-toast'

export default function VectorStorePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vectorStores, setVectorStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVectorStores = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vector-stores')
      if (!res.ok) {
        throw new Error(`Failed to fetch vector stores: ${res.statusText}`)
      }
      const data = await res.json()
      if (data.vectorStores) {
        setVectorStores(data.vectorStores)
        // Auto-select first one if none selected
        if (!selectedId && data.vectorStores.length > 0) {
          setSelectedId(data.vectorStores[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch vector stores', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVectorStores()
  }, [])

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-background">
      <Toaster position="top-right" />
      
      {/* Sidebar - Vector Store List */}
      <div className="w-80 border-r border-border/50 bg-muted/30">
        <VectorStoreList 
          vectorStores={vectorStores} 
          selectedId={selectedId} 
          onSelect={setSelectedId} 
          onRefresh={fetchVectorStores}
          loading={loading}
        />
      </div>

      {/* Main Content - File Management */}
      <div className="flex-1 overflow-auto p-6">
        {selectedId ? (
          <FileManagement 
            vectorStoreId={selectedId} 
            vectorStoreName={vectorStores.find(v => v.id === selectedId)?.name || 'Vector Store'}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground italic">
            {loading ? 'Loading vector stores...' : 'Select a vector store to manage its files'}
          </div>
        )}
      </div>
    </div>
  )
}
