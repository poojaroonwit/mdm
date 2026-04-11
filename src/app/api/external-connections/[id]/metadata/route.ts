import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { createExternalClient } from '@/lib/external-db'

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const rawSpaceId = searchParams.get('space_id')
    const schemaParam = searchParams.get('schema')
    const tableParam = searchParams.get('table')

    if (!rawSpaceId) return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
    
    // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
    const spaceId = rawSpaceId.split(':')[0]
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(spaceId)) {
        return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
    }

    // Check access to space
    const { rows: access } = await query(
        'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
        [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get connection details
    const { rows: connections } = await query(
        'SELECT * FROM public.external_connections WHERE id = $1::uuid AND space_id = $2::uuid',
        [id, spaceId]
    )

    if (connections.length === 0) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const connection = connections[0]

    // If it's a database connection, fetch schema information
    if (connection.connection_type === 'database') {
        const secretsManager = getSecretsManager()
        const useVault = secretsManager.getBackend() === 'vault'

        let password = connection.password

        // Retrieve password
        if (useVault && password?.startsWith('vault://')) {
            const secretPath = password.replace('vault://', 'database-connections/')
                .replace('/password', '/credentials')
            // Extract connection ID from path if needed, or just use the constructed path
            // Actually the standard path is database-connections/{id}/credentials
            const vaultPath = `database-connections/${id}/credentials`
            const creds = await secretsManager.getSecret(vaultPath)
            if (creds) {
                password = creds.password
            }
        } else if (password) {
            password = decryptApiKey(password)
        }

        // Connect and fetch metadata use standard createExternalClient
        // Note: We need to handle potential connection errors
        try {
            const client = await createExternalClient({
                id: connection.id,
                db_type: connection.db_type,
                host: connection.host,
                port: connection.port,
                database: connection.database,
                username: connection.username,
                password: password,
                options: connection.options ? JSON.parse(connection.options) : null
            })

            try {
                // If schema and table provided, fetch columns
                if (schemaParam && tableParam) {
                    let columns: any[] = []

                    if (connection.db_type === 'postgres') {
                        const { rows } = await client.query(
                            `SELECT column_name, data_type, is_nullable, column_default
                             FROM information_schema.columns
                             WHERE table_schema = $1 AND table_name = $2
                             ORDER BY ordinal_position`,
                            [schemaParam, tableParam]
                        )
                        columns = rows
                    } else {
                        // MySQL
                        const { rows } = await client.query(
                            `SELECT column_name, data_type, is_nullable, column_default
                             FROM information_schema.columns
                             WHERE table_schema = ? AND table_name = ?
                             ORDER BY ordinal_position`,
                            [schemaParam, tableParam]
                        )
                        columns = rows
                    }

                    return NextResponse.json({
                        columns,
                        table: tableParam,
                        schema: schemaParam,
                        connection: {
                            id: connection.id,
                            name: connection.name,
                            type: connection.db_type
                        }
                    })
                }

                // Otherwise fetch schemas/tables
                let schemas: string[] = []
                let tablesBySchema: Record<string, string[]> = {}

                if (connection.db_type === 'postgres') {
                    const { rows: schemaRows } = await client.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`)
                    schemas = schemaRows.map((r: any) => r.schema_name)

                    // Fetch tables for all schemas (or maybe just public/common ones to optimize?)
                    // For now, let's fetch all as in test route
                    for (const s of schemas) {
                        const { rows: tableRows } = await client.query(
                            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`, [s]
                        )
                        if (tableRows.length > 0) {
                            tablesBySchema[s] = tableRows.map((r: any) => r.table_name)
                        }
                    }
                } else {
                    // MySQL
                    const { rows: tableRows } = await client.query(`SELECT table_schema, table_name FROM information_schema.tables ORDER BY table_schema, table_name`)
                    for (const r of tableRows as any[]) {
                        tablesBySchema[r.table_schema] = tablesBySchema[r.table_schema] || []
                        tablesBySchema[r.table_schema].push(r.table_name)
                    }
                    schemas = Object.keys(tablesBySchema)
                }

                return NextResponse.json({
                    schemas,
                    tablesBySchema,
                    connection: {
                        id: connection.id,
                        name: connection.name,
                        type: connection.db_type
                    }
                })
            } finally {
                await client.close()
            }
        } catch (error: any) {
            console.error('Metadata fetch error:', error)
            return NextResponse.json({ error: `Failed to connect: ${error.message}` }, { status: 500 })
        }
    }

    // API connections don't strictly have "tables", maybe return endpoints if configured?
    // For now return empty for API
    return NextResponse.json({ schemas: [], tablesBySchema: {} })
}

export const GET = withErrorHandling(getHandler, 'GET /api/external-connections/[id]/metadata')
