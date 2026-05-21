'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileCode, History, ArrowUp, ArrowDown, Plus, Eye } from 'lucide-react'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { Migration } from '../types'
import { runApiAction } from '@/lib/api-action'

export function SchemaMigrations() {
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null)
  const [newMigration, setNewMigration] = useState({
    version: '',
    name: '',
    description: '',
    migrationType: 'CREATE_TABLE',
    upSql: '',
    downSql: '',
  })

  useEffect(() => {
    loadMigrations()
  }, [])

  const loadMigrations = async () => {
    try {
      const response = await fetch('/api/schema/migrations')
      if (response.ok) {
        const data = await response.json()
        setMigrations(data)
      }
    } catch (error) {
      console.error('Failed to load migrations:', error)
      toast.error('Failed to load migrations')
    } finally {
      setLoading(false)
    }
  }

  const createMigration = async () => {
    if (!newMigration.version.trim()) {
      toast.error('Version is required')
      return
    }
    if (!newMigration.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!newMigration.upSql.trim()) {
      toast.error('Up SQL is required')
      return
    }

    setSubmitting(true)
    try {
      await runApiAction({
        request: () => fetch('/api/schema/migrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMigration),
        }),
        successMessage: 'Migration created',
        errorMessage: 'Failed to create migration',
        onSuccess: async () => {
          setShowCreateDialog(false)
          setNewMigration({
            version: '',
            name: '',
            description: '',
            migrationType: 'CREATE_TABLE',
            upSql: '',
            downSql: '',
          })
          await loadMigrations()
        },
        onError: (error) => {
          console.error('Failed to create migration:', error)
        }
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      applied: 'default',
      rolled_back: 'destructive',
    }

    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading migrations...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCode className="w-8 h-8" />
            Schema Migrations
          </h1>
          <p className="text-muted-foreground mt-2">Manage version-controlled database schema migrations</p>
        </div>
        <CrudDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          title="Create Schema Migration"
          description="Create a new version-controlled schema migration"
          contentClassName="max-w-2xl"
          trigger={(
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Migration
            </Button>
          )}
          bodyClassName="space-y-4"
          footer={(
            <>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createMigration} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Migration'}
              </Button>
            </>
          )}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Version</label>
              <Input
                value={newMigration.version}
                onChange={(e) => setNewMigration({ ...newMigration, version: e.target.value })}
                placeholder="e.g., 001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newMigration.name}
                onChange={(e) => setNewMigration({ ...newMigration, name: e.target.value })}
                placeholder="e.g., Add users table"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={newMigration.description}
                onChange={(e) => setNewMigration({ ...newMigration, description: e.target.value })}
                placeholder="Migration description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Migration Type</label>
              <select
                className="w-full p-2 border rounded"
                value={newMigration.migrationType}
                onChange={(e) => setNewMigration({ ...newMigration, migrationType: e.target.value })}
              >
                <option value="CREATE_TABLE">Create Table</option>
                <option value="ALTER_TABLE">Alter Table</option>
                <option value="DROP_TABLE">Drop Table</option>
                <option value="CREATE_INDEX">Create Index</option>
                <option value="DROP_INDEX">Drop Index</option>
                <option value="DATA_MIGRATION">Data Migration</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Up SQL</label>
              <Textarea
                value={newMigration.upSql}
                onChange={(e) => setNewMigration({ ...newMigration, upSql: e.target.value })}
                placeholder="CREATE TABLE users (...);"
                rows={5}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Down SQL (Rollback)</label>
              <Textarea
                value={newMigration.downSql}
                onChange={(e) => setNewMigration({ ...newMigration, downSql: e.target.value })}
                placeholder="DROP TABLE users;"
                rows={3}
                className="font-mono"
              />
            </div>
          </div>
        </CrudDialog>
      </div>

      {migrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No migrations found</p>
            <p className="text-sm text-muted-foreground mt-2">Migrations will appear here once created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {migrations.map((migration) => (
            <Card key={migration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {migration.name}
                      {getStatusBadge(migration.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Version {migration.version} • {migration.migrationType} • Created{' '}
                      {new Date(migration.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMigration(migration)
                        setShowViewDialog(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {migration.status === 'applied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await runApiAction({
                            request: () => fetch(`/api/schema/migrations/${migration.id}/rollback`, {
                              method: 'POST',
                            }),
                            successMessage: 'Migration rolled back',
                            errorMessage: 'Failed to rollback migration',
                            onSuccess: () => loadMigrations()
                          })
                        }}
                      >
                        <ArrowDown className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                    {migration.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await runApiAction({
                            request: () => fetch(`/api/schema/migrations/${migration.id}/apply`, {
                              method: 'POST',
                            }),
                            successMessage: 'Migration applied',
                            errorMessage: 'Failed to apply migration',
                            onSuccess: () => loadMigrations()
                          })
                        }}
                      >
                        <ArrowUp className="w-4 h-4 mr-1" />
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <History className="w-4 h-4" />
                    {migration.appliedAt ? `Applied ${new Date(migration.appliedAt).toLocaleString()}` : 'Not applied'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CrudDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        title={selectedMigration?.name || 'Migration Details'}
        description={`Version ${selectedMigration?.version} • ${selectedMigration?.migrationType}`}
        contentClassName="max-w-3xl max-h-[90vh]"
        bodyClassName="space-y-4 overflow-y-auto"
        footer={(
          <Button variant="outline" onClick={() => setShowViewDialog(false)}>
            Close
          </Button>
        )}
      >
        {selectedMigration && (
          <div className="space-y-4">
            {selectedMigration.description && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedMigration.description}</p>
              </div>
            )}
            <Tabs defaultValue="up">
              <TabsList>
                <TabsTrigger value="up">Up SQL</TabsTrigger>
                <TabsTrigger value="down">Down SQL</TabsTrigger>
              </TabsList>
              <TabsContent value="up">
                <pre className="p-3 bg-muted rounded text-sm overflow-x-auto">
                  {selectedMigration.upSql || 'No up SQL defined'}
                </pre>
              </TabsContent>
              <TabsContent value="down">
                <pre className="p-3 bg-muted rounded text-sm overflow-x-auto">
                  {selectedMigration.downSql || 'No down SQL defined'}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CrudDialog>
    </div>
  )
}
