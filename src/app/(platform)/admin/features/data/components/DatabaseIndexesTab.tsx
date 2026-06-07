import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

import type { IndexInfo } from '../types'
import { formatBytes } from './database-management-utils'

interface DatabaseIndexesTabProps {
  indexes: IndexInfo[]
}

export function DatabaseIndexesTab({ indexes }: DatabaseIndexesTabProps) {
  return (
    <>
      <h3 className="text-lg font-semibold">Database Indexes</h3>
      <div className="space-y-4">
        {indexes.map((index) => (
          <Card key={index.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{index.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {index.table} - {index.columns.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={index.isPrimary ? 'primary' : 'standard'} label={index.type} />
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(index.size)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
