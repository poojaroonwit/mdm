'use client'

import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PowerBIEmbedProps {
  embedUrl: string
  accessToken: string
  reportId?: string
  pageName?: string
  filters?: any[]
  height?: string
  className?: string
}

export function PowerBIEmbed({ 
  embedUrl, 
  accessToken, 
  reportId, 
  pageName, 
  filters,
  height = '600px',
  className = ''
}: PowerBIEmbedProps) {
  const embedContainer = useRef<HTMLDivElement>(null)
  const powerbi = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!embedContainer.current || !embedUrl || !accessToken) {
      setError('Missing required parameters: embedUrl or accessToken')
      setLoading(false)
      return
    }

    const loadPowerBI = async () => {
      try {
        // Dynamically import powerbi-client to avoid SSR issues
        const pbi = await import('powerbi-client')
        
        const config: any = {
          type: 'report',
          embedUrl,
          accessToken,
          tokenType: pbi.models.TokenType.Aad,
          settings: {
            panes: {
              filters: { expanded: false, visible: true },
              pageNavigation: { visible: true }
            },
            background: pbi.models.BackgroundType.Transparent,
            layoutType: pbi.models.LayoutType.MobilePortrait
          }
        }

        if (reportId) {
          config.id = reportId
        }

        if (pageName) {
          config.settings = {
            ...config.settings,
            initialPageName: pageName
          }
        }

        if (filters && filters.length > 0) {
          config.filters = filters
        }

        // Embed the report
        powerbi.current = new (pbi.Report as any)(embedContainer.current, config)

        // Handle loaded event
        powerbi.current.on('loaded', () => {
          setLoading(false)
          setError(null)
        })

        // Handle error event
        powerbi.current.on('error', (event: any) => {
          console.error('Power BI embed error:', event)
          setError(event.detail?.message || 'Failed to load Power BI report')
          setLoading(false)
        })

      } catch (err: any) {
        console.error('Error loading Power BI SDK:', err)
        setError(err.message || 'Failed to initialize Power BI embed')
        setLoading(false)
      }
    }

    loadPowerBI()

    return () => {
      if (powerbi.current) {
        try {
          powerbi.current.reset()
        } catch (err) {
          console.error('Error resetting Power BI embed:', err)
        }
      }
    }
  }, [embedUrl, accessToken, reportId, pageName, filters])

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height, minHeight: '400px' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading Power BI report...</p>
          </div>
        </div>
      )}
      <div 
        ref={embedContainer} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '400px',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s'
        }} 
      />
    </div>
  )
}

