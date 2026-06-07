import { z } from 'zod'
const chartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
})

export const analysisOutputSchema = z.object({
  title: z.string(),
  response: z.string(),
  insights: z.array(z.string()).max(6).default([]),
  analysis: z.object({
    type: z.enum(['text', 'table', 'chart', 'image']).default('text'),
    data: z.record(z.string(), z.unknown()).default({}),
  }).nullable().default(null),
})

export const providerPlanSchema = z.object({
  requiresDatabaseQuery: z.boolean().default(false),
  databaseQuery: z.string().nullable().optional(),
  mcpCalls: z.array(z.object({
    serverName: z.string(),
    toolName: z.string(),
    arguments: z.record(z.string(), z.unknown()).default({}),
  })).max(2).default([]),
})

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>
export type ProviderPlan = z.infer<typeof providerPlanSchema>


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

export function resolveProviderModelName(provider: string, modelRecord: any, requestModel: any): string {
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

export async function parseProviderJsonResponse<T>(promise: Promise<string>, schema: z.ZodSchema<T>): Promise<T> {
  const rawText = await promise
  const jsonText = extractJsonFromText(rawText)
  return schema.parse(JSON.parse(jsonText))
}

export function normalizeAnalysis(output: AnalysisOutput): AnalysisOutput {
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
            chartType: chartType && ['line', 'pie'].includes(chartType)
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

