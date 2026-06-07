import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  AlertCircle,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Trash2,
  XCircle,
} from 'lucide-react'
import { maskAPIKey, type APIKey } from './apiKeyManagementModel'

interface APIKeyListProps {
  apiKeys: APIKey[]
  showApiKey: Record<string, boolean>
  handleDeleteAPIKey: (id: string) => void
  openEditDialog: (key: APIKey) => void
  setShowApiKey: Dispatch<SetStateAction<Record<string, boolean>>>
}

function getStatusBadge(status: string, isConfigured: boolean) {
  if (!isConfigured) {
    return (
      <StatusBadge status="not-configured">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not Configured
      </StatusBadge>
    )
  }

  switch (status) {
    case 'active':
      return (
        <StatusBadge status={status}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </StatusBadge>
      )
    case 'error':
      return (
        <StatusBadge status={status}>
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </StatusBadge>
      )
    case 'pending':
      return (
        <StatusBadge status={status}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </StatusBadge>
      )
    default:
      return (
        <StatusBadge status="inactive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Inactive
        </StatusBadge>
      )
  }
}

export function APIKeyList({
  apiKeys,
  showApiKey,
  handleDeleteAPIKey,
  openEditDialog,
  setShowApiKey,
}: APIKeyListProps) {
  return (
    <div className="space-y-4">
      {apiKeys.map((key) => (
        <div
          key={key.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="text-2xl">{key.icon || <Key className="h-6 w-6" />}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{key.name}</h3>
                {getStatusBadge(key.status, key.isConfigured)}
              </div>
              {key.description && (
                <p className="text-sm text-muted-foreground mt-1">{key.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {showApiKey[key.id] && key.apiKey && key.apiKey !== '***'
                    ? key.apiKey
                    : maskAPIKey(key.apiKey)}
                </span>
                {key.apiKey && key.apiKey !== '***' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      setShowApiKey(prev => ({
                        ...prev,
                        [key.id]: !prev[key.id]
                      }))
                    }
                  >
                    {showApiKey[key.id] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {key.website && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(key.website, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(key)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAPIKey(key.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
