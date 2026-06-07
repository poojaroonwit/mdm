import { AlertTriangle, CheckCircle, Clock, Database, XCircle } from 'lucide-react'

import type { Asset } from '@/lib/assets'

export function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'disconnected':
      return <XCircle className="h-4 w-4 text-gray-500" />
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

export function getDatabaseIcon(type: string, databaseTypes: Asset[]) {
  const asset = databaseTypes.find((databaseType) => databaseType.code === type)
  if (asset?.icon) {
    return <span className="text-lg">{asset.icon}</span>
  }

  switch (type) {
    case 'postgresql':
      return <Database className="h-4 w-4 text-blue-500" />
    case 'mysql':
      return <Database className="h-4 w-4 text-orange-500" />
    case 'sqlite':
      return <Database className="h-4 w-4 text-green-500" />
    case 'mongodb':
      return <Database className="h-4 w-4 text-green-600" />
    case 'redis':
      return <Database className="h-4 w-4 text-red-500" />
    default:
      return <Database className="h-4 w-4 text-gray-500" />
  }
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
