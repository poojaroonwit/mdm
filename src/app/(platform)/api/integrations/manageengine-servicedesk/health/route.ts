import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'

interface HealthStatus {
  healthy: boolean
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  lastCheck: Date
  error?: string
  details?: {
    connection?: boolean
    apiKey?: boolean
    rateLimit?: any
    syncSchedule?: any
  }
}

/**
 * Health check endpoint for ServiceDesk integration
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const searchParams = request.nextUrl.searchParams
  const spaceId = searchParams.get('space_id')

  if (!spaceId) {
    return NextResponse.json(
      { error: 'space_id is required' },
      { status: 400 }
    )
  }

  const healthStatus: HealthStatus = {
    healthy: false,
    status: 'down',
    lastCheck: new Date(),
    details: {}
  }

  try {
    // Check configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_apikey_value, is_active
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ServiceDesk%'
         AND deleted_at IS NULL
       LIMIT 1`,
      [spaceId]
    )

    if (configRows.length === 0) {
      healthStatus.error = 'ServiceDesk integration not configured'
      healthStatus.details!.connection = false
      return NextResponse.json(healthStatus)
    }

    const config = configRows[0]
    healthStatus.details!.connection = true

    if (!config.is_active) {
      healthStatus.status = 'degraded'
      healthStatus.error = 'ServiceDesk integration is inactive'
      return NextResponse.json(healthStatus)
    }

    // Get service instance
    const service = await getServiceDeskService(spaceId)
    
    if (!service) {
      healthStatus.error = 'ServiceDesk integration not configured or API key invalid'
      healthStatus.details!.apiKey = false
      return NextResponse.json(healthStatus)
    }

    healthStatus.details!.apiKey = true

    const testResult = await service.testConnection()
    const responseTime = Date.now() - startTime

    if (testResult.success) {
      healthStatus.healthy = true
      healthStatus.status = 'healthy'
      healthStatus.responseTime = responseTime
    } else {
      healthStatus.status = 'degraded'
      healthStatus.error = testResult.error || 'Connection test failed'
    }

    // Check rate limit configuration
    try {
      const { rows: rateLimitRows } = await query(
        `SELECT rate_limit_enabled, max_requests_per_minute, max_requests_per_hour, max_requests_per_day
         FROM servicedesk_rate_limits
         WHERE space_id = $1::uuid AND deleted_at IS NULL
         LIMIT 1`,
        [spaceId]
      )

      if (rateLimitRows.length > 0) {
        healthStatus.details!.rateLimit = {
          enabled: rateLimitRows[0].rate_limit_enabled,
          limits: {
            perMinute: rateLimitRows[0].max_requests_per_minute,
            perHour: rateLimitRows[0].max_requests_per_hour,
            perDay: rateLimitRows[0].max_requests_per_day
          }
        }
      }
    } catch (error) {
      // Rate limit table might not exist
    }

    // Check sync schedule
    try {
      const { rows: scheduleRows } = await query(
        `SELECT schedule_type, is_active, last_run_at, last_run_status, next_run_at
         FROM servicedesk_sync_schedules
         WHERE space_id = $1::uuid AND deleted_at IS NULL
         LIMIT 1`,
        [spaceId]
      )

      if (scheduleRows.length > 0) {
        healthStatus.details!.syncSchedule = {
          type: scheduleRows[0].schedule_type,
          active: scheduleRows[0].is_active,
          lastRun: scheduleRows[0].last_run_at,
          lastStatus: scheduleRows[0].last_run_status,
          nextRun: scheduleRows[0].next_run_at
        }
      }
    } catch (error) {
      // Sync schedule table might not exist
    }

    return NextResponse.json(healthStatus, { 
      status: healthStatus.healthy ? 200 : 503 
    })
  } catch (error) {
    healthStatus.error = error instanceof Error ? error.message : 'Unknown error'
    healthStatus.status = 'down'
    return NextResponse.json(healthStatus)
  }
}
