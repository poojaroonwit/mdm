import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getAllSchedules } from '@/lib/unified-scheduler'

/**
 * Get all schedules across workflows, notebooks, and data syncs
 */
async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || searchParams.get('space_id') || undefined

    const schedules = await getAllSchedules(spaceId)

    return NextResponse.json({
      success: true,
      schedules,
      counts: {
        workflows: schedules.filter((s) => s.type === 'workflow').length,
        notebooks: schedules.filter((s) => s.type === 'notebook').length,
        data_syncs: schedules.filter((s) => s.type === 'data_sync').length
      }
    })
  } catch (error: any) {
    console.error('Error fetching all schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/scheduler/all')
