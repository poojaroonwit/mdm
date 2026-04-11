'use client'

import { Skeleton } from '@/components/ui/skeleton'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Database,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DataAsset } from '../types'

interface ColumnProfile {
  name: string
  type: string
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  uniquePercentage: number
  min?: any
  max?: any
  mean?: number
  median?: number
  stddev?: number
  distinctCount: number
  histogram?: Array<{ value: any; count: number }>
}

interface TableProfile {
  rowCount: number
  columnCount: number
  timestamp: Date
  columns: ColumnProfile[]
}

interface DataProfilingProps {
  asset: DataAsset | null
  config: any
}

export function DataProfiling({ asset, config }: DataProfilingProps) {
  const [profile, setProfile] = useState<TableProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)

  useEffect(() => {
    if (asset && config?.isEnabled) {
      loadProfile()
    }
  }, [asset, config])

  const loadProfile = async () => {
    if (!asset) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/data-governance/profiling/${asset.fullyQualifiedName}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load data profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!asset) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Select an asset to view its profile</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="grid grid-cols-3 gap-4">
             <Skeleton className="h-24 w-full rounded-lg" />
             <Skeleton className="h-24 w-full rounded-lg" />
             <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Profiling
          </CardTitle>
          <CardDescription>No profile data available for this asset</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadProfile}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Profile
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedColumnProfile = selectedColumn
    ? profile.columns.find((col) => col.name === selectedColumn)
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Profile: {asset.name}
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(profile.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadProfile}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{profile.rowCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{profile.columnCount}</div>
              <div className="text-sm text-muted-foreground">Columns</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {profile.columns.filter((col) => col.nullCount === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Complete Columns</div>
            </div>
          </div>

          <div className="w-full">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Data Completeness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.columns.slice(0, 5).map((col) => (
                        <div key={col.name} className="flex items-center justify-between">
                          <span className="text-sm">{col.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${100 - col.nullPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {Math.round(100 - col.nullPercentage)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Uniqueness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.columns.slice(0, 5).map((col) => (
                        <div key={col.name} className="flex items-center justify-between">
                          <span className="text-sm">{col.name}</span>
                          <Badge variant="outline">
                            {col.uniquePercentage.toFixed(1)}% unique
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="columns" className="space-y-4">
              <div className="space-y-2">
                {profile.columns.map((col) => (
                  <Card
                    key={col.name}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      selectedColumn === col.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedColumn(col.name)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{col.name}</CardTitle>
                        <Badge variant="outline">{col.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nulls:</span>
                          <span className="ml-2 font-medium">
                            {col.nullCount} ({col.nullPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Distinct:</span>
                          <span className="ml-2 font-medium">{col.distinctCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unique:</span>
                          <span className="ml-2 font-medium">
                            {col.uniquePercentage.toFixed(1)}%
                          </span>
                        </div>
                        {col.min !== undefined && col.max !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Range:</span>
                            <span className="ml-2 font-medium">
                              {col.min} - {col.max}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              {selectedColumnProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Column Statistics: {selectedColumnProfile.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedColumnProfile.mean !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Mean:</span>
                          <span className="ml-2 font-medium">{selectedColumnProfile.mean.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedColumnProfile.median !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Median:</span>
                          <span className="ml-2 font-medium">{selectedColumnProfile.median.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedColumnProfile.stddev !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Std Dev:</span>
                          <span className="ml-2 font-medium">{selectedColumnProfile.stddev.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Distinct Values:</span>
                        <span className="ml-2 font-medium">{selectedColumnProfile.distinctCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!selectedColumnProfile && (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Select a column to view detailed statistics</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

