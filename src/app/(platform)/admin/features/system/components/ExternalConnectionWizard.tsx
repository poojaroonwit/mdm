'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ChevronRight, Database, ExternalLink, CheckCircle2, ChevronLeft, Link as LinkIcon, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

export type ExternalConnectionType = 'database' | 'api'
export type DatabaseType = 'postgres' | 'mysql'

interface ExternalConnectionWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: any) => Promise<void>
    spaceId: string
}

export function ExternalConnectionWizard({
    open,
    onOpenChange,
    onSubmit,
    spaceId
}: ExternalConnectionWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [connectionType, setConnectionType] = useState<ExternalConnectionType | null>(null)
    const [dbType, setDbType] = useState<DatabaseType | null>(null)
    const [mode, setMode] = useState<'create' | 'select'>('create')
    const [existingConnections, setExistingConnections] = useState<any[]>([])
    const [selectedConnectionId, setSelectedConnectionId] = useState<string>('')
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        schema: '',
        table: '',
        api_url: '',
        api_method: 'GET' as 'GET' | 'POST',
        api_headers: {} as Record<string, string>,
        api_auth_type: 'none' as 'none' | 'bearer' | 'basic',
        api_auth_token: '',
        testing: false,
        testResult: null as any
    })

    useEffect(() => {
        if (open) {
            loadConnections()
        }
    }, [open, spaceId])

    const loadConnections = async () => {
        setIsLoadingConnections(true)
        try {
            const res = await fetch(`/api/external-connections?space_id=${spaceId}`)
            if (res.ok) {
                const data = await res.json()
                setExistingConnections(data.connections || [])
            }
        } catch (error) {
            console.error('Failed to load connections', error)
        } finally {
            setIsLoadingConnections(false)
        }
    }

    const reset = () => {
        setStep(1)
        setConnectionType(null)
        setDbType(null)
        setMode('create')
        setSelectedConnectionId('')
        setFormData({
            name: '',
            host: '',
            port: '',
            database: '',
            username: '',
            password: '',
            schema: '',
            table: '',
            api_url: '',
            api_method: 'GET',
            api_headers: {},
            api_auth_type: 'none',
            api_auth_token: '',
            testing: false,
            testResult: null
        })
    }

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(reset, 300)
    }

    const handleTestConnection = async () => {
        setFormData(prev => ({ ...prev, testing: true, testResult: null }))
        try {
            const body = connectionType === 'api' ? {
                space_id: spaceId,
                connection_type: 'api',
                api_url: formData.api_url,
                api_method: formData.api_method,
            } : {
                space_id: spaceId,
                connection_type: 'database',
                db_type: dbType,
                host: formData.host,
                port: parseInt(formData.port),
                database: formData.database,
                username: formData.username,
                password: formData.password
            }

            const res = await fetch('/api/external-connections/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const json = await res.json()
            setFormData(prev => ({ ...prev, testResult: json }))
        } catch (e: any) {
            setFormData(prev => ({ ...prev, testResult: { success: false, error: e.message } }))
        } finally {
            setFormData(prev => ({ ...prev, testing: false }))
        }
    }

    const handleTestExistingConnection = async () => {
        if (!selectedConnectionId) return
        const connection = existingConnections.find(c => c.id === selectedConnectionId)
        if (!connection) return

        setFormData(prev => ({ ...prev, testing: true, testResult: null }))
        try {
            // For existing connections, we might need a different test endpoint or pass the ID
            // Since /api/external-connections/test expects raw params, we'll try to use the stored values
            // BUT for security, we might not have the password client-side.
            // Ideally we should have an endpoint like /api/external-connections/${id}/test
            // For now, let's assume we can use the same logic if we fill the form? No, that's insecure.
            // Let's rely on the fact that if it's saved, it was valid.
            // We just need to fetch schema/tables.

            // Actually, for "Select Existing", we probably want to create a Data Model FROM it.
            // So we need to list tables.

            // Let's try to use the GET endpoint of /api/external-connections/test?space_id=...&...
            // But that requires query params.
            // Let's try to invoke a test using the connection ID if supported, or fallback to manual.

            // Simplify: If selecting existing, just list tables using a new endpoint or reused logic?
            // Let's assume for now we just want to SELECT it to create a model.

            // If we are reusing a connection, we just need to know which TABLE to pick if it's a DB.
            // We need to fetch metadata for this connection.
            const res = await fetch(`/api/external-connections/${selectedConnectionId}/metadata?space_id=${spaceId}`)
            if (res.ok) {
                const json = await res.json()
                setFormData(prev => ({ ...prev, testResult: { success: true, ...json } }))
            } else {
                throw new Error('Failed to fetch metadata')
            }

        } catch (e: any) {
            setFormData(prev => ({ ...prev, testResult: { success: false, error: e.message } }))
        } finally {
            setFormData(prev => ({ ...prev, testing: false }))
        }
    }

    const handleSubmit = async () => {
        if (mode === 'select') {
            // If selecting existing, we just pass the connection ID and the selected table/schema
            // The parent handler needs to know this is an EXISTING connection reuse.
            const connection = existingConnections.find(c => c.id === selectedConnectionId)
            await onSubmit({
                existingConnectionId: selectedConnectionId,
                connection_type: connection?.connection_type,
                db_type: connection?.db_type,
                schema: formData.schema,
                table: formData.table,
                name: formData.name || connection?.name // Use provided name or connection name
            })
        } else {
            const payload = {
                ...formData,
                connection_type: connectionType,
                db_type: dbType,
            }
            await onSubmit(payload)
        }
    }

    // Render Steps
    const renderModeSelection = () => (
        <div className="space-y-4 py-4">
            <Tabs defaultValue="create" onValueChange={(v) => setMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">New Connection</TabsTrigger>
                    <TabsTrigger value="select">Existing Connection</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="pt-4">
                    {renderStep1()}
                </TabsContent>

                <TabsContent value="select" className="pt-4 space-y-4">
                    {isLoadingConnections ? (
                        <div className="w-full space-y-3 p-4">
                          <Skeleton className="h-10 w-full rounded-md" />
                          <Skeleton className="h-12 w-full rounded-md" />
                          <Skeleton className="h-12 w-full rounded-md" />
                        </div>
                    ) : existingConnections.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            No existing connections found. Create a new one.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Connection</Label>
                                <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a connection..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingConnections.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex items-center gap-2">
                                                    {c.connection_type === 'database' ? <Database className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                                                    {c.name}
                                                    <span className="text-xs text-muted-foreground">({c.db_type || 'API'})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedConnectionId && (
                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={handleTestExistingConnection}
                                        variant="outline"
                                        className="w-full"
                                        disabled={formData.testing}
                                    >
                                        {formData.testing ? 'Loading Metadata...' : 'Fetch Tables / Verify'}
                                    </Button>
                                </div>
                            )}

                            {/* If metadata loaded, show table selection */}
                            {selectedConnectionId && formData.testResult?.schemas && (
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Name for Data Model</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="My Data Model"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Schema</Label>
                                        <Select
                                            value={formData.schema}
                                            onValueChange={v => setFormData(p => ({ ...p, schema: v }))}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Schema" /></SelectTrigger>
                                            <SelectContent>
                                                {(formData.testResult.schemas || []).map((s: string) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Table</Label>
                                        <Select
                                            value={formData.table}
                                            onValueChange={v => setFormData(p => ({ ...p, table: v }))}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Table" /></SelectTrigger>
                                            <SelectContent>
                                                {(getTablesForSchema() || []).map((t: string) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )

    const renderStep1 = () => (
        <div className="space-y-4 py-2">
            <button
                onClick={() => { setConnectionType('database'); setStep(2) }}
                className="w-full p-6 text-left border-2 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                        <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-lg">Database</div>
                        <div className="text-sm text-muted-foreground mt-1">Connect to PostgreSQL, MySQL, etc.</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </button>
            <button
                onClick={() => { setConnectionType('api'); setStep(3) }}
                className="w-full p-6 text-left border-2 rounded-lg hover:border-primary hover:bg-primary/10 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                        <ExternalLink className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-lg">REST API</div>
                        <div className="text-sm text-muted-foreground mt-1">Connect to an external API Endpoint</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </button>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4 py-4">
            <button
                onClick={() => { setDbType('postgres'); setFormData(p => ({ ...p, port: '5432' })); setStep(3) }}
                className="w-full p-4 text-left border rounded-lg hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-4"
            >
                <div className="text-2xl">🐘</div>
                <div>
                    <div className="font-semibold">PostgreSQL</div>
                    <div className="text-sm text-muted-foreground">Connect to a PostgreSQL database</div>
                </div>
            </button>
            <button
                onClick={() => { setDbType('mysql'); setFormData(p => ({ ...p, port: '3306' })); setStep(3) }}
                className="w-full p-4 text-left border rounded-lg hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-4"
            >
                <div className="text-2xl">🗄️</div>
                <div>
                    <div className="font-semibold">MySQL</div>
                    <div className="text-sm text-muted-foreground">Connect to a MySQL database</div>
                </div>
            </button>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
                <Label>Connection Name</Label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="My External Data"
                />
            </div>

            {connectionType === 'database' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <Label>Host</Label>
                        <Input
                            value={formData.host}
                            onChange={e => setFormData(p => ({ ...p, host: e.target.value }))}
                            placeholder="db.example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Port</Label>
                        <Input
                            value={formData.port}
                            onChange={e => setFormData(p => ({ ...p, port: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Database Name</Label>
                        <Input
                            value={formData.database}
                            onChange={e => setFormData(p => ({ ...p, database: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                            value={formData.username}
                            onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                        />
                    </div>
                </div>
            )}

            {/* Test Connection Result UI */}
            <div className="flex items-center gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={formData.testing}
                >
                    {formData.testing ? 'Testing...' : 'Test Connection'}
                </Button>
                {formData.testResult && (
                    <span className={formData.testResult.success || formData.testResult.ok ? 'text-green-600 flex items-center gap-1' : 'text-red-600'}>
                        {formData.testResult.success || formData.testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : null}
                        {formData.testResult.success || formData.testResult.ok ? 'Success' : 'Failed'}
                    </span>
                )}
            </div>

            {/* If success, show schema/table selection for DB */}
            {connectionType === 'database' && (formData.testResult?.schemas || formData.testResult?.tablesBySchema) && (
                <div className="space-y-4 pt-4 border-t">
                    {dbType === 'postgres' && (
                        <div className="space-y-2">
                            <Label>Schema</Label>
                            <Select
                                value={formData.schema}
                                onValueChange={v => setFormData(p => ({ ...p, schema: v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Schema" /></SelectTrigger>
                                <SelectContent>
                                    {(formData.testResult.schemas || []).map((s: string) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Table</Label>
                        <Select
                            value={formData.table}
                            onValueChange={v => setFormData(p => ({ ...p, table: v }))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select Table" /></SelectTrigger>
                            <SelectContent>
                                {(getTablesForSchema() || []).map((t: string) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )

    const getTablesForSchema = () => {
        if (!formData.testResult?.tablesBySchema) return []
        const schema = formData.schema || (dbType === 'mysql' ? formData.database : 'public')
        return formData.testResult.tablesBySchema[schema] || []
    }

    const isSelectMode = mode === 'select'
    const canSubmit = isSelectMode
        ? !!selectedConnectionId && (!formData.testResult?.schemas || !!formData.table)
        : !!formData.name

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'select' ? 'Select Existing Connection' : (
                            <>
                                {step === 1 && 'Add Data Source'}
                                {step === 2 && 'Select Database Type'}
                                {step === 3 && 'Configure Connection'}
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'select' ? 'Choose an existing connection to create a data model' : (
                            <>
                                {step === 1 && 'Choose the type of data source you want to connect to'}
                                {step === 3 && 'Enter connection details'}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
{/* Main Content Area */}
                {step === 1 && renderModeSelection()}
                {step === 2 && mode === 'create' && renderStep2()}
                {step === 3 && mode === 'create' && renderStep3()}
                </DialogBody>
                <DialogFooter className="flex justify-between sm:justify-between">
                    {(step > 1 || mode === 'select' && step > 1) ? (
                        <Button variant="ghost" onClick={() => setStep(prev => prev - 1 as any)}>
                            <ChevronLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    ) : <div></div>}

                    <div>
                        <Button variant="outline" className="mr-2" onClick={handleClose}>Cancel</Button>
                        {(step === 3 || (mode === 'select' && selectedConnectionId)) && (
                            <Button onClick={handleSubmit} disabled={!canSubmit}>
                                {mode === 'select' ? 'Create Model' : 'Save & Create Model'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
