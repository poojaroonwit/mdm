'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Code, GitBranch as HookIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react'

export function LifecycleHooksSection(props: any) {
  const {
    editingHook,
    hookForm,
    lifecycleHooks,
    saving,
    setEditingHook,
    setHookForm,
    setShowHookDialog,
    showHookDialog,
    saveLifecycleHook,
    deleteLifecycleHook,
  } = props

  return (
<AccordionItem value="lifecycle-hooks" className="border-b border-border/50 px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <HookIcon className="h-4 w-4" />
            Lifecycle Hooks
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lifecycle Hooks</CardTitle>
                <CardDescription>
                  Execute custom code at different stages of agent execution
                </CardDescription>
              </div>
              <Dialog open={showHookDialog} onOpenChange={setShowHookDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingHook(null)
                    setHookForm({
                      hookType: 'before_execution',
                      enabled: true,
                      handlerType: 'api',
                      handlerUrl: '',
                      handlerCode: '',
                    })
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingHook ? 'Edit' : 'Create'} Lifecycle Hook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hook Type</Label>
                      <Select
                        value={hookForm.hookType}
                        onValueChange={(value: any) => setHookForm({ ...hookForm, hookType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before_execution">Before Execution</SelectItem>
                          <SelectItem value="after_execution">After Execution</SelectItem>
                          <SelectItem value="on_tool_call">On Tool Call</SelectItem>
                          <SelectItem value="on_error">On Error</SelectItem>
                          <SelectItem value="on_handoff">On Handoff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Handler Type</Label>
                      <Select
                        value={hookForm.handlerType}
                        onValueChange={(value: string) => setHookForm({ ...hookForm, handlerType: value as 'api' | 'inline' | 'webhook' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API Endpoint</SelectItem>
                          <SelectItem value="inline">Inline Code</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hookForm.handlerType === 'api' || hookForm.handlerType === 'webhook' ? (
                      <div className="space-y-2">
                        <Label>Handler URL</Label>
                        <Input
                          value={hookForm.handlerUrl}
                          onChange={(e) => setHookForm({ ...hookForm, handlerUrl: e.target.value })}
                          placeholder="https://api.example.com/hook"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Handler Code</Label>
                        <Textarea
                          value={hookForm.handlerCode}
                          onChange={(e) => setHookForm({ ...hookForm, handlerCode: e.target.value })}
                          placeholder="// Your hook code here"
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Enabled</Label>
                      <Switch
                        checked={hookForm.enabled}
                        onCheckedChange={(checked) => setHookForm({ ...hookForm, enabled: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowHookDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveLifecycleHook} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {editingHook ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {lifecycleHooks.length > 0 ? (
              <div className="space-y-2">
                {lifecycleHooks.map((hook: any) => (
                  <div key={hook.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{hook.hookType.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        Handler: {hook.handlerType} {hook.enabled ? '(Enabled)' : '(Disabled)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingHook(hook)
                          setHookForm({
                            hookType: hook.hookType,
                            enabled: hook.enabled,
                            handlerType: hook.handlerType,
                            handlerUrl: hook.handlerUrl || '',
                            handlerCode: hook.handlerCode || '',
                          })
                          setShowHookDialog(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteLifecycleHook(hook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No lifecycle hooks defined. Click "Add Hook" to create one.
              </div>
            )}
          </CardContent>
        </Card>
        </AccordionContent>
      </AccordionItem>
  )
}
