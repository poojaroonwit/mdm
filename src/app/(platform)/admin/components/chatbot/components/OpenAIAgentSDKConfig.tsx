'use client'

import { useState, useEffect } from 'react'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'
import {
  AgentCredentialsSection,
  AgentModelSettingsSection,
  WorkflowFileSelectorSection,
} from './OpenAIAgentSDKConfigSections'
import { WorkflowConfigPreview } from './OpenAIAgentSDKWorkflowPreview'

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
      <AgentCredentialsSection
        formData={formData}
        setFormData={setFormData}
        agentId={agentId}
        isWorkflow={isWorkflow}
        globalApiKeyExists={globalApiKeyExists}
      />

      {isWorkflow && (
        <WorkflowFileSelectorSection
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {false && (
        <WorkflowConfigPreview
          agentId={agentId}
          fetchedConfig={fetchedConfig}
          formData={formData}
          isFetchingWorkflowConfig={isFetchingWorkflowConfig}
          isWorkflow={isWorkflow}
          onFetchWorkflowConfig={handleFetchWorkflowConfig}
          onHideFetchedConfig={() => setShowFetchedConfig(false)}
          showFetchedConfig={showFetchedConfig}
        />
      )}

      <AgentModelSettingsSection
        formData={formData}
        setFormData={setFormData}
        isWorkflow={isWorkflow}
        useWorkflowConfig={useWorkflowConfig}
      />
    </div>
  )
}
