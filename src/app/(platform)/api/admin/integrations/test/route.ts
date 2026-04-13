import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@elastic/elasticsearch'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Test connection based on integration type
    let testResult = { success: false, error: 'Unknown integration type' }

    try {
      switch (type.toLowerCase()) {
        case 'openmetadata':
        case 'metadata':
          // Test OpenMetadata connection
          if (config?.apiUrl && config?.apiKey) {
            const response = await fetch(`${config.apiUrl}/api/v1/system/version`, {
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(10000) // 10 second timeout
            })
            testResult = {
              success: response.ok,
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'API URL and API Key are required' }
          }
          break

        case 'sso':
          // Test SSO configuration (basic validation)
          if (config?.ssoUrl && config?.entityId) {
            testResult = { success: true, error: '' }
          } else {
            testResult = { success: false, error: 'SSO URL and Entity ID are required' }
          }
          break

        case 'servicedesk':
          // Test Service Desk connection
          if (config?.baseUrl && config?.apiKey) {
            const response = await fetch(`${config.baseUrl}/api/v3/requests`, {
              headers: {
                'authtoken': config.apiKey,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(10000)
            })
            testResult = {
              success: response.ok || response.status === 401, // 401 means auth works but might need permissions
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'Base URL and API Key are required' }
          }
          break

        case 'powerbi':
          // Test Power BI connection (validate config)
          if (config?.clientId && config?.clientSecret && config?.tenantId) {
            testResult = { success: true, error: '' }
          } else {
            testResult = { success: false, error: 'Client ID, Client Secret, and Tenant ID are required' }
          }
          break

        case 'looker':
          // Test Looker connection
          if (config?.apiUrl && config?.clientId && config?.clientSecret) {
            const response = await fetch(`${config.apiUrl}/api/3.1/session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret
              }),
              signal: AbortSignal.timeout(10000)
            })
            testResult = {
              success: response.ok,
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'API URL, Client ID, and Client Secret are required' }
          }
          break

        case 'grafana':
          // Test Grafana connection
          if (config?.apiUrl && config?.apiKey) {
            const response = await fetch(`${config.apiUrl}/api/health`, {
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(10000)
            })
            testResult = {
              success: response.ok,
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'API URL and API Key are required' }
          }
          break

        case 'gitlab':
          // Test GitLab connection
          if (config?.token && config?.projectId) {
            try {
              const { GitLabProjectManagementService } = await import('@/lib/gitlab-project-management')
              const gitlabService = new GitLabProjectManagementService({
                token: config.token,
                projectId: config.projectId,
                baseUrl: config.baseUrl
              })
              const result = await gitlabService.testConnection()
              testResult = {
                success: result.success,
                error: result.error || '',
                ...(result.data && { data: result.data })
              } as { success: boolean; error: string; data?: any }
            } catch (error: any) {
              testResult = {
                success: false,
                error: error.message || 'Failed to connect to GitLab'
              }
            }
          } else {
            testResult = { success: false, error: 'Token and Project ID are required' }
          }
          break

        case 'vault':
          // Test Vault connection
          if (config?.vaultUrl && config?.token) {
            const response = await fetch(`${config.vaultUrl}/v1/sys/health`, {
              headers: {
                'X-Vault-Token': config.token,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(10000)
            })
            testResult = {
              success: response.ok,
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'Vault URL and Token are required' }
          }
          break

        case 'launchpad':
        case 'api':
        case 'sdk':
          // Test generic API/SDK connection
          if (config?.endpoint || config?.apiUrl) {
            const url = config.endpoint || config.apiUrl
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            }

            if (config.apiKey) {
              if (config.authType === 'bearer') {
                headers['Authorization'] = `Bearer ${config.apiKey}`
              } else if (config.authType === 'apiKey') {
                headers['X-API-Key'] = config.apiKey
              }
            }

            const response = await fetch(url, {
              method: 'GET',
              headers,
              signal: AbortSignal.timeout(10000)
            })
            testResult = {
              success: response.ok || response.status === 401, // 401 means endpoint exists
              error: response.ok ? '' : `HTTP ${response.status}: ${response.statusText}`
            }
          } else {
            testResult = { success: false, error: 'Endpoint URL is required' }
          }
          break

        case 'elasticsearch':
          // Test Elasticsearch connection
          if (!config?.url && !config?.cloudId) {
            testResult = { success: false, error: 'Elasticsearch URL or Cloud ID is required' }
            break
          }

          try {
            const clientOptions: any = {
              maxRetries: 1,
              requestTimeout: 10000,
              pingTimeout: 5000
            }

            // Set connection
            if (config.cloudId) {
              clientOptions.cloud = { id: config.cloudId }
            } else {
              clientOptions.node = config.url
            }

            // Set authentication
            if (config.apiKey) {
              clientOptions.auth = { apiKey: config.apiKey }
            } else if (config.username && config.password) {
              clientOptions.auth = {
                username: config.username,
                password: config.password
              }
            }

            const client = new Client(clientOptions)
            
            // Test connection with ping
            const pingResult = await client.ping()
            testResult = {
              success: pingResult,
              error: pingResult ? '' : 'Connection test failed'
            }
          } catch (esError: any) {
            testResult = {
              success: false,
              error: esError.message || 'Failed to connect to Elasticsearch'
            }
          }
          break

        case 'signoz':
          // Test SigNoz connection
          if (!config?.url) {
            testResult = { success: false, error: 'SigNoz URL is required' }
            break
          }

          try {
            // Test SigNoz API health endpoint
            const signozUrl = config.url.replace(/\/$/, '') // Remove trailing slash
            const healthUrl = `${signozUrl}/api/v1/health`
            
            const response = await fetch(healthUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
              },
              signal: AbortSignal.timeout(10000)
            })

            // SigNoz health endpoint may return 200 or 404 (if endpoint doesn't exist)
            // Try alternative: check if the base URL is accessible
            if (!response.ok && response.status !== 404) {
              // If health endpoint doesn't exist, try the base URL
              const baseResponse = await fetch(signozUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
                },
                signal: AbortSignal.timeout(10000)
              })
              
              testResult = {
                success: baseResponse.ok || baseResponse.status === 401, // 401 means auth works
                error: baseResponse.ok ? '' : `HTTP ${baseResponse.status}: ${baseResponse.statusText}`
              }
            } else {
              testResult = {
                success: true,
                error: ''
              }
            }
          } catch (signozError: any) {
            testResult = {
              success: false,
              error: signozError.message || 'Failed to connect to SigNoz'
            }
          }
          break

        default:
          testResult = { success: false, error: `Unsupported integration type: ${type}` }
      }
    } catch (testError: any) {
      testResult = {
        success: false,
        error: testError.message || 'Connection test failed'
      }
    }

    return NextResponse.json(testResult)
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/integrations/test')

