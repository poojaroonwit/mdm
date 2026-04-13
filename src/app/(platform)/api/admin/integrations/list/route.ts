import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = `
      SELECT 
        id,
        type,
        type as name,
        status,
        config,
        is_enabled as "isEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM platform_integrations
      WHERE deleted_at IS NULL
      ORDER BY type ASC
    `

    const result = await query(sql)

    return NextResponse.json({
      integrations: result.rows || [],
    })
  } catch (error: any) {
    console.error('Error fetching integrations list:', error)

    // If table doesn't exist or column doesn't exist, return empty array (graceful degradation)
    if (
      error.message?.includes('does not exist') ||
      error.code === '42P01' ||
      error.meta?.code === '42P01' ||
      error.code === '42703' ||
      error.meta?.code === '42703'
    ) {
      return NextResponse.json({ integrations: [] })
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch integrations',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/integrations/list',
)


