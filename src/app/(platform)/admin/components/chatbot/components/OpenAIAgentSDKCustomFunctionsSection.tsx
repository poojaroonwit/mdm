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

export function CustomFunctionsSection(props: any) {
  const {
    customFunctions,
    editingFunction,
    functionForm,
    saving,
    setEditingFunction,
    setFunctionForm,
    setShowFunctionDialog,
    showFunctionDialog,
    saveCustomFunction,
    deleteCustomFunction,
  } = props

  return (
<AccordionItem value="custom-functions" className="border-b border-border/50 px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Custom Functions
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Function Tools</CardTitle>
                <CardDescription>
                  Define custom functions that agents can call during execution
                </CardDescription>
              </div>
              <Dialog open={showFunctionDialog} onOpenChange={setShowFunctionDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingFunction(null)
                    setFunctionForm({
                      name: '',
                      description: '',
                      parameters: '{}',
                      endpoint: '',
                      code: '',
                      executionType: 'api',
                      enabled: true,
                    })
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Function
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingFunction ? 'Edit' : 'Create'} Custom Function</DialogTitle>
                    <DialogDescription>
                      Define a function that the agent can call. The function will be available as a tool.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Function Name</Label>
                      <Input
                        value={functionForm.name}
                        onChange={(e) => setFunctionForm({ ...functionForm, name: e.target.value })}
                        placeholder="get_weather"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={functionForm.description}
                        onChange={(e) => setFunctionForm({ ...functionForm, description: e.target.value })}
                        placeholder="Get the current weather for a location"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parameters (JSON Schema)</Label>
                      <Textarea
                        value={functionForm.parameters}
                        onChange={(e) => setFunctionForm({ ...functionForm, parameters: e.target.value })}
                        placeholder='{"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}'
                        rows={5}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Execution Type</Label>
                      <Select
                        value={functionForm.executionType}
                        onValueChange={(value: string) => setFunctionForm({ ...functionForm, executionType: value as 'api' | 'inline' | 'webhook' })}
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
                    {functionForm.executionType === 'api' || functionForm.executionType === 'webhook' ? (
                      <div className="space-y-2">
                        <Label>Endpoint URL</Label>
                        <Input
                          value={functionForm.endpoint}
                          onChange={(e) => setFunctionForm({ ...functionForm, endpoint: e.target.value })}
                          placeholder="https://api.example.com/function"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>JavaScript Code</Label>
                        <Textarea
                          value={functionForm.code}
                          onChange={(e) => setFunctionForm({ ...functionForm, code: e.target.value })}
                          placeholder="// Your function code here&#10;return { result: 'success' }"
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Enabled</Label>
                      <Switch
                        checked={functionForm.enabled}
                        onCheckedChange={(checked) => setFunctionForm({ ...functionForm, enabled: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowFunctionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveCustomFunction} disabled={saving || !functionForm.name || !functionForm.description}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {editingFunction ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {customFunctions.length > 0 ? (
              <div className="space-y-2">
                {customFunctions.map((func: any) => (
                  <div key={func.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{func.name}</div>
                      <div className="text-sm text-muted-foreground">{func.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Type: {func.executionType} {func.enabled ? '(Enabled)' : '(Disabled)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFunction(func)
                          setFunctionForm({
                            name: func.name,
                            description: func.description,
                            parameters: JSON.stringify(func.parameters, null, 2),
                            endpoint: func.endpoint || '',
                            code: func.code || '',
                            executionType: func.executionType,
                            enabled: func.enabled,
                          })
                          setShowFunctionDialog(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCustomFunction(func.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No custom functions defined. Click "Add Function" to create one.
              </div>
            )}
          </CardContent>
        </Card>
        </AccordionContent>
      </AccordionItem>
  )
}
