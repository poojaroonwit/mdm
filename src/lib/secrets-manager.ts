/**
 * Secrets Management Module
 * Provides a unified interface for managing secrets using either:
 * - HashiCorp Vault (recommended for production)
 * - Database encryption (fallback)
 */

import { encryptApiKey, decryptApiKey } from './encryption'

// Vault client type (will be loaded dynamically)
type VaultClient = any

interface SecretMetadata {
  path: string
  version?: number
  created?: Date
  updated?: Date
}

interface SecretData {
  [key: string]: any
}

interface SecretAuditContext {
  userId?: string
  userName?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  reason?: string
}

class SecretsManager {
  private useVault: boolean
  private vaultClient: VaultClient | null = null
  private vaultAddr: string
  private vaultToken: string
  private vaultNamespace?: string
  private secretMount: string
  private initialized: boolean = false

  constructor() {
    this.useVault = process.env.USE_VAULT === 'true'
    this.vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200'
    this.vaultToken = process.env.VAULT_TOKEN || ''
    this.vaultNamespace = process.env.VAULT_NAMESPACE
    this.secretMount = process.env.VAULT_SECRET_MOUNT || 'secret'
  }

  /**
   * Initialize Vault client if using Vault
   */
  private async initializeVault(): Promise<void> {
    if (!this.useVault || this.initialized) {
      return
    }

    try {
      // Dynamic import to avoid requiring node-vault if not using Vault
      const vault = await import('node-vault')
      this.vaultClient = vault.default({
        endpoint: this.vaultAddr,
        token: this.vaultToken,
        namespace: this.vaultNamespace,
      })

      // Test connection
      await this.vaultClient.health()
      this.initialized = true
      console.log('✅ HashiCorp Vault connected successfully')
    } catch (error: any) {
      console.error('❌ Failed to connect to Vault:', error.message)
      console.warn('⚠️  Falling back to database encryption')
      this.useVault = false
      this.initialized = false
    }
  }

  /**
   * Get the storage backend being used
   */
  getBackend(): 'vault' | 'database' {
    return this.useVault ? 'vault' : 'database'
  }

  /**
   * Store a secret
   * @param path Secret path (e.g., 'ai-providers/openai/api-key')
   * @param data Secret data
   * @param metadata Optional metadata
   * @param auditContext Optional audit context for logging
   */
  async storeSecret(
    path: string,
    data: SecretData,
    metadata?: SecretMetadata,
    auditContext?: SecretAuditContext
  ): Promise<void> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const vaultPath = `${this.secretMount}/data/${path}`
        await this.vaultClient.write(vaultPath, {
          data,
          metadata,
        })
        console.log(`✅ Secret stored in Vault: ${vaultPath}`)

