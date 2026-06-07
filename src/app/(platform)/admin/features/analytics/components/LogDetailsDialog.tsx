import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'

import type { LogEntry } from '../types'
import { formatDuration, getLevelIcon } from './log-management-utils'

interface LogDetailsDialogProps {
  log: LogEntry | null
  onClose: () => void
}

export function LogDetailsDialog({ log, onClose }: LogDetailsDialogProps) {
  if (!log) return null

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            {getLevelIcon(log.level)}
            Log Details
          </DialogTitle>
          <DialogDescription>
            {log.service} - {log.timestamp.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="p-6 pt-2 pb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Level:</span>
                <StatusBadge status={log.level} label={log.level} className="ml-2" />
              </div>
              <div>
                <span className="font-medium">Service:</span> {log.service}
              </div>
              <div>
                <span className="font-medium">Timestamp:</span> {log.timestamp.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {formatDuration(log.duration)}
              </div>
              {log.userId && (
                <div>
                  <span className="font-medium">User ID:</span> {log.userId}
                </div>
              )}
              {log.sessionId && (
                <div>
                  <span className="font-medium">Session ID:</span> {log.sessionId}
                </div>
              )}
            </div>

            <div>
              <span className="font-medium">Message:</span>
              <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                {log.message}
              </div>
            </div>

            {Object.keys(log.context).length > 0 && (
              <div>
                <span className="font-medium">Context:</span>
                <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  <pre>{JSON.stringify(log.context, null, 2)}</pre>
                </div>
              </div>
            )}

            {log.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {log.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
