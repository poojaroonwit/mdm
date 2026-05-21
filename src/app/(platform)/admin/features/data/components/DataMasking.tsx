'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Plus, Eye, EyeOff, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { CrudDialog } from '@/components/ui/crud-dialog'
import toast from 'react-hot-toast'
import { MaskingRule } from '../types'
import { runApiAction } from '@/lib/api-action'

export function DataMasking() {
  const [rules, setRules] = useState<MaskingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<MaskingRule | null>(null)
  const [newRule, setNewRule] = useState({
    name: '',
    tableName: '',
    columnName: '',
    strategy: 'email',
    enabled: true
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const response = await fetch('/api/data-masking/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error('Failed to load masking rules:', error)
      toast.error('Failed to load masking rules')
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    if (!newRule.name.trim()) {
      toast.error('Rule name is required')
      return
    }
    if (!newRule.tableName.trim()) {
      toast.error('Table name is required')
      return
    }
    if (!newRule.columnName.trim()) {
      toast.error('Column name is required')
      return
    }

    setSubmitting(true)
    try {
      await runApiAction({
        request: () => fetch('/api/data-masking/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRule)
        }),
        successMessage: 'Masking rule created',
        errorMessage: 'Failed to create masking rule',
        onSuccess: async () => {
          setShowCreateDialog(false)
          setNewRule({ name: '', tableName: '', columnName: '', strategy: 'email', enabled: true })
          await loadRules()
        },
        onError: (error) => {
          console.error('Failed to create masking rule:', error)
        }
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    await runApiAction({
      request: () => fetch(`/api/data-masking/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      }),
      successMessage: `Rule ${enabled ? 'enabled' : 'disabled'}`,
      errorMessage: 'Failed to toggle rule',
      onSuccess: () => loadRules(),
      onError: (error) => {
        console.error('Failed to toggle rule:', error)
      }
    })
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this masking rule?')) {
      return
    }

    await runApiAction({
      request: () => fetch(`/api/data-masking/rules/${ruleId}`, {
        method: 'DELETE'
      }),
      successMessage: 'Rule deleted',
      errorMessage: 'Failed to delete rule',
      onSuccess: () => loadRules(),
      onError: (error) => {
        console.error('Failed to delete rule:', error)
      }
    })
  }

  const editRule = (rule: MaskingRule) => {
    setEditingRule(rule)
    setNewRule({
      name: rule.name,
      tableName: rule.tableName || '',
      columnName: rule.columnName || '',
      strategy: rule.strategy,
      enabled: rule.enabled
    })
    setShowEditDialog(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading masking rules...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" />
            Data Masking
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure data masking rules for sensitive information
          </p>
        </div>
        <CrudDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          title="Create Masking Rule"
          description="Define how sensitive data should be masked"
          trigger={(
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Masking Rule
            </Button>
          )}
          bodyClassName="space-y-4"
          footer={(
            <>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createRule} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Rule'}
              </Button>
            </>
          )}
        >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rule Name</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Mask Email Addresses"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Table Name</label>
                <Input
                  value={newRule.tableName}
                  onChange={(e) => setNewRule({ ...newRule, tableName: e.target.value })}
                  placeholder="users"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Column Name</label>
                <Input
                  value={newRule.columnName}
                  onChange={(e) => setNewRule({ ...newRule, columnName: e.target.value })}
                  placeholder="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Masking Strategy</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newRule.strategy}
                  onChange={(e) => setNewRule({ ...newRule, strategy: e.target.value })}
                >
                  <option value="email">Email</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full Masking</option>
                  <option value="hash">Hash</option>
                  <option value="redact">Redact</option>
                </select>
              </div>
            </div>
        </CrudDialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No masking rules found</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Masking Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? (
                      <Eye className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 mr-1" />
                    )}
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <CardDescription>
                  {rule.tableName}.{rule.columnName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Strategy:</span>
                    <Badge variant="outline">{rule.strategy}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleRule(rule.id, !rule.enabled)}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 mr-1" />
                      )}
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <CrudDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Masking Rule"
        description="Update the masking rule configuration"
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false)
              setEditingRule(null)
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!editingRule) return
              
              if (!newRule.name.trim()) {
                toast.error('Rule name is required')
                return
              }
              if (!newRule.tableName.trim()) {
                toast.error('Table name is required')
                return
              }
              if (!newRule.columnName.trim()) {
                toast.error('Column name is required')
                return
              }

              setSubmitting(true)
              await runApiAction({
                request: () => fetch(`/api/data-masking/rules/${editingRule.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newRule)
                }),
                successMessage: 'Rule updated',
                errorMessage: 'Failed to update rule',
                onSuccess: async () => {
                  setShowEditDialog(false)
                  setEditingRule(null)
                  await loadRules()
                },
                onError: (error) => {
                  console.error('Failed to update rule:', error)
                }
              })
              setSubmitting(false)
            }} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Rule'}
            </Button>
          </>
        )}
      >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g., Mask Email Addresses"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Table Name</label>
              <Input
                value={newRule.tableName}
                onChange={(e) => setNewRule({ ...newRule, tableName: e.target.value })}
                placeholder="users"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Column Name</label>
              <Input
                value={newRule.columnName}
                onChange={(e) => setNewRule({ ...newRule, columnName: e.target.value })}
                placeholder="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Masking Strategy</label>
              <select
                className="w-full p-2 border rounded"
                value={newRule.strategy}
                onChange={(e) => setNewRule({ ...newRule, strategy: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="partial">Partial</option>
                <option value="full">Full Masking</option>
                <option value="hash">Hash</option>
                <option value="redact">Redact</option>
              </select>
            </div>
          </div>
      </CrudDialog>
    </div>
  )
}

