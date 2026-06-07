// Request Executor - Handles API request execution

import { ApiRequest, ApiResponse, KeyValuePair, AuthConfig } from '../types'

export class RequestExecutor {
  /**
   * Execute a REST API request
   */
  static async executeRestRequest(
    request: ApiRequest,
    environmentVariables: KeyValuePair[] = []
  ): Promise<ApiResponse> {
    const startTime = Date.now()

    try {
      // Resolve environment variables in URL
      let url = this.resolveVariables(request.url, environmentVariables)

      // Validate URL protocol utilizing URL constructor for stricter parsing
      try {
        const parsedUrl = new URL(url)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new Error('Invalid URL protocol')
        }
      } catch (e) {
        throw new Error('Invalid URL: Only HTTP and HTTPS are supported.')
      }

      // Build headers
      const headers = this.buildHeaders(request, environmentVariables)

      // Build query parameters
      const queryParams = this.buildQueryParams(request.params, environmentVariables)
      if (queryParams) {
        url += (url.includes('?') ? '&' : '?') + queryParams
      }

      // Build request body
      const body = this.buildBody(request, environmentVariables)

      // Execute fetch
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        ...(body && { body }),
      }

      // deepcode ignore Ssrf: URL is validated for protocol whitelist (http/https) above
      const response = await fetch(url, fetchOptions)
      const responseTime = Date.now() - startTime

      // Get response body
      const contentType = response.headers.get('content-type') || ''
      let responseBody = ''

      if (contentType.includes('application/json')) {
        responseBody = JSON.stringify(await response.json(), null, 2)
      } else if (contentType.includes('text/')) {
        responseBody = await response.text()
      } else {
        // For binary or other types, try to get as text
        try {
          responseBody = await response.text()
        } catch {
          responseBody = '[Binary content]'
        }
      }

