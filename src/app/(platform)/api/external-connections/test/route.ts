import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { 
    space_id, connection_type = 'database', db_type, host, port, database, username, password,
    // API fields
    api_url, api_method = 'GET', api_headers, api_auth_type = 'none',
    api_auth_token, api_auth_username, api_auth_password,
    api_auth_apikey_name, api_auth_apikey_value, api_body
  } = body

  if (!space_id) {
    return NextResponse.json({ error: 'space_id required' }, { status: 400 })
  }

  // Access check
  const { rows: access } = await query('SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid', [space_id, session.user.id])
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (connection_type === 'api') {
    // Test API connection
    if (!api_url) {
      return NextResponse.json({ error: 'api_url required for API connections' }, { status: 400 })
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(api_headers || {})
    }

    // Add authentication headers
    if (api_auth_type === 'bearer' && api_auth_token) {
      headers['Authorization'] = `Bearer ${api_auth_token}`
    } else if (api_auth_type === 'basic' && api_auth_username && api_auth_password) {
      const credentials = Buffer.from(`${api_auth_username}:${api_auth_password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (api_auth_type === 'apikey' && api_auth_apikey_name && api_auth_apikey_value) {
      headers[api_auth_apikey_name] = api_auth_apikey_value
    }

    // Build fetch options with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const fetchOptions: RequestInit = {
      method: api_method,
      headers,
      signal: controller.signal
    }
    
    // Clear timeout after fetch completes
    const clearTimeoutOnComplete = () => clearTimeout(timeoutId)

    // Add body for POST, PUT, PATCH
    if ((api_method === 'POST' || api_method === 'PUT' || api_method === 'PATCH') && api_body) {
      try {
        fetchOptions.body = typeof api_body === 'string' ? api_body : JSON.stringify(api_body)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
      }
    }

    // Make API request
    try {
      const response = await fetch(api_url, fetchOptions)
      clearTimeoutOnComplete()
      
      if (!response.ok) {
        return NextResponse.json({ 
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}` 
        }, { status: 200 }) // Return 200 so frontend can show the error
      }

      const responseText = await response.text()
      let data: any = null
      try {
        data = JSON.parse(responseText)
      } catch {
        // Not JSON, use text
        data = responseText.substring(0, 1000)
      }
      
      // Return sample response
      return NextResponse.json({ 
        success: true,
        status: response.status,
        data: data || (responseText ? { raw: responseText.substring(0, 500) } : null),
        sampleResponse: data || responseText.substring(0, 1000)
      })
    } catch (fetchError: any) {
      clearTimeoutOnComplete()
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          success: false,
          error: 'Request timeout: API did not respond within 10 seconds' 
        }, { status: 200 })
      }
      throw fetchError
    }
  }
  
  if (connection_type === 'database') {
    // Test database connection
    if (!db_type || !host) {
      return NextResponse.json({ error: 'db_type, host required for database connections' }, { status: 400 })
    }

    // For test connections, use direct credentials (not from Vault)
    // Test connections use temporary credentials provided by user
    const client = await createExternalClient({
      id: 'temp', db_type, host, port, database, username, password, options: null,
    })
    try {
      // Fetch schemas and tables
      let schemas: string[] = []
      let tablesBySchema: Record<string, string[]> = {}
      if (db_type === 'postgres') {
        const { rows: schemaRows } = await client.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`)
        schemas = schemaRows.map((r: any) => r.schema_name)
        for (const s of schemas) {
          const { rows: tableRows } = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`, [s]
          )
          tablesBySchema[s] = tableRows.map((r: any) => r.table_name)
        }
      } else {
        const { rows: tableRows } = await client.query(`SELECT table_schema, table_name FROM information_schema.tables ORDER BY table_schema, table_name`)
        for (const r of tableRows as any[]) {
          tablesBySchema[r.table_schema] = tablesBySchema[r.table_schema] || []
          tablesBySchema[r.table_schema].push(r.table_name)
        }
        schemas = Object.keys(tablesBySchema)
      }
      return NextResponse.json({ ok: true, schemas, tablesBySchema })
    } finally {
      await client.close()
    }
  }

  return NextResponse.json({ error: 'Invalid connection type' }, { status: 400 })
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const { searchParams } = new URL(request.url)
  const rawSpaceId = searchParams.get('space_id')
  const dbType = searchParams.get('db_type')
  const host = searchParams.get('host')
  const port = searchParams.get('port') ? Number(searchParams.get('port')) : undefined
  const database = searchParams.get('database') || undefined
  const username = searchParams.get('username') || undefined
  const password = searchParams.get('password') || undefined
  const schema = searchParams.get('schema') || undefined
  const table = searchParams.get('table') || undefined

  if (!rawSpaceId || !dbType || !host || !schema || !table) {
    return NextResponse.json({ error: 'space_id, db_type, host, schema, table required' }, { status: 400 })
  }
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const spaceId = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(spaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  const { rows: access } = await query('SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2', [spaceId, session.user.id])
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // For metadata fetch, use direct credentials (not from Vault)
  // Metadata fetch uses temporary credentials provided by user
  const client = await createExternalClient({ id: 'temp', db_type: dbType as any, host: host!, port, database, username, password, options: null })
  try {
    // Columns
    let columns: Array<{ name: string; data_type: string; is_nullable: boolean; is_primary_key: boolean }>
    if (dbType === 'postgres') {
      const { rows } = await client.query(
        `SELECT column_name as name, data_type, is_nullable = 'YES' as is_nullable
         FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [schema, table]
      )
      // Primary keys
      const { rows: pkRows } = await client.query(
        `SELECT a.attname as name
         FROM   pg_index i
         JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
         WHERE  i.indrelid = $1::regclass AND i.indisprimary`,
        [`${schema}.${table}`]
      )
      const pks = new Set(pkRows.map((r: any) => r.name))
      columns = rows.map((r: any) => ({ ...r, is_primary_key: pks.has(r.name) }))
    } else {
      const { rows } = await client.query(
        `SELECT COLUMN_NAME as name, DATA_TYPE as data_type, IS_NULLABLE = 'YES' as is_nullable
         FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [schema, table]
      )
      // Approximate PK info for MySQL (additional query would be needed for exact PK)
      columns = (rows as any[]).map((r: any) => ({ ...r, is_primary_key: false }))
    }
    return NextResponse.json({ ok: true, columns })
  } finally {
    await client.close()
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/external-connections/test')
export const GET = withErrorHandling(getHandler, 'GET /api/external-connections/test')
