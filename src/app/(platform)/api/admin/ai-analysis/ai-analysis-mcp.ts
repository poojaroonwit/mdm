import {
  createMCPToolStaticFilter,
  MCPServerSSE,
  MCPServerStdio,
  MCPServerStreamableHttp,
} from '@openai/agents'
import type { ProviderPlan } from './ai-analysis-schemas'

export type MCPConfig = {
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


export async function buildMcpServers(mcpServers: MCPConfig[]) {
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

export async function buildMcpCatalog(servers: Array<any>) {
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

export async function executeMcpCalls(
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

