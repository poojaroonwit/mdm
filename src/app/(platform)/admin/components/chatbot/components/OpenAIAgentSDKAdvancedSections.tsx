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
import { Loader2, Plug, Plus, Save, Settings, Users } from 'lucide-react'
export { CustomFunctionsSection } from './OpenAIAgentSDKCustomFunctionsSection'
export { LifecycleHooksSection } from './OpenAIAgentSDKLifecycleHooksSection'
import toast from 'react-hot-toast'

export function MultiAgentSection(props: any) {
  const { multiAgentForm, saving, setMultiAgentForm, saveMultiAgentConfig } = props

  return (
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
  )
}

export function ConnectorsSection(props: any) {
  const {
    chatbotId,
    connectorForm,
    connectors,
    saving,
    loadAllConfigs,
    setConnectorForm,
    setShowConnectorDialog,
    showConnectorDialog,
    saveConnector,
  } = props

  return (
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
                {connectors.map((connector: any) => (
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
                          await fetch(`/api/chatbots/${chatbotId}/connectors/${connector.id}`, {
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
  )
}

export function AgentLoopSection(props: any) {
  const { agentLoopForm, saving, setAgentLoopForm, saveAgentLoopConfig } = props

  return (
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
  )
}
