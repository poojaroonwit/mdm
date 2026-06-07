'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Edit } from 'lucide-react'

interface CustomerBulkActionsProps {
  customerDataModelId: string | null
  exporting: boolean
  selectedCount: number
  onBulkEdit: () => void
  onExportSelected: () => void
}

export function CustomerBulkActions({
  customerDataModelId,
  exporting,
  selectedCount,
  onBulkEdit,
  onExportSelected,
}: CustomerBulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} customer(s) selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onBulkEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Bulk Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!customerDataModelId || exporting}
              onClick={onExportSelected}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Selected'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
