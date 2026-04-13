'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Save, Plus, Trash2, Code, Users, GitBranch as HookIcon, Plug, Settings, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Chatbot } from '../types'
import { isUuid } from '@/lib/validation'

interface OpenAIAgentSDKAdvancedFeaturesProps {
  chatbot: Chatbot | null
}

export function OpenAIAgentSDKAdvancedFeatures({ chatbot }: OpenAIAgentSDKAdvancedFeaturesProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Custom Functions State
  const [customFunctions, setCustomFunctions] = useState<any[]>([])
  const [showFunctionDialog, setShowFunctionDialog] = useState(false)
  const [editingFunction, setEditingFunction] = useState<any>(null)
  const [functionForm, setFunctionForm] = useState({
    name: '',
    description: '',
    parameters: '{}',
    endpoint: '',
    code: '',
    executionType: 'api' as 'api' | 'inline' | 'webhook',
    enabled: true,
  })

  // Multi-Agent State
  const [multiAgentConfig, setMultiAgentConfig] = useState<any>(null)
  const [multiAgentForm, setMultiAgentForm] = useState({
    enabled: false,
    agents: [] as any[],
    coordinationStrategy: 'sequential' as 'sequential' | 'parallel' | 'conditional',
  })

  // Lifecycle Hooks State
  const [lifecycleHooks, setLifecycleHooks] = useState<any[]>([])
  const [showHookDialog, setShowHookDialog] = useState(false)
  const [editingHook, setEditingHook] = useState<any>(null)
  const [hookForm, setHookForm] = useState({
    hookType: 'before_execution' as 'before_execution' | 'after_execution' | 'on_tool_call' | 'on_error' | 'on_handoff',
    enabled: true,
    handlerType: 'api' as 'api' | 'inline' | 'webhook',
    handlerUrl: '',
    handlerCode: '',
  })

  // Connectors State
  const [connectors, setConnectors] = useState<any[]>([])
  const [showConnectorDialog, setShowConnectorDialog] = useState(false)
  const [connectorForm, setConnectorForm] = useState({
    connectorType: 'gmail' as 'gmail' | 'google_drive' | 'github' | 'slack',
    enabled: true,
    credentials: {} as any,
    config: {} as any,
  })

  // Agent Loop State
  const [agentLoopConfig, setAgentLoopConfig] = useState<any>(null)
  const [agentLoopForm, setAgentLoopForm] = useState({
    maxIterations: null as number | null,
    timeout: null as number | null,
    enableHumanInLoop: false,
    stopConditions: '{}',
  })

  useEffect(() => {
    if (chatbot?.id) {
      loadAllConfigs()
    }
  }, [chatbot?.id])

  const loadAllConfigs = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    // Chatbots stored in localStorage may have non-UUID IDs
    if (!isUuid(chatbot.id)) {
      // Skip API calls for non-UUID chatbot IDs (localStorage chatbots)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [functionsRes, multiAgentRes, hooksRes, connectorsRes, loopRes] = await Promise.all([
        fetch(`/api/chatbots/${chatbot.id}/custom-functions`),
        fetch(`/api/chatbots/${chatbot.id}/multi-agent-config`),
        fetch(`/api/chatbots/${chatbot.id}/lifecycle-hooks`),
        fetch(`/api/chatbots/${chatbot.id}/connectors`),
        fetch(`/api/chatbots/${chatbot.id}/agent-loop-config`),
      ])

      if (functionsRes.ok) {
        const data = await functionsRes.json()
        setCustomFunctions(data.functions || [])
      }

      if (multiAgentRes.ok) {
        const data = await multiAgentRes.json()
        if (data.config) {
          setMultiAgentConfig(data.config)
          setMultiAgentForm({
            enabled: data.config.enabled || false,
            agents: data.config.agents || [],
            coordinationStrategy: data.config.coordinationStrategy || 'sequential',
          })
        }
      }

      if (hooksRes.ok) {
        const data = await hooksRes.json()
        setLifecycleHooks(data.hooks || [])
      }

      if (connectorsRes.ok) {
        const data = await connectorsRes.json()
        setConnectors(data.connectors || [])
      }

      if (loopRes.ok) {
        const data = await loopRes.json()
        if (data.config) {
          setAgentLoopConfig(data.config)
          setAgentLoopForm({
            maxIterations: data.config.maxIterations,
            timeout: data.config.timeout,
            enableHumanInLoop: data.config.enableHumanInLoop || false,
            stopConditions: JSON.stringify(data.config.stopConditions || {}, null, 2),
          })
        }
      }
    } catch (error) {
      console.error('Error loading configs:', error)
      toast.error('Failed to load configurations')
    } finally {
      setLoading(false)
    }
  }

  const saveCustomFunction = async () => {
    if (!chatbot?.id) return

    setSaving(true)
    try {
      const params = JSON.parse(functionForm.parameters || '{}')
      const url = editingFunction
        ? `/api/chatbots/${chatbot.id}/custom-functions/${editingFunction.id}`
        : `/api/chatbots/${chatbot.id}/custom-functions`

      const response = await fetch(url, {
        method: editingFunction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: functionForm.name,
          description: functionForm.description,
          parameters: params,
          endpoint: functionForm.endpoint || null,
          code: functionForm.code || null,
          executionType: functionForm.executionType,
          enabled: functionForm.enabled,
        }),
      })

      if (response.ok) {
        toast.success(editingFunction ? 'Function updated' : 'Function created')
        setShowFunctionDialog(false)
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
        loadAllConfigs()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save custom function')
    } finally {
      setSaving(false)
    }
  }

  const deleteCustomFunction = async (functionId: string) => {
    if (!chatbot?.id) return

    if (!confirm('Are you sure you want to delete this function?')) return

    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/custom-functions/${functionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Function deleted')
        loadAllConfigs()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete function')
    }
  }

  const saveMultiAgentConfig = async () => {
    if (!chatbot?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/multi-agent-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(multiAgentForm),
      })

      if (response.ok) {
        toast.success('Multi-agent configuration saved')
        loadAllConfigs()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save multi-agent configuration')
    } finally {
      setSaving(false)
    }
  }

  const saveLifecycleHook = async () => {
    if (!chatbot?.id) return

    setSaving(true)
    try {
      const url = editingHook
        ? `/api/chatbots/${chatbot.id}/lifecycle-hooks/${editingHook.id}`
        : `/api/chatbots/${chatbot.id}/lifecycle-hooks`

      const response = await fetch(url, {
        method: editingHook ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hookForm),
      })

      if (response.ok) {
        toast.success(editingHook ? 'Hook updated' : 'Hook created')
        setShowHookDialog(false)
        setEditingHook(null)
        setHookForm({
          hookType: 'before_execution',
          enabled: true,
          handlerType: 'api',
          handlerUrl: '',
          handlerCode: '',
        })
        loadAllConfigs()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save lifecycle hook')
    } finally {
      setSaving(false)
    }
  }

  const deleteLifecycleHook = async (hookId: string) => {
    if (!chatbot?.id) return

    if (!confirm('Are you sure you want to delete this hook?')) return

    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/lifecycle-hooks/${hookId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Hook deleted')
        loadAllConfigs()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete hook')
    }
  }

  const saveConnector = async () => {
    if (!chatbot?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectorForm),
      })

      if (response.ok) {
        toast.success('Connector created')
        setShowConnectorDialog(false)
        setConnectorForm({
          connectorType: 'gmail',
          enabled: true,
          credentials: {},
          config: {},
        })
        loadAllConfigs()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save connector')
    } finally {
      setSaving(false)
    }
  }

  const saveAgentLoopConfig = async () => {
    if (!chatbot?.id) return

    setSaving(true)
    try {
      const stopConditions = JSON.parse(agentLoopForm.stopConditions || '{}')
      const response = await fetch(`/api/chatbots/${chatbot.id}/agent-loop-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxIterations: agentLoopForm.maxIterations || null,
          timeout: agentLoopForm.timeout || null,
          enableHumanInLoop: agentLoopForm.enableHumanInLoop,
          stopConditions,
        }),
      })

      if (response.ok) {
        toast.success('Agent loop configuration saved')
        loadAllConfigs()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save agent loop configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-0">
      <Accordion type="multiple">
      {/* Custom Functions Accordion */}
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
                {customFunctions.map((func) => (
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

      {/* Multi-Agent Accordion */}
      <AccordionItem value="multi-agent" className="border-b border-border/50 px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Multi-Agent
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Agent Coordination</CardTitle>
            <CardDescription>
              Configure multiple agents with handoff rules for complex workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Multi-Agent Coordination</Label>
              <Switch
                checked={multiAgentForm.enabled}
                onCheckedChange={(checked) => setMultiAgentForm({ ...multiAgentForm, enabled: checked })}
              />
            </div>
            {multiAgentForm.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Coordination Strategy</Label>
                  <Select
                    value={multiAgentForm.coordinationStrategy}
                    onValueChange={(value: string) => setMultiAgentForm({ ...multiAgentForm, coordinationStrategy: value as 'sequential' | 'parallel' | 'conditional' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="parallel">Parallel</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Multi-agent configuration is managed through workflow config when useWorkflowConfig is enabled.</p>
                  <p className="mt-2">To configure agents and handoff rules, use the OpenAI Agent Builder UI.</p>
                </div>
              </div>
            )}
            <Button onClick={saveMultiAgentConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </CardContent>
        </Card>
        </AccordionContent>
      </AccordionItem>

      {/* Lifecycle Hooks Accordion */}
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
                {lifecycleHooks.map((hook) => (
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

      {/* Connectors Accordion */}
      <AccordionItem value="connectors" className="border-b border-border/50 px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Connectors
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Third-Party Connectors</CardTitle>
                <CardDescription>
                  Connect to external services like Gmail, Google Drive, GitHub, etc.
                </CardDescription>
              </div>
              <Dialog open={showConnectorDialog} onOpenChange={setShowConnectorDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setConnectorForm({
                      connectorType: 'gmail',
                      enabled: true,
                      credentials: {},
                      config: {},
                    })
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connector
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Connector</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Connector Type</Label>
                      <Select
                        value={connectorForm.connectorType}
                        onValueChange={(value: any) => setConnectorForm({ ...connectorForm, connectorType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="google_drive">Google Drive</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>OAuth credentials and configuration are managed through the connector setup.</p>
                      <p className="mt-2">Configure OAuth in the Integrations section.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConnectorDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveConnector} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {connectors.length > 0 ? (
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <div key={connector.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{connector.connectorType.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {connector.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <Switch
                      checked={connector.enabled}
                      onCheckedChange={async (checked) => {
                        try {
                          await fetch(`/api/chatbots/${chatbot?.id}/connectors/${connector.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ enabled: checked }),
                          })
                          loadAllConfigs()
                        } catch (error) {
                          toast.error('Failed to update connector')
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No connectors configured. Click "Add Connector" to create one.
              </div>
            )}
          </CardContent>
        </Card>
        </AccordionContent>
      </AccordionItem>

      {/* Agent Loop Accordion */}
      <AccordionItem value="agent-loop" className="border-b border-border/50 px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Agent Loop
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Loop Configuration</CardTitle>
            <CardDescription>
              Configure agent loop behavior, iterations, and stopping conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Iterations</Label>
                <Input
                  type="number"
                  value={agentLoopForm.maxIterations || ''}
                  onChange={(e) => setAgentLoopForm({ ...agentLoopForm, maxIterations: parseInt(e.target.value) || null })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label>Timeout (ms)</Label>
                <Input
                  type="number"
                  value={agentLoopForm.timeout || ''}
                  onChange={(e) => setAgentLoopForm({ ...agentLoopForm, timeout: parseInt(e.target.value) || null })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Human-in-the-Loop</Label>
                <p className="text-xs text-muted-foreground">Pause workflow for human input when needed</p>
              </div>
              <Switch
                checked={agentLoopForm.enableHumanInLoop}
                onCheckedChange={(checked) => setAgentLoopForm({ ...agentLoopForm, enableHumanInLoop: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stop Conditions (JSON)</Label>
              <Textarea
                value={agentLoopForm.stopConditions}
                onChange={(e) => setAgentLoopForm({ ...agentLoopForm, stopConditions: e.target.value })}
                placeholder='{"type": "max_iterations", "value": 10}'
                rows={5}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={saveAgentLoopConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </CardContent>
        </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  )
}

