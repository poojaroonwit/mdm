import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

import type { Asset } from '@/lib/assets'

export interface NewDatabaseConnection {
  name: string
  spaceId: string
  type: 'postgresql'
  host: string
  port: number
  database: string
  username: string
  password: string
}

interface CreateDatabaseConnectionDialogProps {
  databaseTypes: Asset[]
  newConnection: NewDatabaseConnection
  open: boolean
  spaces: Array<{ id: string; name: string }>
  onCreate: () => void
  onOpenChange: (open: boolean) => void
  setNewConnection: (connection: NewDatabaseConnection) => void
}

export function CreateDatabaseConnectionDialog({
  databaseTypes,
  newConnection,
  open,
  spaces,
  onCreate,
  onOpenChange,
  setNewConnection
}: CreateDatabaseConnectionDialogProps) {
  return (
    <CrudDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Database Connection"
      description="Configure a new database connection"
      trigger={(
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      )}
      bodyClassName="space-y-4"
      footer={(
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!newConnection.name || !newConnection.host}>
            Create Connection
          </Button>
        </>
      )}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="conn-name">Connection Name</Label>
          <Input
            id="conn-name"
            value={newConnection.name}
            onChange={(event) => setNewConnection({ ...newConnection, name: event.target.value })}
            placeholder="My Database"
          />
        </div>
        <div>
          <Label htmlFor="conn-space">Space</Label>
          <Select
            value={newConnection.spaceId}
            onValueChange={(spaceId) => setNewConnection({ ...newConnection, spaceId })}
          >
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
        <div>
          <Label htmlFor="conn-type">Database Type</Label>
          <Select
            value={newConnection.type}
            onValueChange={(type: any) => {
              const selectedType = databaseTypes.find((databaseType) => databaseType.code === type)
              setNewConnection({
                ...newConnection,
                type,
                port: selectedType?.metadata?.defaultPort || newConnection.port
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
                    {type.icon && <span>{type.icon}</span>}
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="conn-host">Host</Label>
          <Input
            id="conn-host"
            value={newConnection.host}
            onChange={(event) => setNewConnection({ ...newConnection, host: event.target.value })}
            placeholder="localhost"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="conn-port">Port</Label>
          <Input
            id="conn-port"
            type="number"
            value={newConnection.port}
            onChange={(event) => setNewConnection({ ...newConnection, port: parseInt(event.target.value) })}
            placeholder="5432"
          />
        </div>
        <div>
          <Label htmlFor="conn-database">Database</Label>
          <Input
            id="conn-database"
            value={newConnection.database}
            onChange={(event) => setNewConnection({ ...newConnection, database: event.target.value })}
            placeholder="mydb"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="conn-username">Username</Label>
          <Input
            id="conn-username"
            value={newConnection.username}
            onChange={(event) => setNewConnection({ ...newConnection, username: event.target.value })}
            placeholder="user"
          />
        </div>
        <div>
          <Label htmlFor="conn-password">Password</Label>
          <Input
            id="conn-password"
            type="password"
            value={newConnection.password}
            onChange={(event) => setNewConnection({ ...newConnection, password: event.target.value })}
            placeholder="password"
          />
        </div>
      </div>
    </CrudDialog>
  )
}
