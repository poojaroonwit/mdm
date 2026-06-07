import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, HardDrive, Plus, RefreshCw, Server } from 'lucide-react'
import { BUILTIN_CONNECTION_ID, type ExternalConnection } from './dataModelBrowserModel'

interface DataModelConnectionHeaderProps {
    connections: ExternalConnection[]
    isBuiltIn: boolean
    isLoadingConnections: boolean
    selectedConnectionId: string
    handleConnectionChange: (connectionId: string) => void
    loadDataModels: () => void
    loadTables: () => void
    setEditingModel: (model: null) => void
    setShowExternalWizard: (open: boolean) => void
    setShowNewModelDrawer: (open: boolean) => void
}

export function DataModelConnectionHeader({
    connections,
    isBuiltIn,
    isLoadingConnections,
    selectedConnectionId,
    handleConnectionChange,
    loadDataModels,
    loadTables,
    setEditingModel,
    setShowExternalWizard,
    setShowNewModelDrawer,
}: DataModelConnectionHeaderProps) {
    return (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Database Connection:</span>
            </div>
            <div className="flex-1 max-w-md">
                <Select value={selectedConnectionId} onValueChange={handleConnectionChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingConnections ? 'Loading...' : 'Select a connection'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={BUILTIN_CONNECTION_ID}>
                            <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4" />
                                <span>Built-in Database</span>
                                <Badge variant="secondary" className="text-xs ml-2">Default</Badge>
                            </div>
                        </SelectItem>
                        {connections.filter(c => c.connection_type === 'database').map(conn => (
                            <SelectItem key={conn.id} value={conn.id}>
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4" />
                                    <span>{conn.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2">{conn.db_type}</Badge>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowExternalWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
            </Button>
            {isBuiltIn && (
                <Button size="sm" onClick={() => { setEditingModel(null); setShowNewModelDrawer(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Model
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => isBuiltIn ? loadDataModels() : loadTables()}>
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
    )
}
