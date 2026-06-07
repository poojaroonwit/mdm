import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
