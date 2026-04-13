import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const rawSpaceId = searchParams.get('space_id')

  if (!rawSpaceId) {
    return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
  }
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const spaceId = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(spaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  // Get layout data for models in the space
  const layoutSql = `
    SELECT 
      dm.id,
      dm.name,
      dm.display_name,
      dm.erd_position_x,
      dm.erd_position_y
    FROM public.data_models dm
    JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
    WHERE dms.space_id = $1 
      AND dm.deleted_at IS NULL
    ORDER BY dm.name
  `

  const { rows } = await query(layoutSql, [spaceId])

  const layout = {
    models: rows.map(row => ({
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      position: {
        x: row.erd_position_x || 100,
        y: row.erd_position_y || 100
      }
    })),
    relationships: [] // Relationships are derived from foreign keys
  }

  return NextResponse.json({ layout })
}













export const GET = withErrorHandling(getHandler, 'GET /api/data-models/layout')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { models, relationships, space_id: rawSpaceId } = body

  if (!rawSpaceId) {
    return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
  }
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const space_id = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(space_id)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

    // Update model positions
    if (models && Array.isArray(models)) {
      for (const model of models) {
        if (model.id && model.position) {
          await query(
            `UPDATE public.data_models 
             SET erd_position_x = $1, erd_position_y = $2, updated_at = NOW()
             WHERE id = $3 AND deleted_at IS NULL`,
            [model.position.x, model.position.y, model.id]
          )
        }
      }
    }

    // Note: Relationships are currently derived from foreign keys in attributes
    // If you want to store custom relationships, you'd need a separate table

  return NextResponse.json({ message: 'Layout saved successfully' })
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-models/layout')
