import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const searchParams = request.nextUrl.searchParams
    const rawSpaceId = searchParams.get('space_id')
    const acknowledged = searchParams.get('acknowledged') === 'true'

    if (!rawSpaceId) {
      return NextResponse.json({ error: 'space_id required' }, { status: 400 })
    }
    
    // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
    const spaceId = rawSpaceId.split(':')[0]
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(spaceId)) {
      return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
    }

    let whereClause = `
      WHERE dah.sync_schedule_id IN (
        SELECT id FROM public.data_sync_schedules WHERE space_id = $1::uuid AND deleted_at IS NULL
      )
    `
    const params: any[] = [spaceId]

    if (acknowledged !== undefined) {
      whereClause += ` AND dah.acknowledged = $2`
      params.push(acknowledged)
    }

    const { rows: alerts } = await query(
      `SELECT 
         dah.id,
         dah.sync_schedule_id,
         ds.name as schedule_name,
         dah.alert_type,
         dah.severity,
         dah.message,
         dah.created_at,
         dah.acknowledged
       FROM public.data_sync_alert_history dah
       JOIN public.data_sync_schedules ds ON ds.id = dah.sync_schedule_id
       ${whereClause}
       ORDER BY dah.created_at DESC
       LIMIT 50`,
      params
    )

    return NextResponse.json({ alerts })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/data-sync-schedules/alerts')