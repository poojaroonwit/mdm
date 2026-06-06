'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/assets'
import { CheckCircle, Database, Loader, Play, Plus, Table, XCircle } from 'lucide-react'

export interface NewDatabaseConnectionDraft {
  name: string
  spaceId: string
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  scopeAllDatabases: boolean
  scopeAllTables: boolean
  specificTables: string[]
}

interface AddDatabaseConnectionDialogProps {
  connectionTestResult: 'success' | 'error' | null
  databaseTypes: Asset[]
  discoveredTables: string[]
  isTestingConnection: boolean
  newConnection: NewDatabaseConnectionDraft
  open: boolean
  spaces: Array<{ id: string; name: string }>
  onCreateConnection: () => void
  onOpenChange: (open: boolean) => void
  onResetConnection: () => void
  onTestConnection: () => void
  setNewConnection: (connection: NewDatabaseConnectionDraft) => void
}

export function AddDatabaseConnectionDialog({
  connectionTestResult,
  databaseTypes,
  discoveredTables,
  isTestingConnection,
  newConnection,
  open,
  spaces,
  onCreateConnection,
  onOpenChange,
  onResetConnection,
  onTestConnection,
  setNewConnection,
}: AddDatabaseConnectionDialogProps) {
  const updateConnection = (updates: Partial<NewDatabaseConnectionDraft>) => {
    setNewConnection({ ...newConnection, ...updates })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Add Database Connection
          </DialogTitle>
          <DialogDescription>
            Connect to an external database to use its tables as data models
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 p-6 pt-2 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conn-name">Connection Name</Label>
              <Input
                id="conn-name"
                value={newConnection.name}
                onChange={(event) => updateConnection({ name: event.target.value })}
                placeholder="My Database"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-space">Space</Label>
              <Select value={newConnection.spaceId} onValueChange={(value) => updateConnection({ spaceId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a space" />
                </SelectTrigger>
                <SelectContent>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conn-type">Database Type</Label>
              <Select
                value={newConnection.type}
                onValueChange={(value) => {
                  const selectedType = databaseTypes.find((type) => type.code === value)
                  updateConnection({
                    type: value,
                    port: selectedType?.metadata?.defaultPort || newConnection.port,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {databaseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.code}>
                      <div className="flex items-center gap-2">
                        {type.icon ? <span>{type.icon}</span> : null}
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-host">Host</Label>
              <Input
                id="conn-host"
                value={newConnection.host}
                onChange={(event) => updateConnection({ host: event.target.value })}
                placeholder="localhost"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conn-port">Port</Label>
              <Input
                id="conn-port"
                type="number"
                value={newConnection.port}
                onChange={(event) => updateConnection({ port: parseInt(event.target.value) || 5432 })}
                placeholder="5432"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="conn-database">Database</Label>
              <Input
                id="conn-database"
                value={newConnection.database}
                onChange={(event) => updateConnection({ database: event.target.value })}
                placeholder="mydb"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conn-username">Username</Label>
              <Input
                id="conn-username"
                value={newConnection.username}
                onChange={(event) => updateConnection({ username: event.target.value })}
                placeholder="user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-password">Password</Label>
              <Input
                id="conn-password"
                type="password"
                value={newConnection.password}
                onChange={(event) => updateConnection({ password: event.target.value })}
                placeholder="********"
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4 text-muted-foreground" />
                  <Label>Table Scope</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which tables to import as data models
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={newConnection.scopeAllTables}
                  onCheckedChange={(checked) => updateConnection({
                    scopeAllTables: checked === true,
                    specificTables: checked ? [] : newConnection.specificTables,
                  })}
                />
                <span className="text-sm">All Tables</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={!newConnection.scopeAllTables}
                  onCheckedChange={(checked) => updateConnection({
                    scopeAllTables: checked !== true,
                  })}
                />
                <span className="text-sm">Specific Tables</span>
              </label>
            </div>

            {!newConnection.scopeAllTables && discoveredTables.length > 0 ? (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">Select tables to import:</p>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {discoveredTables.map((table) => (
                      <label key={table} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={newConnection.specificTables.includes(table)}
                          onCheckedChange={(checked) => {
                            updateConnection({
                              specificTables: checked
                                ? [...newConnection.specificTables, table]
                                : newConnection.specificTables.filter((item) => item !== table),
                            })
                          }}
                        />
                        <span className="text-sm font-mono">{table}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}

            {!newConnection.scopeAllTables && discoveredTables.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Test connection first to discover available tables
              </p>
            ) : null}
          </div>

          {connectionTestResult ? (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg text-sm',
              connectionTestResult === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
            )}>
              {connectionTestResult === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Connection successful! {discoveredTables.length > 0 ? `Found ${discoveredTables.length} tables.` : ''}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Connection failed. Please check your credentials.
                </>
              )}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onTestConnection}
            disabled={!newConnection.host || !newConnection.database || isTestingConnection}
          >
            {isTestingConnection ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onResetConnection()
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateConnection}
            disabled={!newConnection.name || !newConnection.host || !newConnection.spaceId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
