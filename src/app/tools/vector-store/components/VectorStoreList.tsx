'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, TrashIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface VectorStoreListProps {
  vectorStores: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRefresh: () => Promise<void>
  loading: boolean
}

export function VectorStoreList({ vectorStores, selectedId, onSelect, onRefresh, loading }: VectorStoreListProps) {
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const filteredStores = vectorStores.filter(vs => 
    vs.name.toLowerCase().includes(search.toLowerCase()) || 
    vs.id.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) return
    
    try {
      const res = await fetch('/api/vector-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      
      const data = await res.json()
      if (data.vectorStore) {
        toast.success(`Vector store "${newName}" created`)
        setNewName('')
        setIsCreating(false)
        await onRefresh()
        onSelect(data.vectorStore.id)
      } else {
        toast.error(data.error || 'Failed to create vector store')
      }
    } catch (err) {
      toast.error('Failed to create vector store')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return

    try {
      const res = await fetch(`/api/vector-stores/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Vector store deleted`)
        if (selectedId === id) onSelect('')
        await onRefresh()
      } else {
        toast.error(data.error || 'Failed to delete vector store')
      }
    } catch (err) {
      toast.error('Failed to delete vector store')
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Vector Stores</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRefresh()} 
            disabled={loading}
            className="h-8 w-8"
          >
            <ArrowPathIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="relative mb-2">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search stores..." 
            className="pl-9 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isCreating ? (
          <div className="space-y-2 pt-2 animate-in fade-in duration-200">
            <Input 
              placeholder="Store name..." 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              className="h-9"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8" onClick={handleCreate}>Create</Button>
              <Button size="sm" variant="ghost" className="flex-1 h-8" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button 
            className="w-full mt-2 h-9 border-dashed" 
            variant="outline" 
            onClick={() => setIsCreating(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Vector Store
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {filteredStores.length > 0 ? (
          filteredStores.map(vs => (
            <div 
              key={vs.id}
              onClick={() => onSelect(vs.id)}
              className={cn(
                "group relative p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                selectedId === vs.id 
                  ? "bg-primary/5 border-primary/20 shadow-lg" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex flex-col gap-0.5 pr-8">
                <span className={cn(
                  "font-medium truncate text-sm",
                  selectedId === vs.id ? "text-primary" : "text-foreground"
                )}>
                  {vs.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate opacity-60">
                  {vs.id}
                </span>
              </div>
              
              <button
                onClick={(e) => handleDelete(e, vs.id, vs.name)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground italic">
            {loading ? 'Crunching data...' : 'No stores found'}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/50 text-[10px] text-muted-foreground text-center bg-muted/20">
        Used for File Search in Agent SDK
      </div>
    </div>
  )
}
