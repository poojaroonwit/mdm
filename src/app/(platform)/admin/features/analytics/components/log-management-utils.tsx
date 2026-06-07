import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
  Server,
  XCircle
} from 'lucide-react'

export function formatDuration(ms?: number) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function getLevelIcon(level: string) {
  switch (level) {
    case 'DEBUG':
      return <Info className="h-4 w-4 text-blue-500" />
    case 'INFO':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'WARN':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'ERROR':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'FATAL':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

export const logStatIcons = {
  total: FileText,
  errorRate: AlertTriangle,
  services: Server
}
