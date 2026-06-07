import { db as prisma } from '@/lib/db'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import {
  analysisOutputSchema,
  normalizeAnalysis,
  parseProviderJsonResponse,
  providerPlanSchema,
} from './ai-analysis-schemas'
import { buildMcpCatalog, executeMcpCalls } from './ai-analysis-mcp'
import {
  getDatabaseSchemaSnapshot,
  resolveDatabaseConnection,
  runReadonlyDatabaseQuery,
} from './ai-analysis-database'
export async function getProviderApiKey(
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

export async function runNonOpenAIAnalysis(params: {
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


