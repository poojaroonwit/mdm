import { query } from '@/lib/db'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createExternalClient, type ExternalDbType } from '@/lib/external-db'
import { tool } from '@openai/agents'
import { z } from 'zod'
export async function resolveDatabaseConnection(connectionId: string, userId: string) {
  const result = await query(
    `SELECT ec.*
     FROM public.external_connections ec
     JOIN space_members sm ON sm.space_id = ec.space_id
     WHERE ec.id = CAST($1 AS uuid)
       AND sm.user_id = CAST($2 AS uuid)
       AND ec.deleted_at IS NULL
     LIMIT 1`,
    [connectionId, userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const connection = result.rows[0]
  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'

  let password = connection.password as string | null

  if (useVault && typeof password === 'string' && password.startsWith('vault://')) {
    const vaultCredentials = await secretsManager.getDatabaseCredentials(connection.id)
    password = vaultCredentials?.password || null
  } else if (password) {
    password = decryptApiKey(password)
  }

  return {
    id: connection.id,
    name: connection.name,
    spaceId: connection.space_id,
    dbType: connection.db_type as ExternalDbType,
    host: connection.host,
    port: connection.port,
    database: connection.database,
    username: connection.username,
    password,
    options: connection.options,
  }
}

function sanitizeReadonlySql(sql: string): string {
  const trimmed = sql.trim().replace(/;+$/, '')
  const lowered = trimmed.toLowerCase()

  if (!trimmed) {
    throw new Error('SQL is required')
  }

  if (!(lowered.startsWith('select') || lowered.startsWith('with'))) {
    throw new Error('Only SELECT or WITH queries are allowed')
  }

  const blocked = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|comment|copy|merge|call|do)\b/i
  if (blocked.test(lowered)) {
    throw new Error('Only read-only SQL is allowed')
  }

  return /limit\s+\d+/i.test(trimmed) ? trimmed : `${trimmed}\nLIMIT 100`
}

export async function runReadonlyDatabaseQuery(
  connection: Awaited<ReturnType<typeof resolveDatabaseConnection>>,
  sql: string
) {
  if (!connection) {
    throw new Error('No database connection is configured')
  }

  const readonlySql = sanitizeReadonlySql(sql)
  const client = await createExternalClient({
    id: connection.id,
    db_type: connection.dbType,
    host: connection.host,
    port: connection.port,
    database: connection.database,
    username: connection.username,
    password: connection.password,
    options: connection.options || null,
  })

  try {
    const result = await client.query(readonlySql)
    const rows = result.rows || []
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    return {
      connection: connection.name,
      rowCount: rows.length,
      columns,
      rows: rows.slice(0, 50),
      sql: readonlySql,
    }
  } finally {
    await client.close()
  }
}

export async function getDatabaseSchemaSnapshot(
  connection: Awaited<ReturnType<typeof resolveDatabaseConnection>>
) {
  if (!connection) {
    return null
  }

  const client = await createExternalClient({
    id: connection.id,
    db_type: connection.dbType,
    host: connection.host,
    port: connection.port,
    database: connection.database,
    username: connection.username,
    password: connection.password,
    options: connection.options || null,
  })

  try {
    const tables = await client.query(
      connection.dbType === 'postgres'
        ? `SELECT table_schema, table_name
           FROM information_schema.tables
           WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
           ORDER BY table_schema, table_name
           LIMIT 20`
        : `SELECT table_schema, table_name
           FROM information_schema.tables
           ORDER BY table_schema, table_name
           LIMIT 20`
    )

    const summary: Array<{ schema: string; table: string; columns: Array<{ name: string; type: string }> }> = []

    for (const row of tables.rows.slice(0, 12)) {
      const schema = row.table_schema || row.TABLE_SCHEMA || 'public'
      const table = row.table_name || row.TABLE_NAME
      const sql = connection.dbType === 'postgres'
        ? `SELECT column_name, data_type
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position
           LIMIT 12`
        : `SELECT column_name, data_type
           FROM information_schema.columns
           WHERE table_schema = ? AND table_name = ?
           ORDER BY ordinal_position
           LIMIT 12`

      const columns = await client.query(sql, [schema, table])
      summary.push({
        schema,
        table,
        columns: columns.rows.map((column: any) => ({
          name: column.column_name || column.COLUMN_NAME,
          type: column.data_type || column.DATA_TYPE || 'unknown',
        })),
      })
    }

    return {
      connection: connection.name,
      dbType: connection.dbType,
      database: connection.database,
      tables: summary,
    }
  } finally {
    await client.close()
  }
}

export function createDatabaseTools(connection: Awaited<ReturnType<typeof resolveDatabaseConnection>>) {
  if (!connection) {
    return []
  }

  const describeDatabaseSchema = tool({
    name: 'describe_database_schema',
    description: 'Inspect schemas, tables, and columns for the configured database connection.',
    parameters: z.object({
      schema: z.string().optional(),
      table: z.string().optional(),
    }),
    execute: async ({ schema, table }) => {
      const client = await createExternalClient({
        id: connection.id,
        db_type: connection.dbType,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        options: connection.options || null,
      })

      try {
        if (schema && table) {
          const sql = connection.dbType === 'postgres'
            ? `SELECT column_name, data_type, is_nullable
               FROM information_schema.columns
               WHERE table_schema = $1 AND table_name = $2
               ORDER BY ordinal_position`
            : `SELECT column_name, data_type, is_nullable
               FROM information_schema.columns
               WHERE table_schema = ? AND table_name = ?
               ORDER BY ordinal_position`

          const result = await client.query(sql, [schema, table])
          return JSON.stringify({
            connection: connection.name,
            schema,
            table,
            columns: result.rows,
          })
        }

        if (connection.dbType === 'postgres') {
          const schemaRows = await client.query(
            `SELECT schema_name
             FROM information_schema.schemata
             WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
             ORDER BY schema_name`
          )

          const summary: Array<{ schema: string; tables: string[] }> = []
          for (const row of schemaRows.rows.slice(0, 8)) {
            const tables = await client.query(
              `SELECT table_name
               FROM information_schema.tables
               WHERE table_schema = $1
               ORDER BY table_name`,
              [row.schema_name]
            )
            summary.push({
              schema: row.schema_name,
              tables: tables.rows.map((item: any) => item.table_name).slice(0, 20),
            })
          }
          return JSON.stringify({ connection: connection.name, schemas: summary })
        }

        const tables = await client.query(
          `SELECT table_schema, table_name
           FROM information_schema.tables
           ORDER BY table_schema, table_name`
        )

        return JSON.stringify({
          connection: connection.name,
          schemas: tables.rows.slice(0, 100),
        })
      } finally {
        await client.close()
      }
    },
  })

  const queryDatabase = tool({
    name: 'query_database',
    description: 'Run a read-only SQL query against the configured database connection.',
    parameters: z.object({
      sql: z.string(),
    }),
    execute: async ({ sql }) => {
      return JSON.stringify(await runReadonlyDatabaseQuery(connection, sql))
    },
  })

  return [describeDatabaseSchema, queryDatabase]
}


