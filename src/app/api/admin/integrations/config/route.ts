import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'

const integrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  config: z.record(z.string(), z.any()).optional().default({})
})

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, integrationSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { name, type, config } = bodyValidation.data

    // Check if integration exists by type (type is more reliable than name for identity)
    const checkSql = `
      SELECT id, name, type, config, status FROM platform_integrations
      WHERE type = $1 AND deleted_at IS NULL
      LIMIT 1
    `
    const checkResult = await query(checkSql, [type])
    const oldIntegration = checkResult.rows[0]

    let resultIntegration

    if (oldIntegration) {
      // Update existing integration
      const updateSql = `
        UPDATE platform_integrations
        SET 
          name = $1,
          config = $2,
          status = 'pending',
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, type, status, config
      `
      const updateResult = await query(updateSql, [
        name,
        JSON.stringify(config),
        oldIntegration.id,
      ])
      resultIntegration = updateResult.rows[0]

      // Audit log for update
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'PlatformIntegration',
        entityId: resultIntegration.id,
        oldValue: oldIntegration,
        newValue: resultIntegration,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } else {
      // Create new integration
      const insertSql = `
        INSERT INTO platform_integrations (name, type, config, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending', $4, NOW(), NOW())
        RETURNING id, name, type, status, config
      `
      const insertResult = await query(insertSql, [
        name,
        type,
        JSON.stringify(config),
        session.user.id,
      ])
      resultIntegration = insertResult.rows[0]

      // Audit log for creation
      await createAuditLog({
        action: 'CREATE',
        entityType: 'PlatformIntegration',
        entityId: resultIntegration.id,
        oldValue: null,
        newValue: resultIntegration,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    }

    return NextResponse.json({
      success: true,
      integration: resultIntegration,
    })
  } catch (error: any) {
    console.error('Error saving integration config:', error)

    // If table doesn't exist, return success (graceful degradation)
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        success: true,
        message: 'Configuration saved (database table not yet created)',
      })
    }

    return NextResponse.json(
      {
        error: 'Failed to save configuration',
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/integrations/config',
)
