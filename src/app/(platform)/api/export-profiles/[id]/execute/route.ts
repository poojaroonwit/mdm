import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { query } from '@/lib/db'
import ExcelJS from 'exceljs'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params

    // Get the export profile
    const profileResult = await query(`
      SELECT 
        ep.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', eps.id,
              'sharing_type', eps.sharing_type,
              'target_id', eps.target_id,
              'target_group', eps.target_group
            )
          ) FILTER (WHERE eps.id IS NOT NULL),
          '[]'::json
        ) as sharing_config
      FROM export_profiles ep
      LEFT JOIN export_profile_sharing eps ON ep.id = eps.profile_id
      WHERE ep.id = $1
      GROUP BY ep.id
    `, [profileId])

    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    const profile = profileResult.rows[0]

    // Check if user has access to this profile
    const hasAccess = profile.is_public ||
      profile.created_by === session.user.id ||
      profile.sharing_config.some((share: any) =>
        share.sharing_type === 'all_users' ||
        (share.sharing_type === 'specific_users' && share.target_id === session.user.id)
      )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get data model attributes to build the query
    const attributesResult = await query(`
      SELECT name, display_name, data_type
      FROM attributes 
      WHERE data_model_id = $1
      ORDER BY display_name, name
    `, [profile.data_model])

    const attributes = attributesResult.rows
    const selectedColumns = profile.columns || []

    if (selectedColumns.length === 0) {
      return NextResponse.json({ error: 'No columns selected for export' }, { status: 400 })
    }

    // Build the SQL query based on selected columns and filters
    let selectClause = selectedColumns.map((col: any) => {
      const attr = attributes.find(a => a.name === col)
      return attr ? `${col} as "${attr.display_name || attr.name}"` : col
    }).join(', ')

    let whereClause = ''
    const queryParams: any[] = []
    let paramIndex = 1

    // Apply filters
    if (profile.filters && profile.filters.length > 0) {
      const filterConditions = profile.filters
        .filter((filter: any) => filter.attribute && filter.value)
        .map((filter: any) => {
          const condition = buildFilterCondition(filter, paramIndex)
          paramIndex += 2 // attribute and value
          return condition
        })

      if (filterConditions.length > 0) {
        whereClause = 'WHERE ' + filterConditions.join(' AND ')
      }
    }

    // Get the table name from data model
    const tableName = profile.data_model.toLowerCase()

    const sqlQuery = `
      SELECT ${selectClause}
      FROM ${tableName}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10000
    `

    // Execute the query
    const dataResult = await query(sqlQuery, queryParams)
    const exportData = dataResult.rows

    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No data found matching the criteria' }, { status: 404 })
    }

    // Generate the file based on format
    let fileBuffer: Buffer
    let fileName: string
    let mimeType: string

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Export')

    if (exportData.length > 0) {
      const headers = Object.keys(exportData[0])
      worksheet.addRow(headers)
      exportData.forEach(row => {
        worksheet.addRow(Object.values(row))
      })
    }

    if (profile.format === 'xlsx') {
      fileBuffer = (await workbook.xlsx.writeBuffer()) as any as Buffer
      fileName = `${profile.name}_${new Date().toISOString().split('T')[0]}.xlsx`
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else {
      fileBuffer = (await workbook.csv.writeBuffer()) as any as Buffer
      fileName = `${profile.name}_${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    }

    // Return the file
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Export execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute export' },
      { status: 500 }
    )
  }
}

function buildFilterCondition(filter: any, paramIndex: number): string {
  const { attribute, operator, value } = filter

  switch (operator) {
    case 'equals':
      return `${attribute} = $${paramIndex}`
    case 'not_equals':
      return `${attribute} != $${paramIndex}`
    case 'contains':
      return `${attribute} ILIKE $${paramIndex}`
    case 'starts_with':
      return `${attribute} ILIKE $${paramIndex}`
    case 'gt':
      return `${attribute} > $${paramIndex}`
    case 'lt':
      return `${attribute} < $${paramIndex}`
    default:
      return `${attribute} = $${paramIndex}`
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export-profiles/[id]/execute/route.ts')
