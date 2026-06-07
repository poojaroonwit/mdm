'use client'

import { useState, useEffect } from 'react'
import { Accordion } from '@/components/ui/accordion'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Chatbot } from '../types'
import {
  AgentLoopSection,
  ConnectorsSection,
  CustomFunctionsSection,
  LifecycleHooksSection,
  MultiAgentSection
} from './OpenAIAgentSDKAdvancedSections'
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
        <CustomFunctionsSection
          customFunctions={customFunctions}
          editingFunction={editingFunction}
          functionForm={functionForm}
          saving={saving}
          setEditingFunction={setEditingFunction}
          setFunctionForm={setFunctionForm}
          setShowFunctionDialog={setShowFunctionDialog}
          showFunctionDialog={showFunctionDialog}
          saveCustomFunction={saveCustomFunction}
          deleteCustomFunction={deleteCustomFunction}
        />
        <MultiAgentSection
          multiAgentForm={multiAgentForm}
          saving={saving}
          setMultiAgentForm={setMultiAgentForm}
          saveMultiAgentConfig={saveMultiAgentConfig}
        />
        <LifecycleHooksSection
          editingHook={editingHook}
          hookForm={hookForm}
          lifecycleHooks={lifecycleHooks}
          saving={saving}
          setEditingHook={setEditingHook}
          setHookForm={setHookForm}
          setShowHookDialog={setShowHookDialog}
          showHookDialog={showHookDialog}
          saveLifecycleHook={saveLifecycleHook}
          deleteLifecycleHook={deleteLifecycleHook}
        />
        <ConnectorsSection
          chatbotId={chatbot?.id}
          connectorForm={connectorForm}
          connectors={connectors}
          saving={saving}
          loadAllConfigs={loadAllConfigs}
          setConnectorForm={setConnectorForm}
          setShowConnectorDialog={setShowConnectorDialog}
          showConnectorDialog={showConnectorDialog}
          saveConnector={saveConnector}
        />
        <AgentLoopSection
          agentLoopForm={agentLoopForm}
          saving={saving}
          setAgentLoopForm={setAgentLoopForm}
          saveAgentLoopConfig={saveAgentLoopConfig}
        />
      </Accordion>
    </div>
  )
}

