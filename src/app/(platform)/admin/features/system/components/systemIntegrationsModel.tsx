import type React from 'react'
import {
  BarChart3,
  Lock,
  Mail,
  Search,
  Server,
  type LucideIcon,
} from 'lucide-react'

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 24H0V12.6h11.4V24z" fill="#F25022"/>
    <path d="M24 24H12.6V12.6H24V24z" fill="#00A4EF"/>
    <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#7FBA00"/>
    <path d="M24 11.4H12.6V0H24v11.4z" fill="#FFB900"/>
  </svg>
)

export interface IntegrationConfig {
  id: string
  name: string
  type: string
  description: string
  icon: LucideIcon | React.FC<{ className?: string }>
  category: 'authentication' | 'storage' | 'monitoring' | 'communication' | 'ai' | 'security'
  status: 'active' | 'inactive' | 'error' | 'pending'
  isConfigured: boolean
  config?: Record<string, any>
}

export interface IntegrationConfigField {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export const SYSTEM_CONFIG_INTEGRATIONS: Omit<IntegrationConfig, 'id' | 'isConfigured' | 'status' | 'config'>[] = [
  {
    name: 'HashiCorp Vault',
    type: 'vault',
    description: 'Secrets management and encryption',
    icon: Lock,
    category: 'security'
  },
  {
    name: 'Elasticsearch',
    type: 'elasticsearch',
    description: 'Search and log analytics',
    icon: Search,
    category: 'monitoring'
  },
  {
    name: 'SigNoz',
    type: 'signoz',
    description: 'APM and observability platform',
    icon: BarChart3,
    category: 'monitoring'
  },
  {
    name: 'SMTP Email',
    type: 'smtp',
    description: 'Email notifications and alerts',
    icon: Mail,
    category: 'communication'
  },
  {
    name: 'Azure AD SSO',
    type: 'azure-ad',
    description: 'Single sign-on with Microsoft Azure',
    icon: MicrosoftIcon,
    category: 'authentication'
  },
  {
    name: 'Google OAuth',
    type: 'google-auth',
    description: 'Sign in with Google',
    icon: GoogleIcon,
    category: 'authentication'
  },
  {
    name: 'Langfuse',
    type: 'langfuse',
    description: 'LLM observability and analytics',
    icon: BarChart3,
    category: 'ai'
  },
  {
    name: 'ServiceDesk',
    type: 'servicedesk',
    description: 'IT service management integration',
    icon: Server,
    category: 'communication'
  }
]

export function getConfigFields(type: string): IntegrationConfigField[] {
  switch (type.toLowerCase()) {
    case 'servicedesk':
      return [
        { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'technicianKey', label: 'Technician Key', type: 'password', required: false }
      ]
    case 'vault':
      return [
        { key: 'vaultUrl', label: 'Vault URL', type: 'text', required: true },
        { key: 'token', label: 'Token', type: 'password', required: true },
        { key: 'mountPath', label: 'Mount Path', type: 'text', required: false }
      ]
    case 'elasticsearch':
      return [
        { key: 'url', label: 'Elasticsearch URL', type: 'text', required: true, placeholder: 'https://localhost:9200' },
        { key: 'cloudId', label: 'Cloud ID (optional)', type: 'text', required: false, placeholder: 'For Elastic Cloud' },
        { key: 'username', label: 'Username (optional)', type: 'text', required: false },
        { key: 'password', label: 'Password (optional)', type: 'password', required: false },
        { key: 'apiKey', label: 'API Key (optional)', type: 'password', required: false },
        { key: 'indexPrefix', label: 'Index Prefix', type: 'text', required: false, placeholder: 'mdm-logs (default)' }
      ]
    case 'signoz':
      return [
        { key: 'url', label: 'SigNoz URL', type: 'text', required: true, placeholder: 'http://localhost:3301' },
        { key: 'otlpEndpoint', label: 'OTLP Endpoint', type: 'text', required: false, placeholder: 'http://localhost:4318' },
        { key: 'apiKey', label: 'API Key (optional)', type: 'password', required: false },
        { key: 'serviceName', label: 'Service Name', type: 'text', required: false, placeholder: 'mdm-platform' },
        { key: 'environment', label: 'Environment', type: 'text', required: false, placeholder: 'production' }
      ]
    case 'smtp':
      return [
        { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
        { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
        { key: 'user', label: 'Username', type: 'text', required: true },
        { key: 'pass', label: 'Password', type: 'password', required: true },
        { key: 'from', label: 'From Email', type: 'text', required: true, placeholder: 'noreply@example.com' },
        { key: 'secure', label: 'Secure (SSL/TLS)', type: 'select', options: ['true', 'false'], required: true }
      ]
    case 'azure-ad':
      return [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true }
      ]
    case 'google-auth':
      return [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ]
    case 'langfuse':
      return [
        { key: 'publicKey', label: 'Public Key', type: 'text', required: true },
        { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
        { key: 'host', label: 'Host URL', type: 'text', required: false, placeholder: 'https://cloud.langfuse.com' }
      ]
    default:
      return [
        { key: 'url', label: 'URL', type: 'text', required: true },
        { key: 'apiKey', label: 'API Key', type: 'password', required: false }
      ]
  }
}
