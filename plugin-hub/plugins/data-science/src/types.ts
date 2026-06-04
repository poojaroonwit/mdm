export interface KernelServer {
  [key: string]: unknown
  id: string
  name: string
  host: string
  port: number
  protocol: 'http' | 'https'
  status: string
  language: string
  version: string
  description?: string
  packages: string[]
  lastSeen: Date
  createdAt: Date
  isSecure?: boolean
  maxConnections: number
  currentConnections: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  apiKey?: string
  metadata?: Record<string, any>
}

export interface KernelTemplate {
  [key: string]: unknown
  id: string
  name: string
  description: string
  language: string
  version?: string
  dockerImage: string
  requirements: string[]
  environment?: Record<string, string>
  startupScript?: string
  healthCheck?: string
  config?: Record<string, any>
}
