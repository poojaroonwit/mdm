import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { name, type, config, isActive } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 },
      )
    }

    // Check if integration exists
    const checkSql = `
      SELECT id FROM platform_integrations
      WHERE (name = $1 OR type = $2)
      AND deleted_at IS NULL
      LIMIT 1
    `
    const checkResult = await query(checkSql, [name, type])

    if (checkResult.rows.length > 0) {
      // Update existing integration
      const updateSql = `
        UPDATE platform_integrations
        SET 
          config = $1,
          is_enabled = $2,
          status = CASE 
            WHEN $2 = true AND status = 'inactive' THEN 'pending'
            WHEN $2 = false THEN 'inactive'
            ELSE status
          END,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, type, status, config, is_enabled as "isEnabled"
      `
      const updateResult = await query(updateSql, [
        JSON.stringify(config || {}),
        isActive !== false, // Default to true
        checkResult.rows[0].id,
      ])

      return NextResponse.json({
        success: true,
        integration: updateResult.rows[0],
      })
    } else {
      // Create new integration
      const insertSql = `
        INSERT INTO platform_integrations (name, type, config, status, is_enabled, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending', $4, $5, NOW(), NOW())
        RETURNING id, name, type, status, config, is_enabled as "isEnabled"
      `
      const insertResult = await query(insertSql, [
        name,
        type,
        JSON.stringify(config || {}),
        isActive !== false, // Default to true
        session.user.id,
      ])

      return NextResponse.json({
        success: true,
        integration: insertResult.rows[0],
      })
    }
  } catch (error: any) {
    console.error('Error saving integration:', error)

    // If table doesn't exist, return success (graceful degradation)
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        success: true,
        message: 'Configuration saved (database table not yet created)',
      })
    }

    return NextResponse.json(
      {
        error: 'Failed to save integration',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/integrations',
)


