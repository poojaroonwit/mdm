import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Play, Settings, Trash2 } from 'lucide-react'

import type { Asset } from '@/lib/assets'
import type { DatabaseConnection } from '../types'
import type { NewDatabaseConnection } from './CreateDatabaseConnectionDialog'
import { CreateDatabaseConnectionDialog } from './CreateDatabaseConnectionDialog'
import { getDatabaseIcon, getStatusIcon } from './database-management-utils'

interface DatabaseConnectionsTabProps {
  connections: DatabaseConnection[]
  databaseTypes: Asset[]
  isLoading: boolean
  newConnection: NewDatabaseConnection
  open: boolean
  spaces: Array<{ id: string; name: string }>
  onCreate: () => void
  onDelete: (connectionId: string) => void
  onOpenChange: (open: boolean) => void
  onTest: (connectionId: string) => void
  setNewConnection: (connection: NewDatabaseConnection) => void
}

function DatabaseConnectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-10 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DatabaseConnectionsTab({
  connections,
  databaseTypes,
  isLoading,
  newConnection,
  open,
  spaces,
  onCreate,
  onDelete,
  onOpenChange,
  onTest,
  setNewConnection
}: DatabaseConnectionsTabProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Database Connections</h3>
        <CreateDatabaseConnectionDialog
          databaseTypes={databaseTypes}
          newConnection={newConnection}
          open={open}
          spaces={spaces}
          onCreate={onCreate}
          onOpenChange={onOpenChange}
          setNewConnection={setNewConnection}
        />
      </div>

      {isLoading && connections.length === 0 ? (
        <DatabaseConnectionSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => {
            const asset = databaseTypes.find((databaseType) => databaseType.code === connection.type)
            const typeName = asset?.name || connection.type

            return (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getDatabaseIcon(connection.type, databaseTypes)}
                      {connection.name}
                    </CardTitle>
                    {getStatusIcon(connection.status)}
                  </div>
                  <CardDescription>
                    {`${typeName} - ${connection.spaceName} - ${connection.host}:${connection.port} - ${connection.database}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge status={connection.status} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Active Connections</span>
                      <span>{connection.connectionPool.current}/{connection.connectionPool.max}</span>
                    </div>
                    <Progress value={(connection.connectionPool.current / connection.connectionPool.max) * 100} />
                  </div>

                  {connection.lastConnected && (
                    <div className="text-sm text-muted-foreground">
                      Last connected: {connection.lastConnected.toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onTest(connection.id)}>
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(connection.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
