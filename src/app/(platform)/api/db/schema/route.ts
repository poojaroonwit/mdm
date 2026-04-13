import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    // Get all tables in the public schema
    const tablesResult = await query(`
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const tables = []

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name

      // Get columns for this table
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName])

      tables.push({
        name: tableName,
        columns: columnsResult.rows.map(col => ({
          name: col.column_name,
          type: col.data_type.toUpperCase(),
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        }))
      })
    }

    // Get custom functions (if any)
    const functionsResult = await query(`
      SELECT 
        routine_name as function_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)

    const functions = functionsResult.rows.map(row => row.function_name)

  return NextResponse.json({
    tables,
    functions
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/db/schema')