        // Log secret access if audit context provided
        if (auditContext) {
          this.logSecretAccess(path, 'CREATE', auditContext).catch((err) => {
            console.error('Failed to log secret access:', err)
          })
        }
      } catch (error: any) {
        console.error(`❌ Failed to store secret in Vault:`, error.message)
        throw new Error(`Vault storage failed: ${error.message}`)
      }
    } else {
      // Fallback: encrypt and return (caller should store in database)
      // This maintains backward compatibility
      throw new Error(
        'Database storage should use encryptApiKey() directly. Vault is not available.'
      )
    }
  }

  /**
   * Retrieve a secret
   * @param path Secret path
   * @param version Optional version number
   * @param auditContext Optional audit context for logging
   */
  async getSecret(
    path: string,
    version?: number,
    auditContext?: SecretAuditContext
  ): Promise<SecretData | null> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const vaultPath = `${this.secretMount}/data/${path}`
        const options: any = {}
        if (version) {
          options.version = version
        }

        const response = await this.vaultClient.read(vaultPath, options)
        const secretData = response.data?.data || null

        // Log secret access if audit context provided
        if (secretData && auditContext) {
          this.logSecretAccess(path, 'READ', auditContext).catch((err) => {
            console.error('Failed to log secret access:', err)
            // Don't fail the request if audit logging fails
          })
        }

        return secretData
      } catch (error: any) {
        if (error.response?.statusCode === 404) {
          return null
        }
        console.error(`❌ Failed to read secret from Vault:`, error.message)
        throw new Error(`Vault read failed: ${error.message}`)
      }
    } else {
      // Fallback: return null (caller should decrypt from database)
      // Still log access if audit context provided
      if (auditContext) {
        this.logSecretAccess(path, 'READ', auditContext).catch((err) => {
          console.error('Failed to log secret access:', err)
        })
      }
      return null
    }
  }

  /**
   * Delete a secret
   * @param path Secret path
   * @param auditContext Optional audit context for logging
   */
  async deleteSecret(path: string, auditContext?: SecretAuditContext): Promise<void> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const vaultPath = `${this.secretMount}/data/${path}`
        await this.vaultClient.delete(vaultPath)
        console.log(`✅ Secret deleted from Vault: ${vaultPath}`)

        // Log secret access if audit context provided
        if (auditContext) {
          this.logSecretAccess(path, 'DELETE', auditContext).catch((err) => {
            console.error('Failed to log secret access:', err)
          })
        }
      } catch (error: any) {
        console.error(`❌ Failed to delete secret from Vault:`, error.message)
        throw new Error(`Vault delete failed: ${error.message}`)
      }
    } else {
      throw new Error('Vault is not available')
    }
  }

  /**
   * List secrets at a path
   * @param path Secret path prefix
   */
  async listSecrets(path: string): Promise<string[]> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const vaultPath = `${this.secretMount}/metadata/${path}`
        const response = await this.vaultClient.list(vaultPath)
        return response.data?.keys || []
      } catch (error: any) {
        if (error.response?.statusCode === 404) {
          return []
        }
        console.error(`❌ Failed to list secrets from Vault:`, error.message)
        return []
      }
    } else {
      return []
    }
  }

  /**
   * Get secret metadata
   * @param path Secret path
   */
  async getSecretMetadata(path: string): Promise<SecretMetadata | null> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const vaultPath = `${this.secretMount}/metadata/${path}`
        const response = await this.vaultClient.read(vaultPath)
        const metadata = response.data

        return {
          path,
          version: metadata.current_version,
          created: metadata.created_time
            ? new Date(metadata.created_time)
            : undefined,
          updated: metadata.updated_time
            ? new Date(metadata.updated_time)
            : undefined,
        }
      } catch (error: any) {
        if (error.response?.statusCode === 404) {
          return null
        }
        console.error(
          `❌ Failed to get secret metadata from Vault:`,
          error.message
        )
        return null
      }
    } else {
      return null
    }
  }

  /**
   * Store API key (convenience method)
   */
  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const path = `ai-providers/${provider}/api-key`
    await this.storeSecret(path, { apiKey })
  }

  /**
   * Get API key (convenience method)
   * @param provider Provider name
   * @param auditContext Optional audit context for logging
   */
  async getApiKey(provider: string, auditContext?: SecretAuditContext): Promise<string | null> {
    const path = `ai-providers/${provider}/api-key`
    const data = await this.getSecret(path, undefined, auditContext)
    return data?.apiKey || null
  }

  /**
   * Store database connection credentials
   * @param connectionId Connection ID
   * @param credentials Credentials to store
   * @param auditContext Optional audit context for logging
   */
  async storeDatabaseCredentials(
    connectionId: string,
    credentials: {
      username?: string
      password?: string
      host?: string
      port?: number
      database?: string
    },
    auditContext?: SecretAuditContext
  ): Promise<void> {
    const path = `database-connections/${connectionId}/credentials`
    await this.storeSecret(path, credentials, undefined, auditContext)
  }

  /**
   * Get database connection credentials
   * @param connectionId Connection ID
   * @param auditContext Optional audit context for logging
   */
  async getDatabaseCredentials(
    connectionId: string,
    auditContext?: SecretAuditContext
  ): Promise<{
    username?: string
    password?: string
    host?: string
    port?: number
    database?: string
  } | null> {
    const path = `database-connections/${connectionId}/credentials`
    return await this.getSecret(path, undefined, auditContext)
  }

  /**
   * Store external API connection credentials
   * @param connectionId Connection ID
   * @param credentials Credentials to store
   * @param auditContext Optional audit context for logging
   */
  async storeExternalApiCredentials(
    connectionId: string,
    credentials: {
      apiKey?: string
      apiToken?: string
      apiSecret?: string
      authToken?: string
      username?: string
      password?: string
    },
    auditContext?: SecretAuditContext
  ): Promise<void> {
    const path = `external-connections/${connectionId}/credentials`
    await this.storeSecret(path, credentials, undefined, auditContext)
  }

  /**
   * Get external API connection credentials
   * @param connectionId Connection ID
   * @param auditContext Optional audit context for logging
   */
  async getExternalApiCredentials(
    connectionId: string,
    auditContext?: SecretAuditContext
  ): Promise<any> {
    const path = `external-connections/${connectionId}/credentials`
    return await this.getSecret(path, undefined, auditContext)
  }

  /**
   * Check Vault health
   */
  async healthCheck(): Promise<{
    healthy: boolean
    backend: 'vault' | 'database'
    vaultStatus?: any
  }> {
    await this.initializeVault()

    if (this.useVault && this.vaultClient) {
      try {
        const status = await this.vaultClient.health()
        return {
          healthy: true,
          backend: 'vault',
          vaultStatus: status,
        }
      } catch (error: any) {
        return {
          healthy: false,
          backend: 'vault',
          vaultStatus: { error: error.message },
        }
      }
    }

    return {
      healthy: true,
      backend: 'database',
    }
  }

  /**
   * Log secret access for audit purposes
   * @private
   */
  private async logSecretAccess(
    path: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    context: SecretAuditContext
  ): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { query } = await import('./db')

      // Ensure audit_logs table has required columns (migration)
      // DDL REMOVED: Runtime schema modification is unsafe and caused stability issues.
      // Columns should be added via proper migration scripts.


      // Ensure user_id is not null (required by schema)
      // If no user_id is provided, we can't log this access
      const userId = context.userId?.toString().trim()
      if (!userId || userId === '' || userId === 'null' || userId === 'undefined') {
        console.warn('Cannot log secret access: user_id is required', { userId: context.userId })
        return
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.warn('Cannot log secret access: user_id is not a valid UUID', { userId })
        return
      }

      // Build the INSERT query with explicit column names to avoid order issues
      await query(
        `INSERT INTO public.audit_logs (
          user_id, 
          user_name, 
          user_email, 
          action, 
          resource_type, 
          resource_id,
          resource_name, 
          ip_address, 
          user_agent, 
          metadata, 
          success
        ) VALUES (
          CAST($1 AS uuid),
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          CASE WHEN $10 IS NULL THEN NULL ELSE CAST($10 AS jsonb) END,
          $11
        )`,
        [
          userId, // Required - already checked above
          context.userName || null,
          context.userEmail || null,
          action, // Required
          'secret', // Required (resource_type)
          path.split('/').pop() || null, // Extract resource ID from path
          path || null, // Full path as resource name
          context.ipAddress || null,
          context.userAgent || null,
          JSON.stringify({
            secretPath: path,
            reason: context.reason || null,
            backend: this.getBackend(),
          }),
          true, // success - required (has DEFAULT but being explicit)
        ]
      )
    } catch (error) {
      // Silently fail - don't break secret retrieval if audit logging fails
      console.error('Failed to log secret access:', error)
    }
  }
}

// Singleton instance
let secretsManagerInstance: SecretsManager | null = null

export function getSecretsManager(): SecretsManager {
  if (!secretsManagerInstance) {
    secretsManagerInstance = new SecretsManager()
  }
  return secretsManagerInstance
}

// Export for convenience
export const secretsManager = getSecretsManager()

// Export types
export type { SecretMetadata, SecretData, SecretAuditContext }


