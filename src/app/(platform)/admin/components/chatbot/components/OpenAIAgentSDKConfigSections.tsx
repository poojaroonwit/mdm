'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import { Chatbot } from '../types'
import { FormRow, FormSection } from '../style/components/FormRow'

interface ConfigSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function WorkflowFileSelectorSection({
  formData,
  setFormData,
}: ConfigSectionProps) {
  const [availableWorkflows, setAvailableWorkflows] = useState<Array<{ name: string; filename: string; path: string }>>([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setIsLoadingWorkflows(true)
    try {
      const response = await fetch('/chat-handler/workflows/list')
      if (response.ok) {
        const data = await response.json()
        setAvailableWorkflows(data.workflows || [])
      } else {
        console.error('Failed to load workflows')
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setIsLoadingWorkflows(false)
    }
  }

  const selectedWorkflow = (formData as any).openaiAgentSdkWorkflowFile || 'qsncc-workflow'

  return (
    <FormSection className="pt-2 border-t border-border/50">
      <FormRow
        label="Workflow File"
        description="Select the workflow file from src/lib/workflows to use for this chatbot. The workflow file must export a runWorkflow function."
      >
        <Select
          value={selectedWorkflow}
          onValueChange={(value) => {
            setFormData({ ...formData, openaiAgentSdkWorkflowFile: value } as any)
          }}
        >
          <SelectTrigger disabled={isLoadingWorkflows}>
            <SelectValue placeholder="Select a workflow file" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingWorkflows ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading workflows...</div>
            ) : availableWorkflows.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No workflows found</div>
            ) : (
              availableWorkflows.map((workflow) => (
                <SelectItem key={workflow.name} value={workflow.name}>
                  {workflow.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </FormRow>
    </FormSection>
  )
}

interface AgentCredentialsSectionProps extends ConfigSectionProps {
  agentId: string
  isWorkflow: boolean
  globalApiKeyExists: boolean
}

export function AgentCredentialsSection({
  formData,
  setFormData,
  agentId,
  isWorkflow,
  globalApiKeyExists,
}: AgentCredentialsSectionProps) {
  const loadGlobalApiKey = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        const openaiProvider = data.providers?.find((provider: any) => provider.provider === 'openai')
        if (openaiProvider?.isConfigured) {
          const keyResponse = await fetch(`/api/admin/ai-providers/${openaiProvider.id}/key`)
          if (keyResponse.ok) {
            const keyData = await keyResponse.json()
            if (keyData.apiKey) {
              setFormData({ ...formData, openaiAgentSdkApiKey: keyData.apiKey } as any)
              toast.success('Global API key loaded')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading global API key:', error)
      toast.error('Failed to load global API key')
    }
  }

  return (
    <FormSection>
      <FormRow
        label="Agent/Workflow ID"
        description="Enter your OpenAI Assistant ID (asst_) or Workflow ID (wf_). Workflows use the OpenAI Agents SDK, while Assistants use the Assistants API."
      >
        <div className="space-y-2">
          <Input
            value={agentId}
            onChange={(e) => {
              const newAgentId = e.target.value
              setFormData({ ...formData, openaiAgentSdkAgentId: newAgentId } as any)
            }}
            placeholder="asst_abc123... or wf_abc123..."
          />
          {isWorkflow && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              For workflows, only the Workflow ID and API Key are required. The system will automatically use the workflow's configuration. All other settings are optional overrides.
            </p>
          )}
        </div>
      </FormRow>

      <FormRow
        label="OpenAI API Key"
        description="Your OpenAI API key for Agent SDK authentication. 2-way sync enabled: Keys saved here sync to API Key Management, and you can load keys from API Key Management."
      >
        <div className="space-y-2">
          <Input
            type="password"
            value={formData.openaiAgentSdkApiKey || ''}
            onChange={(e) => setFormData({ ...formData, openaiAgentSdkApiKey: e.target.value } as any)}
            placeholder="sk-..."
          />
          {globalApiKeyExists && !formData.openaiAgentSdkApiKey && (
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                A global OpenAI API key is configured. You can use it or enter a chatbot-specific key.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadGlobalApiKey}
                className="h-7 text-xs"
              >
                Use Global API Key
              </Button>
            </div>
          )}
          {formData.openaiAgentSdkApiKey && (
            <p className="text-xs text-green-600 dark:text-green-400">
              This API key will be synced to the global API Key Management page (2-way sync enabled).
            </p>
          )}
        </div>
      </FormRow>
    </FormSection>
  )
}

interface AgentModelSettingsSectionProps extends ConfigSectionProps {
  isWorkflow: boolean
  useWorkflowConfig: boolean
}

export function AgentModelSettingsSection({
  formData,
  setFormData,
  isWorkflow,
  useWorkflowConfig,
}: AgentModelSettingsSectionProps) {
  if (useWorkflowConfig && isWorkflow) {
    return null
  }

  return (
    <FormSection>
      <FormRow
        label="Model"
        description={useWorkflowConfig ? 'Model to use for the agent (workflow override). If not specified, defaults to gpt-4o.' : 'Model to use for the agent. If not specified, defaults to gpt-4o.'}
      >
        <Input
          value={formData.openaiAgentSdkModel || ''}
          onChange={(e) => setFormData({ ...formData, openaiAgentSdkModel: e.target.value } as any)}
          placeholder="gpt-4o, gpt-5, etc."
        />
      </FormRow>

      <FormRow
        label="Agent Instructions"
        description="Instructions for the agent. If not specified, uses default instructions. For workflows, this may be overridden by the workflow configuration."
      >
        <Textarea
          value={formData.openaiAgentSdkInstructions || ''}
          onChange={(e) => setFormData({ ...formData, openaiAgentSdkInstructions: e.target.value } as any)}
          placeholder="You are a helpful assistant..."
          className="min-h-[80px]"
        />
      </FormRow>

      <ReasoningSettings formData={formData} setFormData={setFormData} />
      <TokenSettings formData={formData} setFormData={setFormData} />
      <VectorStoreSettings formData={formData} setFormData={setFormData} />
      <ToolSettings formData={formData} setFormData={setFormData} />
    </FormSection>
  )
}

function ReasoningSettings({ formData, setFormData }: ConfigSectionProps) {
  return (
    <>
      <FormRow label="Reasoning Effort" description="Reasoning effort for gpt-5 models. Controls how much the model reasons before responding.">
        <Select
          value={formData.openaiAgentSdkReasoningEffort || 'default'}
          onValueChange={(value) => setFormData({ ...formData, openaiAgentSdkReasoningEffort: value === 'default' ? undefined : value as 'low' | 'medium' | 'high' } as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow label="Store Reasoning Traces" description="Whether to store reasoning traces for analysis">
        <Switch
          checked={formData.openaiAgentSdkStore || false}
          onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkStore: checked } as any)}
        />
      </FormRow>
    </>
  )
}

function TokenSettings({ formData, setFormData }: ConfigSectionProps) {
  return (
    <>
      <FormRow label="Max Prompt Tokens" description="Maximum number of tokens to use for the prompt. If not specified, uses default.">
        <Input
          type="number"
          value={formData.openaiAgentSdkMaxPromptTokens || ''}
          onChange={(e) => setFormData({ ...formData, openaiAgentSdkMaxPromptTokens: e.target.value ? parseInt(e.target.value) : undefined } as any)}
          placeholder="e.g., 20000"
        />
      </FormRow>

      <FormRow label="Max Completion Tokens" description="Maximum number of tokens to use for the completion. If not specified, uses default.">
        <Input
          type="number"
          value={formData.openaiAgentSdkMaxCompletionTokens || ''}
          onChange={(e) => setFormData({ ...formData, openaiAgentSdkMaxCompletionTokens: e.target.value ? parseInt(e.target.value) : undefined } as any)}
          placeholder="e.g., 1000"
        />
      </FormRow>

      <FormRow label="Truncation Strategy" description="Strategy for truncating messages when token limits are reached.">
        <div className="space-y-4">
          <Select
            value={formData.openaiAgentSdkTruncationStrategy?.type || 'auto'}
            onValueChange={(value) => setFormData({
              ...formData,
              openaiAgentSdkTruncationStrategy: {
                ...formData.openaiAgentSdkTruncationStrategy,
                type: value as 'auto' | 'last_messages',
              },
            } as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Managed by OpenAI)</SelectItem>
              <SelectItem value="last_messages">Last Messages (Truncate oldest)</SelectItem>
            </SelectContent>
          </Select>

          {formData.openaiAgentSdkTruncationStrategy?.type === 'last_messages' && (
            <div className="pt-2">
              <Label className="text-[10px] text-muted-foreground mb-1.5 block uppercase font-bold tracking-wider">Last Messages Count</Label>
              <Input
                type="number"
                value={formData.openaiAgentSdkTruncationStrategy?.last_messages || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  openaiAgentSdkTruncationStrategy: {
                    ...formData.openaiAgentSdkTruncationStrategy,
                    last_messages: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                } as any)}
                placeholder="e.g., 10"
              />
            </div>
          )}
        </div>
      </FormRow>
    </>
  )
}

function VectorStoreSettings({ formData, setFormData }: ConfigSectionProps) {
  return (
    <FormRow
      label="Vector Store ID"
      description="Vector store ID for file search tool. If provided, enables file search capability for the agent."
    >
      <Input
        value={formData.openaiAgentSdkVectorStoreId || ''}
        onChange={(e) => setFormData({ ...formData, openaiAgentSdkVectorStoreId: e.target.value } as any)}
        placeholder="vs_abc123..."
      />
    </FormRow>
  )
}

function ToolSettings({ formData, setFormData }: ConfigSectionProps) {
  return (
    <div className="pt-2 border-t border-border/50 space-y-4">
      <div className="mb-4">
        <h5 className="text-sm font-medium">Tools</h5>
      </div>
      <ToolSwitch
        label="Web Search"
        description="Allow the agent to search the internet for real-time information"
        checked={formData.openaiAgentSdkEnableWebSearch || false}
        onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableWebSearch: checked } as any)}
      />
      <ToolSwitch
        label="Code Interpreter"
        description="Enable code execution in a sandboxed environment for data analysis and computation"
        checked={formData.openaiAgentSdkEnableCodeInterpreter || false}
        onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableCodeInterpreter: checked } as any)}
      />
      <ToolSwitch
        label="Computer Use"
        description="Enable automated interactions with graphical user interfaces"
        checked={formData.openaiAgentSdkEnableComputerUse || false}
        onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableComputerUse: checked } as any)}
      />
      <ToolSwitch
        label="Image Generation"
        description="Enable image creation based on textual prompts"
        checked={formData.openaiAgentSdkEnableImageGeneration || false}
        onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableImageGeneration: checked } as any)}
      />
    </div>
  )
}

function ToolSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <FormRow label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </FormRow>
  )
}
