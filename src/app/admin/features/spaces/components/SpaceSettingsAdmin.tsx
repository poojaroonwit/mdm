'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, ArrowRight } from 'lucide-react'
import { Space } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export function SpaceSettingsAdmin({ selectedSpaceId }: { selectedSpaceId?: string }) {
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string>(selectedSpaceId || '')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSpaces()
  }, [])

  useEffect(() => {
    if (selectedSpaceId) {
      setSelectedSpace(selectedSpaceId)
      // Auto-navigate to the space settings page if a space is selected
      const space = spaces.find(s => s.id === selectedSpaceId)
      if (space) {
        router.push(`/${space.slug || space.id}/settings`)
      }
    }
  }, [selectedSpaceId, spaces, router])

  const loadSpaces = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpace(spaceId)
    const space = spaces.find(s => s.id === spaceId)
    if (space) {
      // Navigate to the space settings page
      router.push(`/${space.slug || space.id}/settings`)
    }
  }

  const selectedSpaceData = useMemo(() => {
    return spaces.find(s => s.id === selectedSpace)
  }, [spaces, selectedSpace])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Space Settings</h2>
        <p className="text-muted-foreground">Select a space to manage its settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Space</CardTitle>
          <CardDescription>Choose a space to view and manage its settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Space</label>
            <Select value={selectedSpace} onValueChange={handleSpaceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map(space => (
                  <SelectItem key={space.id} value={space.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {space.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSpaceData && (
            <Button
              className="w-full"
              onClick={() => {
                router.push(`/${selectedSpaceData.slug || selectedSpaceData.id}/settings`)
              }}
            >
              Open Settings
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedSpaceData && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>
              Space settings will open in a new page with the admin sidebar visible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedSpaceData.name}</p>
                  <p className="text-sm text-muted-foreground">Click below to open settings</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  router.push(`/${selectedSpaceData.slug || selectedSpaceData.id}/settings`)
                }}
              >
                Open Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

