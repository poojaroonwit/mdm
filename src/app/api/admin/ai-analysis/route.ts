import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma, query } from '@/lib/db'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { retrieveCredentials } from '@/shared/lib/security/credential-manager'
import { createExternalClient, type ExternalDbType } from '@/lib/external-db'
import OpenAI from 'openai'
import {
  Agent,
  createMCPToolStaticFilter,
  MCPServerSSE,
  MCPServerStdio,
  MCPServerStreamableHttp,
  OpenAIProvider,
  Runner,
  tool,
} from '@openai/agents'
import { z } from 'zod'

const chartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
})

const analysisOutputSchema = z.object({
  title: z.string(),
  response: z.string(),
  insights: z.array(z.string()).max(6).default([]),
  analysis: z.object({
    type: z.enum(['text', 'table', 'chart', 'image']).default('text'),
    data: z.record(z.string(), z.unknown()).default({}),
  }).nullable().default(null),
})

const providerPlanSchema = z.object({
  requiresDatabaseQuery: z.boolean().default(false),
  databaseQuery: z.string().nullable().optional(),
  mcpCalls: z.array(z.object({
    serverName: z.string(),
    toolName: z.string(),
    arguments: z.record(z.string(), z.unknown()).default({}),
  })).max(2).default([]),
})

type AnalysisOutput = z.infer<typeof analysisOutputSchema>
type ProviderPlan = z.infer<typeof providerPlanSchema>

type MCPConfig = {
  id?: string
  name?: string
  url?: string
  command?: string
  args?: string[]
  transport?: 'hosted' | 'http-sse' | 'stdio'
  enabled?: boolean
  toolFilter?: string[]
  cache?: boolean
}

function toMcpToolFilter(toolFilter?: string[]) {
  if (!toolFilter || toolFilter.length === 0) {
    return undefined
  }

  return createMCPToolStaticFilter({ allowed: toolFilter })
}

