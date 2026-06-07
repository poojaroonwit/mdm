import { openMetadataMethods1, type OpenMetadataMethods1 } from './openmetadata/openmetadata-methods-1'
import { openMetadataMethods2, type OpenMetadataMethods2 } from './openmetadata/openmetadata-methods-2'
import { openMetadataMethods3, type OpenMetadataMethods3 } from './openmetadata/openmetadata-methods-3'
import { openMetadataMethods4, type OpenMetadataMethods4 } from './openmetadata/openmetadata-methods-4'
import { openMetadataMethods5, type OpenMetadataMethods5 } from './openmetadata/openmetadata-methods-5'
import { openMetadataMethods6, type OpenMetadataMethods6 } from './openmetadata/openmetadata-methods-6'

/**
 * OpenMetadata API Client
 * Provides methods to interact with OpenMetadata REST API
 */

export interface OpenMetadataClientConfig {
  host: string
  apiVersion: string
  authProvider: 'basic' | 'jwt' | 'oauth' | 'saml'
  authConfig: {
    username?: string
    password?: string
    jwtToken?: string
    clientId?: string
    clientSecret?: string
  }
}

class OpenMetadataClientBase {
  private config: OpenMetadataClientConfig
  private baseUrl: string

  constructor(config: OpenMetadataClientConfig) {
    this.config = config
    this.baseUrl = `${config.host}/api/${config.apiVersion}`
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.authProvider === 'basic' && this.config.authConfig.username && this.config.authConfig.password) {
      const credentials = Buffer.from(
        `${this.config.authConfig.username}:${this.config.authConfig.password}`
      ).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (this.config.authProvider === 'jwt' && this.config.authConfig.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.authConfig.jwtToken}`
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = { ...this.getAuthHeaders(), ...options.headers }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return ''
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)))
        } else {
          query.append(key, String(value))
        }
      }
    })
    return query.toString() ? `?${query.toString()}` : ''
  }
}

export type OpenMetadataClient = OpenMetadataClientBase
  & OpenMetadataMethods1
  & OpenMetadataMethods2
  & OpenMetadataMethods3
  & OpenMetadataMethods4
  & OpenMetadataMethods5
  & OpenMetadataMethods6

export const OpenMetadataClient = OpenMetadataClientBase as unknown as {
  new (config: OpenMetadataClientConfig): OpenMetadataClient
  prototype: OpenMetadataClient
}

Object.assign(OpenMetadataClient.prototype, openMetadataMethods1, openMetadataMethods2, openMetadataMethods3, openMetadataMethods4, openMetadataMethods5, openMetadataMethods6)
