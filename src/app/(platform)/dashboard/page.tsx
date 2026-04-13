'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Plus,
  Eye,
  Edit,
  Settings,
  TrendingUp,
  Table,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Download,
  Share2
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import toast from 'react-hot-toast'
import { IntegrationSelectionModal } from '@/components/reports/IntegrationSelectionModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

type Dashboard = {
  id: string
  name: string
  description?: string
  background_color: string
  font_family: string
  font_size: number
  grid_size: number
  elements: any[]
  datasources: any[]
  filters: any[]
  refresh_rate: number
  is_realtime: boolean
  is_default: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const disabled = !!currentSpace && (currentSpace.features?.dashboard === false || (currentSpace as any).enable_dashboard === false)
  const [defaultDashboard, setDefaultDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)

  const loadDefaultDashboard = async () => {
    if (disabled) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '1',
        ...(currentSpace?.id && { space_id: currentSpace.id })
      })

      const response = await fetch(`/api/dashboards?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboards')
      }

      const data = await response.json()
      const dashboards = data.dashboards || []

      // Find default dashboard for current space
      const defaultDash = dashboards.find((d: Dashboard) => d.is_default)
      setDefaultDashboard(defaultDash || null)
    } catch (error) {
      console.error('Error loading default dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    if (disabled) return
    try {
      setRefreshing(true)
      await loadDefaultDashboard()
      toast.success('Dashboard refreshed')
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  const exportToExcel = async () => {
    if (!defaultDashboard || disabled) return

    try {
      const response = await fetch(`/api/dashboards/${defaultDashboard.id}/export/excel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export dashboard')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${defaultDashboard.name}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Dashboard exported to Excel')
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
    }
  }

  const exportToPDF = async () => {
    if (!defaultDashboard) return

    try {
      const response = await fetch(`/api/dashboards/${defaultDashboard.id}/export/pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export dashboard')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to export dashboard')
      }

      // Download from S3 using presigned URL
      const { downloadPDFFromS3 } = await import('@/lib/s3-download')
      await downloadPDFFromS3(data.key, data.bucket, data.filename)

      toast.success('Dashboard exported to PDF')
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
    }
  }

  useEffect(() => {
    if (currentSpace?.id && !disabled) {
      loadDefaultDashboard()
    }
  }, [currentSpace?.id, disabled])

  // Auto-refresh if real-time is enabled
  useEffect(() => {
    if (defaultDashboard?.is_realtime && defaultDashboard.refresh_rate > 0) {
      const interval = setInterval(() => {
        if (isPlaying) {
          refreshDashboard()
        }
      }, defaultDashboard.refresh_rate * 1000)

      return () => clearInterval(interval)
    }
  }, [defaultDashboard?.is_realtime, defaultDashboard?.refresh_rate, isPlaying])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            {disabled ? (
              <p className="text-muted-foreground">This feature is disabled for the current space.</p>
            ) : (
              <p className="text-muted-foreground">
                {defaultDashboard
                  ? `Welcome to ${defaultDashboard.name}`
                  : 'Welcome to your Unified Data Platform'
                }
              </p>
            )}
          </div>
          {!disabled && (
            <div className="flex items-center space-x-2">
              {defaultDashboard && (
                <>
                  {defaultDashboard.is_realtime && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDashboard}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboards/${defaultDashboard.id}/builder`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToExcel}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create/Import
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/dashboards')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowIntegrationModal(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Import from External
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {defaultDashboard ? (
          <>
            {/* Dashboard Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Elements</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{defaultDashboard.elements.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                  <Table className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{defaultDashboard.datasources.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Filters</CardTitle>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{defaultDashboard.filters.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Refresh Rate</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {defaultDashboard.is_realtime ? 'Real-time' : `${defaultDashboard.refresh_rate}s`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Canvas */}
            <Card>
              <CardContent className="p-6">
                <div
                  className="relative min-h-96 bg-background rounded-lg shadow-lg"
                  style={{
                    backgroundColor: defaultDashboard.background_color,
                    fontFamily: defaultDashboard.font_family,
                    fontSize: `${defaultDashboard.font_size}px`
                  }}
                >
                  {defaultDashboard.elements.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No elements added</h3>
                        <p className="text-muted-foreground mb-4">
                          This dashboard doesn't have any elements yet.
                        </p>
                        <Button onClick={() => router.push(`/dashboards/${defaultDashboard.id}/builder`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Add Elements
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      {defaultDashboard.elements
                        .filter(element => element.is_visible)
                        .sort((a, b) => a.z_index - b.z_index)
                        .map((element) => (
                          <div
                            key={element.id}
                            className="absolute border border-border rounded-lg shadow-lg bg-card"
                            style={{
                              left: `${(element.position_x / defaultDashboard.grid_size) * 100}%`,
                              top: `${(element.position_y / defaultDashboard.grid_size) * 100}%`,
                              width: `${(element.width / defaultDashboard.grid_size) * 100}%`,
                              height: `${(element.height / defaultDashboard.grid_size) * 100}%`,
                              zIndex: element.z_index,
                              ...element.style
                            }}
                          >
                            <div className="w-full h-full p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-sm">{element.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {element.type}
                                </Badge>
                              </div>
                              {/* Placeholder for actual chart/table content */}
                              <div className="mt-4 flex items-center justify-center h-20 bg-muted rounded border-2 border-dashed border-border">
                                <div className="text-center text-gray-500">
                                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-xs">{element.name}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* No Dashboard Available Placeholder */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Dashboard Available</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                There are no dashboards configured for this space yet. Create your first dashboard to start visualizing your data.
              </p>
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create/Import Dashboard
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem onClick={() => router.push('/dashboards')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowIntegrationModal(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Import from External
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={() => router.push('/dashboards')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Dashboards
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <IntegrationSelectionModal
          open={showIntegrationModal}
          onOpenChange={setShowIntegrationModal}
          spaceId={currentSpace?.id}
          onSuccess={() => {
            setShowIntegrationModal(false)
            loadDefaultDashboard()
          }}
        />
      </div>
    </MainLayout>
  )
}