async function getProviderApiKey(
  provider: string
): Promise<{ apiKey: string | null; baseUrl?: string | null; customHeaders?: Record<string, string> | null }> {
  const providerConfig = await prisma.aIProviderConfig.findFirst({
    where: {
      provider,
      isConfigured: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (!providerConfig?.apiKey) {
    return {
      apiKey: null,
      baseUrl: providerConfig?.baseUrl,
      customHeaders: (providerConfig?.customHeaders as Record<string, string> | null) || null,
    }
  }

  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'

  if (useVault && providerConfig.apiKey.startsWith('vault://')) {
    const apiKey = await secretsManager.getApiKey(provider)
    return {
      apiKey,
      baseUrl: providerConfig.baseUrl,
      customHeaders: (providerConfig.customHeaders as Record<string, string> | null) || null,
    }
  }

  return {
    apiKey: decryptApiKey(providerConfig.apiKey),
    baseUrl: providerConfig.baseUrl,
    customHeaders: (providerConfig.customHeaders as Record<string, string> | null) || null,
  }
}

function resolveOpenAIModelName(modelRecord: any, requestModel: any): string {
  const candidates = [
    requestModel?.apiModel,
    requestModel?.model,
    requestModel?.name,
    modelRecord?.name,
  ].filter(Boolean) as string[]

  const aliasMap: Record<string, string> = {
    'gpt-4o': 'gpt-4o',
    'gpt 4o': 'gpt-4o',
    'gpt-4o mini': 'gpt-4o-mini',
    'gpt 4o mini': 'gpt-4o-mini',
    'gpt-4.1': 'gpt-4.1',
    'gpt 4.1': 'gpt-4.1',
    'gpt-4.1 mini': 'gpt-4.1-mini',
    'gpt 4.1 mini': 'gpt-4.1-mini',
    'gpt-3.5 turbo': 'gpt-3.5-turbo',
    'gpt 3.5 turbo': 'gpt-3.5-turbo',
  }

  for (const candidate of candidates) {
    const normalized = candidate.trim().toLowerCase()
    if (aliasMap[normalized]) {
      return aliasMap[normalized]
    }
    if (candidate.startsWith('gpt-')) {
      return candidate
    }
  }

  return 'gpt-4o-mini'
}

function resolveProviderModelName(provider: string, modelRecord: any, requestModel: any): string {
  const candidates = [
    requestModel?.apiModel,
    requestModel?.model,
    requestModel?.name,
    modelRecord?.name,
  ].filter(Boolean) as string[]

  const aliasMaps: Record<string, Record<string, string>> = {
    openai: {
      'gpt-4o': 'gpt-4o',
      'gpt 4o': 'gpt-4o',
      'gpt-4o mini': 'gpt-4o-mini',
      'gpt 4o mini': 'gpt-4o-mini',
      'gpt-4.1': 'gpt-4.1',
      'gpt 4.1': 'gpt-4.1',
      'gpt-4.1 mini': 'gpt-4.1-mini',
      'gpt 4.1 mini': 'gpt-4.1-mini',
      'gpt-3.5 turbo': 'gpt-3.5-turbo',
      'gpt 3.5 turbo': 'gpt-3.5-turbo',
    },
    anthropic: {
      'claude 3.5 sonnet': 'claude-3-5-sonnet-latest',
      'claude-3-5-sonnet': 'claude-3-5-sonnet-latest',
      'claude 3 haiku': 'claude-3-haiku-20240307',
      'claude-3-haiku': 'claude-3-haiku-20240307',
    },
    google: {
      'gemini pro': 'gemini-1.5-pro',
      'gemini-pro': 'gemini-1.5-pro',
      'gemini pro vision': 'gemini-1.5-pro',
      'gemini-pro-vision': 'gemini-1.5-pro',
    },
    cohere: {
      command: 'command-r-plus',
      'command-r': 'command-r',
      'command-r-plus': 'command-r-plus',
    },
    huggingface: {
      'llama 2 70b': 'meta-llama/Llama-2-70b-chat-hf',
      'llama-2-70b': 'meta-llama/Llama-2-70b-chat-hf',
    },
  }

  for (const candidate of candidates) {
    const trimmed = candidate.trim()
    const normalized = trimmed.toLowerCase()
    const aliased = aliasMaps[provider]?.[normalized]
    if (aliased) {
      return aliased
    }
    if (trimmed.includes('/') || trimmed.includes('gpt-') || trimmed.startsWith('claude-') || trimmed.startsWith('gemini-')) {
      return trimmed
    }
  }

  if (provider === 'anthropic') return 'claude-3-5-sonnet-latest'
  if (provider === 'google') return 'gemini-1.5-pro'
  if (provider === 'cohere') return 'command-r-plus'
  if (provider === 'huggingface') return 'meta-llama/Llama-2-70b-chat-hf'
  return resolveOpenAIModelName(modelRecord, requestModel)
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Provider returned an empty response')
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

async function parseProviderJsonResponse<T>(promise: Promise<string>, schema: z.ZodSchema<T>): Promise<T> {
  const rawText = await promise
  const jsonText = extractJsonFromText(rawText)
  return schema.parse(JSON.parse(jsonText))
}

async function resolveDatabaseConnection(connectionId: string, userId: string) {
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

async function runReadonlyDatabaseQuery(
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

async function getDatabaseSchemaSnapshot(
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

function createDatabaseTools(connection: Awaited<ReturnType<typeof resolveDatabaseConnection>>) {
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

async function buildMcpServers(mcpServers: MCPConfig[]) {
  const servers: Array<any> = []

  for (const server of mcpServers || []) {
    if (!server?.enabled) continue

    if (server.transport === 'stdio' && server.command) {
      servers.push(new MCPServerStdio({
        command: server.command,
        args: server.args || [],
        name: server.name || 'MCP Server',
        cacheToolsList: server.cache !== false,
        toolFilter: toMcpToolFilter(server.toolFilter),
      }))
      continue
    }

    if (server.transport === 'http-sse' && server.url) {
      servers.push(new MCPServerSSE({
        url: server.url,
        name: server.name || 'MCP Server',
        cacheToolsList: server.cache !== false,
        toolFilter: toMcpToolFilter(server.toolFilter),
      }))
      continue
    }

    if (server.url) {
      servers.push(new MCPServerStreamableHttp({
        url: server.url,
        name: server.name || 'MCP Server',
        cacheToolsList: server.cache !== false,
        toolFilter: toMcpToolFilter(server.toolFilter),
      }))
    }
  }

  await Promise.all(servers.map((server) => server.connect()))
  return servers
}

async function buildMcpCatalog(servers: Array<any>) {
  const catalog = await Promise.all(
    servers.map(async (server) => ({
      serverName: server.name,
      tools: (await server.listTools()).slice(0, 12).map((toolDef: any) => ({
        name: toolDef.name,
        description: toolDef.description || '',
        required: toolDef.inputSchema?.required || [],
      })),
    }))
  )

  return catalog.filter((server) => server.tools.length > 0)
}

async function executeMcpCalls(
  servers: Array<any>,
  calls: ProviderPlan['mcpCalls']
) {
  const results: Array<Record<string, unknown>> = []

  for (const call of calls.slice(0, 2)) {
    const server = servers.find((candidate) => candidate.name === call.serverName)
    if (!server) {
      results.push({
        serverName: call.serverName,
        toolName: call.toolName,
        error: 'Server not found',
      })
      continue
    }

    try {
      const toolResult = await server.callTool(call.toolName, call.arguments || {})
      results.push({
        serverName: call.serverName,
        toolName: call.toolName,
        arguments: call.arguments || {},
        result: toolResult,
      })
    } catch (error) {
      results.push({
        serverName: call.serverName,
        toolName: call.toolName,
        arguments: call.arguments || {},
        error: error instanceof Error ? error.message : 'MCP tool call failed',
      })
    }
  }

  return results
}

async function callTextGenerationProvider(params: {
  provider: string
  apiKey: string
  baseUrl?: string | null
  customHeaders?: Record<string, string> | null
  model: string
  systemPrompt: string
  userPrompt: string
}) {
  const {
    provider,
    apiKey,
    baseUrl,
    customHeaders,
    model,
    systemPrompt,
    userPrompt,
  } = params

  const headers: Record<string, string> = {
    ...(customHeaders || {}),
  }

  if (provider === 'anthropic') {
    const response = await fetch(baseUrl || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        ...headers,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || 'Anthropic request failed')
    }

    return (data?.content || [])
      .map((item: any) => item?.text)
      .filter(Boolean)
      .join('\n')
  }

  if (provider === 'google') {
    const base = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'
    const response = await fetch(`${base.replace(/\/$/, '')}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Google AI request failed')
    }

    return (data?.candidates?.[0]?.content?.parts || [])
      .map((part: any) => part?.text)
      .filter(Boolean)
      .join('\n')
  }

  if (provider === 'cohere') {
    const response = await fetch(baseUrl || 'https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        ...headers,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.message || 'Cohere request failed')
    }

    return data?.message?.content?.map((item: any) => item?.text).filter(Boolean).join('\n') || data?.text || ''
  }

  if (provider === 'huggingface') {
    const endpoint = baseUrl || 'https://router.huggingface.co/v1/chat/completions'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        ...headers,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error?.message || data?.error || 'Hugging Face request failed')
    }

    return data?.choices?.[0]?.message?.content || ''
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}

async function runNonOpenAIAnalysis(params: {
  provider: string
  apiKey: string
  baseUrl?: string | null
  customHeaders?: Record<string, string> | null
  modelName: string
  userQuery: string
  attachments: any[]
  preferGraphResponses: boolean
  connection: Awaited<ReturnType<typeof resolveDatabaseConnection>>
  connectedMcpServers: Array<any>
}) {
  const {
    provider,
    apiKey,
    baseUrl,
    customHeaders,
    modelName,
    userQuery,
    attachments,
    preferGraphResponses,
    connection,
    connectedMcpServers,
  } = params

  const attachmentSummary = attachments.length > 0
    ? attachments.map((attachment: any) => ({
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
    }))
    : []

  const databaseSnapshot = await getDatabaseSchemaSnapshot(connection)
  const mcpCatalog = await buildMcpCatalog(connectedMcpServers)

  const plan = await parseProviderJsonResponse(
    callTextGenerationProvider({
      provider,
      apiKey,
      baseUrl,
      customHeaders,
      model: modelName,
      systemPrompt: [
        'You are planning tool usage for an AI analyst.',
        'Return JSON only.',
        'Choose whether one read-only SQL query is needed.',
        'Choose up to two MCP tool calls only if clearly helpful.',
        'Only use SELECT or WITH statements for databaseQuery.',
      ].join('\n'),
      userPrompt: [
        `User question:\n${userQuery}`,
        attachmentSummary.length > 0 ? `Attachments:\n${JSON.stringify(attachmentSummary, null, 2)}` : 'No attachments.',
        databaseSnapshot ? `Database schema snapshot:\n${JSON.stringify(databaseSnapshot, null, 2)}` : 'No database connection.',
        mcpCatalog.length > 0 ? `Available MCP tools:\n${JSON.stringify(mcpCatalog, null, 2)}` : 'No MCP tools available.',
        `Return JSON with this shape:\n${JSON.stringify({
          requiresDatabaseQuery: false,
          databaseQuery: null,
          mcpCalls: [{ serverName: 'server', toolName: 'tool', arguments: {} }],
        }, null, 2)}`,
      ].join('\n\n'),
    }),
    providerPlanSchema
  )

  const databaseResult = connection && plan.requiresDatabaseQuery && plan.databaseQuery
    ? await runReadonlyDatabaseQuery(connection, plan.databaseQuery)
    : null
  const mcpResults = plan.mcpCalls.length > 0
    ? await executeMcpCalls(connectedMcpServers, plan.mcpCalls)
    : []

  const output = await parseProviderJsonResponse(
    callTextGenerationProvider({
      provider,
      apiKey,
      baseUrl,
      customHeaders,
      model: modelName,
      systemPrompt: [
        'You are an AI analyst embedded inside a marketplace plugin.',
        'Return JSON only.',
        'Answer clearly and directly.',
        preferGraphResponses
          ? 'Prefer chart output over plain text when the data naturally fits a visualization.'
          : 'Use chart output only when the user explicitly asks for a graph or chart.',
        'For chart output, return labels plus one or more numeric datasets.',
        'For table output, return concise columns and rows only.',
        'If there is not enough structured data for a chart or table, return a text analysis.',
        'Keep insights short and actionable.',
      ].join('\n'),
      userPrompt: [
        `User question:\n${userQuery}`,
        attachmentSummary.length > 0 ? `Attachments:\n${JSON.stringify(attachmentSummary, null, 2)}` : 'No attachments.',
        databaseSnapshot ? `Database schema snapshot:\n${JSON.stringify(databaseSnapshot, null, 2)}` : 'No database connection.',
        databaseResult ? `Database query result:\n${JSON.stringify(databaseResult, null, 2)}` : 'No database query result.',
        mcpResults.length > 0 ? `MCP tool results:\n${JSON.stringify(mcpResults, null, 2)}` : 'No MCP tool results.',
        `Return JSON with this shape:\n${JSON.stringify({
          title: 'Analysis Title',
          response: 'Short answer',
          insights: ['Insight 1'],
          analysis: {
            type: 'text',
            data: {},
          },
        }, null, 2)}`,
      ].join('\n\n'),
    }),
    analysisOutputSchema
  )

  return normalizeAnalysis(output)
}

function normalizeAnalysis(output: AnalysisOutput): AnalysisOutput {
  if (!output.analysis) {
    return output
  }

  if (output.analysis.type === 'chart') {
    const labels = Array.isArray(output.analysis.data?.labels) ? output.analysis.data.labels : []
    const datasets = Array.isArray(output.analysis.data?.datasets) ? output.analysis.data.datasets : []
    const chartType = typeof output.analysis.data?.chartType === 'string'
      ? output.analysis.data.chartType
      : undefined

    const safeDatasets = datasets
      .map((dataset: any) => chartDatasetSchema.safeParse(dataset))
      .filter((result) => result.success)
      .map((result) => result.data)

    if (labels.length > 0 && safeDatasets.length > 0) {
      return {
        ...output,
        analysis: {
          type: 'chart',
          data: {
            chartType: ['line', 'pie'].includes(chartType)
              ? chartType
              : 'bar',
            labels,
            datasets: safeDatasets,
          },
        },
      }
    }
  }

  if (output.analysis.type === 'table') {
    const columns = Array.isArray(output.analysis.data?.columns) ? output.analysis.data.columns : []
    const rows = Array.isArray(output.analysis.data?.rows) ? output.analysis.data.rows : []
    return {
      ...output,
      analysis: {
        type: 'table',
        data: {
          columns,
          rows,
        },
      },
    }
  }

  return output
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    query: userQuery,
    modelId,
    model: requestModel,
    attachments = [],
    mcpServers = [],
    installationId,
    databaseConnectionId,
    preferGraphResponses = true,
  } = body

  if (!userQuery || !String(userQuery).trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  if (!modelId) {
    return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
  }

  const modelRecord = await prisma.aIModel.findUnique({
    where: { id: modelId },
  })

  if (!modelRecord) {
    return NextResponse.json({ error: 'Selected model was not found' }, { status: 404 })
  }

  let apiKey: string | null = null
  let baseUrl: string | null | undefined = null
  let customHeaders: Record<string, string> | null | undefined = null

  if (installationId) {
    const installationCredentials = await retrieveCredentials(`installation:${installationId}`)
    if (installationCredentials?.apiKey) {
      apiKey = installationCredentials.apiKey
    }
  }

  if (!apiKey) {
    const providerSecrets = await getProviderApiKey(modelRecord.provider)
    apiKey = providerSecrets.apiKey
    baseUrl = providerSecrets.baseUrl
    customHeaders = providerSecrets.customHeaders
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: `No ${modelRecord.provider} API key is configured. Save one in the plugin settings or Admin API Configuration.` },
      { status: 400 }
    )
  }

  const connection = databaseConnectionId
    ? await resolveDatabaseConnection(databaseConnectionId, session.user.id)
    : null

  const connectedMcpServers = await buildMcpServers(mcpServers)

  try {
    if (modelRecord.provider === 'openai') {
      const openAIClient = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
      })

      const modelName = resolveProviderModelName(modelRecord.provider, modelRecord, requestModel)
      const runner = new Runner({
        modelProvider: new OpenAIProvider({
          openAIClient,
          apiKey,
          baseURL: baseUrl || undefined,
        }),
        tracingDisabled: true,
      })

      const tools = createDatabaseTools(connection)
      const attachmentSummary = attachments.length > 0
        ? attachments.map((attachment: any) => ({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
        }))
        : []

      const agent = new Agent({
        name: 'Marketplace AI Analyst',
        instructions: [
          'You are an AI analyst embedded inside a marketplace plugin.',
          'Answer clearly and directly.',
          'If a configured database connection exists and the question needs data, inspect schema first and then run only the minimum read-only SQL needed.',
          'If MCP servers are available, use them when they materially improve the answer.',
          'When numeric data supports it and the user is asking for trends, comparisons, rankings, or distributions, produce a chart analysis object.',
          preferGraphResponses
            ? 'Prefer chart output over plain text when the data naturally fits a visualization.'
            : 'Use chart output only when the user explicitly asks for a graph or chart.',
          'For chart output, return labels plus one or more numeric datasets.',
          'For table output, return concise columns and rows only.',
          'If there is not enough structured data for a chart or table, return a text analysis.',
          'Keep insights short and actionable.',
        ].join('\n'),
        model: modelName,
        tools,
        mcpServers: connectedMcpServers,
        outputType: analysisOutputSchema,
      })

      const prompt = [
        `User question:\n${String(userQuery).trim()}`,
        attachmentSummary.length > 0
          ? `Attachments:\n${JSON.stringify(attachmentSummary, null, 2)}`
          : '',
        connection
          ? `Database connection available:\n${JSON.stringify({
            id: connection.id,
            name: connection.name,
            dbType: connection.dbType,
            database: connection.database,
          }, null, 2)}`
          : 'No database connection is configured for this run.',
        connectedMcpServers.length > 0
          ? `MCP servers connected: ${connectedMcpServers.map((server: any) => server.name).join(', ')}`
          : 'No MCP servers connected.',
      ].filter(Boolean).join('\n\n')

      const result = await runner.run(agent, prompt, {
        maxTurns: 8,
      })

      const finalOutput = normalizeAnalysis(analysisOutputSchema.parse(result.finalOutput))
      return NextResponse.json(finalOutput)
    }

    const modelName = resolveProviderModelName(modelRecord.provider, modelRecord, requestModel)
    const finalOutput = await runNonOpenAIAnalysis({
      provider: modelRecord.provider,
      apiKey,
      baseUrl,
      customHeaders,
      modelName,
      userQuery: String(userQuery).trim(),
      attachments,
      preferGraphResponses,
      connection,
      connectedMcpServers,
    })

    return NextResponse.json(finalOutput)
  } finally {
    await Promise.allSettled(
      connectedMcpServers.map((server) => server.close())
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/ai-analysis')
