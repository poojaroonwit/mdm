'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Rocket, Loader2 } from 'lucide-react'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'
import { FormRow, FormSection } from '../style/components/FormRow'

// Workflow File Selector Component
function WorkflowFileSelectorComponent({
  formData,
  setFormData,
}: {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}) {
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

interface OpenAIAgentSDKConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  isFetchingWorkflowConfig: boolean
  setIsFetchingWorkflowConfig: (value: boolean) => void
}

export function OpenAIAgentSDKConfig({
  formData,
  setFormData,
  isFetchingWorkflowConfig,
  setIsFetchingWorkflowConfig,
}: OpenAIAgentSDKConfigProps) {
  const [fetchedConfig, setFetchedConfig] = useState<any>(null)
  const [showFetchedConfig, setShowFetchedConfig] = useState(false)
  const [configApiSupported, setConfigApiSupported] = useState<boolean | null>(null) // null = not checked yet, true = supported, false = not supported
  const [globalApiKeyExists, setGlobalApiKeyExists] = useState(false)
  const [isLoadingGlobalKey, setIsLoadingGlobalKey] = useState(false)
  
  const agentId = formData.openaiAgentSdkAgentId || ''
  const isWorkflow = agentId.startsWith('wf_')
  // For workflows, always use workflow configuration automatically (per AgentSDK documentation)
  // The Agents SDK is designed to dynamically pull configurations from workflows
  const useWorkflowConfig = isWorkflow

  const handleFetchWorkflowConfig = async () => {
    if (!agentId || !isWorkflow) {
      toast.error('Please enter a valid workflow ID (starting with wf_)')
      return
    }

    if (!formData.openaiAgentSdkApiKey) {
      toast.error('Please enter an API key first')
      return
    }

    setIsFetchingWorkflowConfig(true)
    try {
      const response = await fetch('/chat-handler/openai-agent-sdk/workflow-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: agentId,
          apiKey: formData.openaiAgentSdkApiKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || 'Failed to fetch workflow config')
      }

      const config = await response.json()
      
      // Check if API supports fetching config
      // If message indicates config not available, mark API as not supported
      if (config.message && (config.message.includes('not available') || config.message.includes('Using defaults'))) {
        setConfigApiSupported(false)
      } else {
        // If we got actual config data (not just nulls), API is supported
        const hasConfigData = config.model || config.instructions || config.name || config.tools || 
                             config.enableWebSearch !== undefined || config.enableCodeInterpreter !== undefined ||
                             config.enableComputerUse !== undefined || config.enableImageGeneration !== undefined
        setConfigApiSupported(hasConfigData)
      }
      
      // Store fetched config to display
      setFetchedConfig(config)
      setShowFetchedConfig(true)
      
      setFormData((prev: any) => ({
        ...prev,
        openaiAgentSdkModel: config.model || prev.openaiAgentSdkModel,
        openaiAgentSdkInstructions: config.instructions || prev.openaiAgentSdkInstructions,
        openaiAgentSdkReasoningEffort: config.reasoningEffort || prev.openaiAgentSdkReasoningEffort,
        openaiAgentSdkStore: config.store !== null && config.store !== undefined ? config.store : prev.openaiAgentSdkStore,
        openaiAgentSdkVectorStoreId: config.vectorStoreId || prev.openaiAgentSdkVectorStoreId,
        openaiAgentSdkEnableWebSearch: config.enableWebSearch !== undefined ? config.enableWebSearch : prev.openaiAgentSdkEnableWebSearch,
        openaiAgentSdkEnableCodeInterpreter: config.enableCodeInterpreter !== undefined ? config.enableCodeInterpreter : prev.openaiAgentSdkEnableCodeInterpreter,
        openaiAgentSdkEnableComputerUse: config.enableComputerUse !== undefined ? config.enableComputerUse : prev.openaiAgentSdkEnableComputerUse,
        openaiAgentSdkEnableImageGeneration: config.enableImageGeneration !== undefined ? config.enableImageGeneration : prev.openaiAgentSdkEnableImageGeneration,
        openaiAgentSdkGuardrails: config.guardrails !== undefined ? config.guardrails : prev.openaiAgentSdkGuardrails,
        openaiAgentSdkInputGuardrails: config.inputGuardrails !== undefined ? config.inputGuardrails : prev.openaiAgentSdkInputGuardrails,
        openaiAgentSdkOutputGuardrails: config.outputGuardrails !== undefined ? config.outputGuardrails : prev.openaiAgentSdkOutputGuardrails,
        openaiAgentSdkGreeting: config.greeting || config.uiConfig?.greeting || prev.openaiAgentSdkGreeting,
        openaiAgentSdkPlaceholder: config.placeholder || config.uiConfig?.placeholder || prev.openaiAgentSdkPlaceholder,
        openaiAgentSdkBackgroundColor: config.backgroundColor || config.uiConfig?.backgroundColor || prev.openaiAgentSdkBackgroundColor,
        openaiAgentSdkUseWorkflowConfig: true,
      }))

      if (config.message) {
        // If message indicates config not available, show as warning
        if (config.message.includes('not available') || config.message.includes('Using defaults')) {
          toast(config.message, {
            icon: '⚠️',
            duration: 4000,
          })
        } else {
          toast.success(config.message)
        }
      } else {
        toast.success('Workflow configuration fetched and applied successfully')
      }
    } catch (error) {
      console.error('Error fetching workflow config:', error)
      // If fetch fails, mark API as not supported
      setConfigApiSupported(false)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch workflow configuration')
    } finally {
      setIsFetchingWorkflowConfig(false)
    }
  }

  // Load global OpenAI API key on mount and when formData changes
  useEffect(() => {
    const loadGlobalApiKey = async () => {
      setIsLoadingGlobalKey(true)
      try {
        const response = await fetch('/api/admin/ai-providers')
        if (response.ok) {
          const data = await response.json()
          const openaiProvider = data.providers?.find((p: any) => p.provider === 'openai')
          if (openaiProvider?.isConfigured) {
            setGlobalApiKeyExists(true)
            // If chatbot doesn't have an API key, auto-populate from global key
            // This enables 2-way sync: API Key Management → Chat UI
            if (!formData.openaiAgentSdkApiKey) {
              // Note: We don't auto-fill here to avoid overwriting user input
              // But we show that global key is available
            }
          } else {
            setGlobalApiKeyExists(false)
          }
        }
      } catch (error) {
        console.error('Error loading global API key:', error)
      } finally {
        setIsLoadingGlobalKey(false)
      }
    }

    loadGlobalApiKey()
  }, [formData.openaiAgentSdkApiKey]) // Reload when chatbot API key changes

  // Check if API supports config fetching on mount or when workflow ID/API key changes
  useEffect(() => {
    // Reset support status when workflow ID or API key changes
    setConfigApiSupported(null)
    
    const checkConfigApiSupport = async () => {
      // Only check if we have workflow ID and API key
      if (!isWorkflow || !agentId || !formData.openaiAgentSdkApiKey) {
        return
      }

      // Try a test fetch to see if API is supported
      try {
        const response = await fetch('/chat-handler/openai-agent-sdk/workflow-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: agentId,
            apiKey: formData.openaiAgentSdkApiKey,
          }),
        })

        if (response.ok) {
          const config = await response.json()
          // If message indicates config not available, API is not supported
          if (config.message && (config.message.includes('not available') || config.message.includes('Using defaults'))) {
            setConfigApiSupported(false)
          } else {
            // Check if we got actual config data
            const hasConfigData = config.model || config.instructions || config.name || config.tools || 
                                 config.enableWebSearch !== undefined || config.enableCodeInterpreter !== undefined ||
                                 config.enableComputerUse !== undefined || config.enableImageGeneration !== undefined
            setConfigApiSupported(hasConfigData)
          }
        } else {
          setConfigApiSupported(false)
        }
      } catch (error) {
        // Silently fail - API is not supported
        setConfigApiSupported(false)
      }
    }

    checkConfigApiSupport()
  }, [agentId, formData.openaiAgentSdkApiKey, isWorkflow])

  return (
    <div className="space-y-4">
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
                const isNewWorkflow = newAgentId.startsWith('wf_')
                // Auto-enable workflow config for workflows (background mode)
                if (isNewWorkflow) {
                  setFormData({ 
                    ...formData, 
                    openaiAgentSdkAgentId: newAgentId, 
                    // Workflow config is always used automatically for workflows
                  } as any)
                } else {
                  setFormData({ ...formData, openaiAgentSdkAgentId: newAgentId } as any)
                }
              }}
              placeholder="asst_abc123... or wf_abc123..."
            />
            {isWorkflow && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                ✓ For workflows, only the Workflow ID and API Key are required. The system will automatically use the workflow's configuration. All other settings are optional overrides.
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
                  ℹ️ A global OpenAI API key is configured. You can use it or enter a chatbot-specific key.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/ai-providers')
                      if (response.ok) {
                        const data = await response.json()
                        const openaiProvider = data.providers?.find((p: any) => p.provider === 'openai')
                        if (openaiProvider?.isConfigured) {
                          // Get the actual API key from the backend (it will decrypt it)
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
                  }}
                  className="h-7 text-xs"
                >
                  Use Global API Key
                </Button>
              </div>
            )}
            {formData.openaiAgentSdkApiKey && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ This API key will be synced to the global API Key Management page (2-way sync enabled).
              </p>
            )}
          </div>
        </FormRow>
      </FormSection>

      {/* Workflow File Selection (for workflows only) */}
      {isWorkflow && (
        <WorkflowFileSelectorComponent
          formData={formData}
          setFormData={setFormData}
        />
      )}


      {/* Workflow configuration is automatically used in the background - no UI needed */}
      {false && isWorkflow && (
        <>
          <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Automatic Workflow Configuration</Label>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The Agents SDK automatically pulls all configuration from your workflow. Settings below are optional overrides.
              </p>
            </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchWorkflowConfig}
                  disabled={isFetchingWorkflowConfig || !agentId || !formData.openaiAgentSdkApiKey}
                className="ml-2"
                >
                  {isFetchingWorkflowConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                    Preview Config
                    </>
                  )}
                </Button>
            </div>
          </div>

          {showFetchedConfig && fetchedConfig && (
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Fetched Workflow Configuration</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFetchedConfig(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2 text-xs">
                {fetchedConfig.name && (
                  <p><strong className="text-blue-800 dark:text-blue-200">Name:</strong> <span className="text-blue-700 dark:text-blue-300">{fetchedConfig.name}</span></p>
                )}
                {fetchedConfig.model && (
                  <p><strong className="text-blue-800 dark:text-blue-200">Model:</strong> <span className="text-blue-700 dark:text-blue-300">{fetchedConfig.model}</span></p>
                )}
                {fetchedConfig.instructions && (
                  <div>
                    <strong className="text-blue-800 dark:text-blue-200">Instructions:</strong>
                    <p className="text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-wrap">{fetchedConfig.instructions.substring(0, 200)}{fetchedConfig.instructions.length > 200 ? '...' : ''}</p>
                  </div>
                )}
                {fetchedConfig.reasoningEffort && (
                  <p><strong className="text-blue-800 dark:text-blue-200">Reasoning Effort:</strong> <span className="text-blue-700 dark:text-blue-300">{fetchedConfig.reasoningEffort}</span></p>
                )}
                <p><strong className="text-blue-800 dark:text-blue-200">Store Traces:</strong> <span className="text-blue-700 dark:text-blue-300">{fetchedConfig.store !== undefined ? (fetchedConfig.store ? 'Yes' : 'No') : 'Not specified'}</span></p>
                {fetchedConfig.vectorStoreId && (
                  <p><strong className="text-blue-800 dark:text-blue-200">Vector Store ID:</strong> <span className="text-blue-700 dark:text-blue-300 font-mono text-xs">{fetchedConfig.vectorStoreId}</span></p>
                )}
                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <strong className="text-blue-800 dark:text-blue-200">Tools:</strong>
                  <div className="mt-1 space-y-1">
                    <p className="text-blue-700 dark:text-blue-300">• Web Search: {fetchedConfig.enableWebSearch ? 'Enabled' : 'Disabled'}</p>
                    <p className="text-blue-700 dark:text-blue-300">• Code Interpreter: {fetchedConfig.enableCodeInterpreter ? 'Enabled' : 'Disabled'}</p>
                    <p className="text-blue-700 dark:text-blue-300">• Computer Use: {fetchedConfig.enableComputerUse ? 'Enabled' : 'Disabled'}</p>
                    <p className="text-blue-700 dark:text-blue-300">• Image Generation: {fetchedConfig.enableImageGeneration ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                {(fetchedConfig.guardrails || fetchedConfig.inputGuardrails || fetchedConfig.outputGuardrails) && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                    <strong className="text-blue-800 dark:text-blue-200">Guardrails:</strong>
                    <div className="mt-1 space-y-1">
                      {fetchedConfig.inputGuardrails && (
                        <p className="text-blue-700 dark:text-blue-300">• Input: {Array.isArray(fetchedConfig.inputGuardrails) ? `${fetchedConfig.inputGuardrails.length} configured` : 'Enabled'}</p>
                      )}
                      {fetchedConfig.outputGuardrails && (
                        <p className="text-blue-700 dark:text-blue-300">• Output: {Array.isArray(fetchedConfig.outputGuardrails) ? `${fetchedConfig.outputGuardrails.length} configured` : 'Enabled'}</p>
                      )}
                      {fetchedConfig.guardrails && !fetchedConfig.inputGuardrails && !fetchedConfig.outputGuardrails && (
                        <p className="text-blue-700 dark:text-blue-300">• Configured</p>
                      )}
                    </div>
                  </div>
                )}
                {fetchedConfig.message && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-blue-600 dark:text-blue-400 italic">{fetchedConfig.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {(!useWorkflowConfig || !isWorkflow) && (
        <FormSection>
          <FormRow 
            label="Model" 
            description={useWorkflowConfig ? "Model to use for the agent (workflow override). If not specified, defaults to gpt-4o." : "Model to use for the agent. If not specified, defaults to gpt-4o."}
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

          <FormRow 
            label="Reasoning Effort" 
            description="Reasoning effort for gpt-5 models. Controls how much the model reasons before responding."
          >
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

          <FormRow 
            label="Store Reasoning Traces" 
            description="Whether to store reasoning traces for analysis"
          >
            <Switch
              checked={formData.openaiAgentSdkStore || false}
              onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkStore: checked } as any)}
            />
          </FormRow>

          <FormRow 
            label="Max Prompt Tokens" 
            description="Maximum number of tokens to use for the prompt. If not specified, uses default."
          >
            <Input
              type="number"
              value={formData.openaiAgentSdkMaxPromptTokens || ''}
              onChange={(e) => setFormData({ ...formData, openaiAgentSdkMaxPromptTokens: e.target.value ? parseInt(e.target.value) : undefined } as any)}
              placeholder="e.g., 20000"
            />
          </FormRow>

          <FormRow 
            label="Max Completion Tokens" 
            description="Maximum number of tokens to use for the completion. If not specified, uses default."
          >
            <Input
              type="number"
              value={formData.openaiAgentSdkMaxCompletionTokens || ''}
              onChange={(e) => setFormData({ ...formData, openaiAgentSdkMaxCompletionTokens: e.target.value ? parseInt(e.target.value) : undefined } as any)}
              placeholder="e.g., 1000"
            />
          </FormRow>

          <FormRow 
            label="Truncation Strategy" 
            description="Strategy for truncating messages when token limits are reached."
          >
            <div className="space-y-4">
              <Select
                value={formData.openaiAgentSdkTruncationStrategy?.type || 'auto'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  openaiAgentSdkTruncationStrategy: { 
                    ...formData.openaiAgentSdkTruncationStrategy, 
                    type: value as 'auto' | 'last_messages' 
                  } 
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
                        last_messages: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    } as any)}
                    placeholder="e.g., 10"
                  />
                </div>
              )}
            </div>
          </FormRow>

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

          <div className="pt-2 border-t border-border/50 space-y-4">
            <div className="mb-4">
              <h5 className="text-sm font-medium">Tools</h5>
            </div>
            
            <FormRow 
              label="Web Search" 
              description="Allow the agent to search the internet for real-time information"
            >
              <Switch
                checked={formData.openaiAgentSdkEnableWebSearch || false}
                onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableWebSearch: checked } as any)}
              />
            </FormRow>

            <FormRow 
              label="Code Interpreter" 
              description="Enable code execution in a sandboxed environment for data analysis and computation"
            >
              <Switch
                checked={formData.openaiAgentSdkEnableCodeInterpreter || false}
                onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableCodeInterpreter: checked } as any)}
              />
            </FormRow>

            <FormRow 
              label="Computer Use" 
              description="Enable automated interactions with graphical user interfaces"
            >
              <Switch
                checked={formData.openaiAgentSdkEnableComputerUse || false}
                onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableComputerUse: checked } as any)}
              />
            </FormRow>

            <FormRow 
              label="Image Generation" 
              description="Enable image creation based on textual prompts"
            >
              <Switch
                checked={formData.openaiAgentSdkEnableImageGeneration || false}
                onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkEnableImageGeneration: checked } as any)}
              />
            </FormRow>
          </div>
        </FormSection>
      )}

    </div>
  )
}

