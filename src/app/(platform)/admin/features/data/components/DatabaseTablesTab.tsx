import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from 'lucide-react'

import type { TableInfo } from '../types'
import { formatBytes } from './database-management-utils'

interface DatabaseTablesTabProps {
  tables: TableInfo[]
}

export function DatabaseTablesTab({ tables }: DatabaseTablesTabProps) {
  return (
    <>
      <h3 className="text-lg font-semibold">Database Tables</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.name} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                {table.name}
              </CardTitle>
              <CardDescription>
                {table.rows.toLocaleString()} rows - {formatBytes(table.size)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Indexes:</span>
                  <span>{table.indexes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Columns:</span>
                  <span>{table.columns.length}</span>
                </div>
                {table.isPartitioned && (
                  <Badge variant="outline" className="text-xs">Partitioned</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
