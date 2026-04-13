import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; datasourceId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, datasourceId } = await params
    const body = await request.json()
    const { filters = {}, limit = 1000, offset = 0 } = body

    // Get datasource configuration
    const { rows: datasources } = await query(`
      SELECT * FROM dashboard_datasources 
      WHERE id = $1::uuid AND dashboard_id = $2::uuid AND is_active = true
    `, [datasourceId, id])

    if (datasources.length === 0) {
      return NextResponse.json({ error: 'Datasource not found' }, { status: 404 })
    }

    const datasource = datasources[0]
    let data: any[] = []
    let total = 0

    switch (datasource.source_type) {
      case 'DATA_MODEL':
        // Query data from data model
        if (datasource.source_id) {
          const { rows: dataModel } = await query(`
            SELECT dm.*, s.name as space_name
            FROM data_models dm
            JOIN data_model_spaces dms ON dms.data_model_id = dm.id
            JOIN spaces s ON s.id = dms.space_id
            WHERE dm.id = $1::uuid AND dm.deleted_at IS NULL
          `, [datasource.source_id])

          if (dataModel.length > 0) {
            const model = dataModel[0]
            
            // Get data records for this model
            const { rows: records } = await query(`
              SELECT der.*, de.name as entity_name
              FROM data_entity_records der
              JOIN data_entities de ON de.id = der.data_entity_id
              WHERE de.data_model_id = $1::uuid AND der.deleted_at IS NULL
              ORDER BY der.created_at DESC
              LIMIT $2 OFFSET $3
            `, [datasource.source_id, limit, offset])

            // Get total count
            const { rows: countRows } = await query(`
              SELECT COUNT(*)::int as total
              FROM data_entity_records der
              JOIN data_entities de ON de.id = der.data_entity_id
              WHERE de.data_model_id = $1::uuid AND der.deleted_at IS NULL
            `, [datasource.source_id])

            data = records
            total = countRows[0]?.total || 0
          }
        }
        break

      case 'ASSIGNMENT':
        // Query assignment data
        if (datasource.source_id) {
          const { rows: assignments } = await query(`
            SELECT a.*, u.name as assigned_user_name, c.name as company_name
            FROM assignments a
            LEFT JOIN users u ON u.id = a.assigned_user_id
            LEFT JOIN companies c ON c.id = a.company_id
            WHERE a.id = $1::uuid AND a.deleted_at IS NULL
            LIMIT $2 OFFSET $3
          `, [datasource.source_id, limit, offset])

          // Get total count
          const { rows: countRows } = await query(`
            SELECT COUNT(*)::int as total
            FROM assignments
            WHERE id = $1::uuid AND deleted_at IS NULL
          `, [datasource.source_id])

          data = assignments
          total = countRows[0]?.total || 0
        }
        break

      case 'CUSTOM_QUERY':
        // Execute custom query (be careful with this in production)
        if (datasource.query_config?.query) {
          try {
            const { rows: customData } = await query(
              datasource.query_config.query,
              []
            )
            data = customData
            total = customData.length
          } catch (queryError) {
            console.error('Custom query error:', queryError)
            return NextResponse.json({ error: 'Invalid custom query' }, { status: 400 })
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Unsupported datasource type' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total
    })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/dashboards/[id]/datasources/[datasourceId]/data/route.ts')