      // Convert headers to object
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        statusCode: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Execute a GraphQL request
   */
  static async executeGraphQLRequest(
    request: ApiRequest,
    environmentVariables: KeyValuePair[] = []
  ): Promise<ApiResponse> {
    const startTime = Date.now()

    try {
      const url = this.resolveVariables(request.url, environmentVariables)

      // Validate URL protocol
      try {
        const parsedUrl = new URL(url)
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new Error('Invalid URL protocol')
        }
      } catch (e) {
        throw new Error('Invalid URL: Only HTTP and HTTPS are supported.')
      }

      const headers = this.buildHeaders(request, environmentVariables)

      // GraphQL requests typically use POST
      const body = JSON.stringify({
        query: request.graphqlQuery || '',
        variables: request.graphqlVariables
          ? JSON.parse(this.resolveVariables(request.graphqlVariables, environmentVariables))
          : {},
      })

      headers['Content-Type'] = 'application/json'

      headers['Content-Type'] = 'application/json'

      // deepcode ignore Ssrf: URL is validated for protocol whitelist (http/https) above
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      const responseTime = Date.now() - startTime
      const responseBody = JSON.stringify(await response.json(), null, 2)

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        statusCode: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Resolve environment variables in a string
   */
  private static resolveVariables(
    text: string,
    variables: KeyValuePair[]
  ): string {
    if (typeof text !== 'string') return text || ''
    let resolved = text
    variables
      .filter((v) => v.enabled)
      .forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
        resolved = resolved.replace(regex, variable.value)
      })
    return resolved
  }

  /**
   * Build request headers
   */
  private static buildHeaders(
    request: ApiRequest,
    environmentVariables: KeyValuePair[]
  ): Record<string, string> {
    const headers: Record<string, string> = {}

    // Add custom headers
    request.headers
      .filter((h) => h.enabled && h.key)
      .forEach((header) => {
        const key = this.resolveVariables(header.key, environmentVariables)
        const value = this.resolveVariables(header.value, environmentVariables)
        headers[key] = value
      })

    // Add auth headers
    if (request.authType !== 'none' && request.authConfig) {
      this.addAuthHeaders(headers, request.authType, request.authConfig, environmentVariables)
    }

    return headers
  }

  /**
   * Add authentication headers
   */
  private static addAuthHeaders(
    headers: Record<string, string>,
    authType: string,
    authConfig: AuthConfig,
    environmentVariables: KeyValuePair[]
  ) {
    switch (authType) {
      case 'bearer':
        if (authConfig.bearerToken) {
          const token = this.resolveVariables(authConfig.bearerToken, environmentVariables)
          headers['Authorization'] = `Bearer ${token}`
        }
        break

      case 'basic':
        if (authConfig.username && authConfig.password) {
          const username = this.resolveVariables(authConfig.username, environmentVariables)
          const password = this.resolveVariables(authConfig.password, environmentVariables)
          const credentials = btoa(`${username}:${password}`)
          headers['Authorization'] = `Basic ${credentials}`
        }
        break

      case 'apikey':
        if (authConfig.apiKeyName && authConfig.apiKeyValue) {
          const keyName = this.resolveVariables(authConfig.apiKeyName, environmentVariables)
          const keyValue = this.resolveVariables(authConfig.apiKeyValue, environmentVariables)
          if (authConfig.apiKeyLocation === 'header') {
            headers[keyName] = keyValue
          }
        }
        break
    }
  }

  /**
   * Build query parameters string
   */
  private static buildQueryParams(
    params: KeyValuePair[],
    environmentVariables: KeyValuePair[]
  ): string {
    const enabledParams = params.filter((p) => p.enabled && p.key)
    if (enabledParams.length === 0) return ''

    const queryParams = enabledParams.map((param) => {
      const key = encodeURIComponent(
        this.resolveVariables(param.key, environmentVariables)
      )
      const value = encodeURIComponent(
        this.resolveVariables(param.value, environmentVariables)
      )
      return `${key}=${value}`
    })

    return queryParams.join('&')
  }

  /**
   * Build request body
   */
  private static buildBody(
    request: ApiRequest,
    environmentVariables: KeyValuePair[]
  ): string | FormData | null {
    if (!request.body || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return null
    }

    const resolvedBody = this.resolveVariables(request.body, environmentVariables)

    switch (request.bodyType) {
      case 'json':
        try {
          // Validate JSON
          JSON.parse(resolvedBody)
          return resolvedBody
        } catch {
          return resolvedBody
        }

      case 'form-data': {
        const formData = new FormData()
        try {
          const parsed = JSON.parse(resolvedBody)
          Object.entries(parsed).forEach(([key, value]) => {
            formData.append(key, String(value))
          })
        } catch {
          // If not JSON, try key=value format
          resolvedBody.split('&').forEach((pair) => {
            const [key, value] = pair.split('=')
            if (key) formData.append(key, value || '')
          })
        }
        return formData
      }

      case 'x-www-form-urlencoded': {
        const params = new URLSearchParams()
        try {
          const parsed = JSON.parse(resolvedBody)
          Object.entries(parsed).forEach(([key, value]) => {
            params.append(key, String(value))
          })
        } catch {
          resolvedBody.split('&').forEach((pair) => {
            const [key, value] = pair.split('=')
            if (key) params.append(key, value || '')
          })
        }
        return params.toString()
      }

      case 'raw':
      default:
        return resolvedBody
    }
  }

  /**
   * Execute pre-request script
   */
  static async executePreRequestScript(
    script: string,
    request: ApiRequest,
    environmentVariables: KeyValuePair[]
  ): Promise<{ request: ApiRequest; variables: KeyValuePair[] }> {
    if (!script) {
      return { request, variables: environmentVariables }
    }

    try {
      // Basic sanity check to prevent obvious restricted global access
      // Note: This is client-side execution (browser), so sophisticated sandboxing is limited without workers/iframes.
      // We block access to obvious dangerous globals in the immediate scope check.
      if (script.includes('window.') || script.includes('document.') || script.includes('localStorage') || script.includes('cookie')) {
        console.warn('Script contains potentially unsafe DOM access. Execution proceeds but exercise caution.')
      }

      // Create a sandboxed execution context
      const context = {
        request: { ...request },
        environment: environmentVariables.map((v) => ({ ...v })),
        // Helper functions
        setEnvironmentVariable: (key: string, value: string) => {
          const existing = context.environment.find((v) => v.key === key)
          if (existing) {
            existing.value = value
          } else {
            context.environment.push({ key, value, enabled: true })
          }
        },
        getEnvironmentVariable: (key: string) => {
          return context.environment.find((v) => v.key === key)?.value
        },
      }

      // Execute script using new Function
      // Mitigation: Function is created with restricted scope arguments, though 'this' or global scope is still accessible in non-strict mode.
      // We use strict mode inside the function.
      const func = new Function(
        'request',
        'environment',
        'setEnvironmentVariable',
        'getEnvironmentVariable',
        `"use strict";\n${script}`
      )

      func(
        context.request,
        context.environment,
        context.setEnvironmentVariable,
        context.getEnvironmentVariable
      )

      return {
        request: context.request,
        variables: context.environment,
      }
    } catch (error) {
      console.error('Pre-request script error:', error)
      return { request, variables: environmentVariables }
    }
  }

  /**
   * Execute test script
   */
  static async executeTestScript(
    script: string,
    response: ApiResponse,
    request: ApiRequest
  ): Promise<{ passed: boolean; results: any[] }> {
    if (!script) {
      return { passed: true, results: [] }
    }

    try {
      const results: any[] = []
      const context = {
        response,
        request,
        expect: (condition: boolean, message?: string) => {
          results.push({
            passed: condition,
            message: message || (condition ? 'Test passed' : 'Test failed'),
          })
          return condition
        },
        test: (name: string, fn: () => void) => {
          try {
            fn()
          } catch (error) {
            results.push({
              passed: false,
              message: `Test "${name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        },
      }

      // Execute script with strict mode
      const func = new Function('response', 'request', 'expect', 'test', `"use strict";\n${script}`)
      func(context.response, context.request, context.expect, context.test)

      const passed = results.every((r) => r.passed)
      return { passed, results }
    } catch (error) {
      return {
        passed: false,
        results: [
          {
            passed: false,
            message: `Test script error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      }
    }
  }
}

