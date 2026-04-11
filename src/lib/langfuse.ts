import { Langfuse } from 'langfuse'

interface LangfuseConfig {
  publicKey: string
  secretKey: string
  host?: string
}

let cachedConfig: LangfuseConfig | null = null
let configCacheTime: number = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Langfuse configuration from database-backed integrations
 */
async function getLangfuseConfig(): Promise<LangfuseConfig | null> {
  try {
    const { query } = await import('./db')
    
    // Check cache first for DB config
    const now = Date.now()
    if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_TTL) {
      return cachedConfig
    }

    const sql = `
      SELECT config, status, is_enabled
      FROM platform_integrations
      WHERE type = 'langfuse'
        AND deleted_at IS NULL
        AND is_enabled = true
      ORDER BY updated_at DESC
      LIMIT 1
    `

    const result = await query(sql, [], 5000)

    if (result.rows.length > 0) {
      const row = result.rows[0]
      const config = row.config as any
      
      if (config.publicKey && config.secretKey) {
        const dbConfig: LangfuseConfig = {
          publicKey: config.publicKey,
          secretKey: config.secretKey,
          host: config.host || 'https://cloud.langfuse.com'
        }
        
        cachedConfig = dbConfig
        configCacheTime = now
        return dbConfig
      }
    }
  } catch (error) {
    // Ignore DB errors (e.g. during build or if table missing)
  }

  return null
}

let langfuseInstance: Langfuse | null = null
let instanceConfigKey: string = ''

export async function getLangfuseClient(): Promise<Langfuse | null> {
  const config = await getLangfuseConfig()

  if (!config) {
    return null
  }

  // Check if config changed
  const configKey = `${config.publicKey}:${config.host}`
  if (langfuseInstance && instanceConfigKey === configKey) {
    return langfuseInstance
  }

  // Create new instance
  langfuseInstance = new Langfuse({
    publicKey: config.publicKey,
    secretKey: config.secretKey,
    baseUrl: config.host,
    persistence: 'memory' // Use memory persistence for server-side
  })
  
  instanceConfigKey = configKey
  return langfuseInstance
}

export async function isLangfuseEnabled(): Promise<boolean> {
  const config = await getLangfuseConfig()
  return !!config
}

