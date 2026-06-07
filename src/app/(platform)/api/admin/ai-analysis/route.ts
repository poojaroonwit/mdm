import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { retrieveCredentials } from '@/shared/lib/security/credential-manager'
import OpenAI from 'openai'
import { Agent, OpenAIProvider, Runner } from '@openai/agents'
import { createDatabaseTools, resolveDatabaseConnection } from './ai-analysis-database'
import { buildMcpServers } from './ai-analysis-mcp'
import { getProviderApiKey, runNonOpenAIAnalysis } from './ai-analysis-provider'
import { analysisOutputSchema, normalizeAnalysis, resolveProviderModelName } from './ai-analysis-schemas'
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

