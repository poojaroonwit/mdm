'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'
import { OpenAIAgentSDKConfig } from './OpenAIAgentSDKConfig'
import { FormRow, FormSection } from '../style/components/FormRow'

interface AIModel {
  id: string
  name: string
  provider: string
  type: string
  description?: string
  maxTokens: number
  costPerToken: number
  isAvailable: boolean
  capabilities?: string[]
}

interface EngineConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function EngineConfig({ formData, setFormData }: EngineConfigProps) {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isFetchingWorkflowConfig, setIsFetchingWorkflowConfig] = useState(false)

  const engineType = formData.engineType || 'custom'

  useEffect(() => {
    if (engineType === 'openai') {
      loadAIModels()
    }
  }, [engineType])


  const loadAIModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        const openaiModels = (data.models || []).filter((model: AIModel) =>
          model.provider === 'openai' && model.isAvailable
        )
        setAvailableModels(openaiModels)
      } else {
        toast.error('Failed to load AI models')
      }
    } catch (error) {
      console.error('Error loading AI models:', error)
      toast.error('Failed to load AI models')
    } finally {
      setIsLoadingModels(false)
    }
  }


  return (
    <div className="space-y-4 pt-4">
      <FormSection>
        <FormRow label="Name" description="Name of your chatbot">
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Chatbot Name"
          />
        </FormRow>

        <FormRow label="Website" description="Website URL where the chatbot will be embedded">
          <Input
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
        </FormRow>

        <FormRow label="Description" description="Brief description of the chatbot's purpose">
          <Textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description of the chatbot"
            rows={3}
          />
        </FormRow>

        <FormRow label="Engine Type" description="Select the AI engine provider for this chatbot">
          <Select
            value={engineType}
            onValueChange={(v: string) => {
              const engineTypeValue = v as 'custom' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk'
              setFormData({
                ...formData,
                engineType: engineTypeValue,
                selectedModelId: undefined,
                selectedEngineId: undefined,
                apiEndpoint: engineTypeValue === 'custom' ? formData.apiEndpoint : ''
              })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom API Endpoint</SelectItem>
              <SelectItem value="openai">OpenAI Platform</SelectItem>
              <SelectItem value="chatkit">OpenAI ChatKit</SelectItem>
              <SelectItem value="openai-agent-sdk">OpenAI Agent SDK</SelectItem>
              <SelectItem value="dify">Dify v2</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
      </FormSection>

      {engineType === 'openai' && (
        <FormSection>
          <FormRow 
            label="OpenAI Model" 
            description="Select an OpenAI model to use for this chatbot. Make sure OpenAI is configured in API Configuration."
          >
            <Select
              value={formData.selectedModelId || ''}
              onValueChange={(v) => setFormData({ ...formData, selectedModelId: v })}
            >
              <SelectTrigger disabled={isLoadingModels}>
                <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select OpenAI model"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingModels ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading models...
                  </div>
                ) : availableModels.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No OpenAI models available. Please configure OpenAI in API Configuration.
                  </div>
                ) : (
                  availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        {model.description && (
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>
      )}

      {engineType === 'chatkit' && (
        <FormSection>
          <FormRow 
            label="Agent Builder Agent ID" 
            description="Enter your Agent Builder agent ID. This connects ChatKit to your agent."
          >
            <Input
              value={formData.chatkitAgentId || ''}
              onChange={(e) => setFormData({ ...formData, chatkitAgentId: e.target.value })}
              placeholder="agent_abc123..."
            />
          </FormRow>

          <FormRow 
            label="OpenAI API Key" 
            description="Your OpenAI API key for ChatKit authentication. You can also configure it globally in Admin → API Configuration."
          >
            <Input
              type="password"
              value={formData.chatkitApiKey || ''}
              onChange={(e) => setFormData({ ...formData, chatkitApiKey: e.target.value } as any)}
              placeholder="sk-..."
            />
          </FormRow>

          <div className="pt-2 border-t border-border/50 space-y-4">
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
              label="Max Chat Turns" 
              description="Maximum number of message turns allowed per session. If reached, the user will be notified to start a new chat."
            >
              <Input
                type="number"
                value={formData.maxChatTurns || ''}
                onChange={(e) => setFormData({ ...formData, maxChatTurns: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 20"
              />
            </FormRow>
          </div>
        </FormSection>
      )}

      {engineType === 'openai-agent-sdk' && (
        <OpenAIAgentSDKConfig
          formData={formData}
          setFormData={setFormData}
          isFetchingWorkflowConfig={isFetchingWorkflowConfig}
          setIsFetchingWorkflowConfig={setIsFetchingWorkflowConfig}
        />
      )}

      {engineType === 'dify' && (
        <FormSection>
          <FormRow 
            label="Dify API Base URL" 
            description="Base URL of your Dify instance (e.g., http://ncc-dify.qsncc.com)"
          >
            <Input
              value={formData.difyOptions?.apiBaseUrl || ''}
              onChange={(e) => setFormData({
                ...formData,
                difyOptions: {
                  ...formData.difyOptions,
                  apiBaseUrl: e.target.value
                }
              } as any)}
              placeholder="http://ncc-dify.qsncc.com"
            />
          </FormRow>

          <FormRow 
            label="Dify API Key" 
            description="Your Dify API key. Found in your Dify app settings."
          >
            <Input
              type="password"
              value={formData.difyApiKey || ''}
              onChange={(e) => setFormData({ ...formData, difyApiKey: e.target.value } as any)}
              placeholder="app-AAAAAAAAAAAAAAAAAAa"
            />
          </FormRow>

          <FormRow 
            label="Response Mode" 
            description="Choose streaming for real-time responses or blocking for complete responses"
          >
            <Select
              value={formData.difyOptions?.responseMode || 'streaming'}
              onValueChange={(v: string) => setFormData({
                ...formData,
                difyOptions: {
                  ...formData.difyOptions,
                  responseMode: v as 'streaming' | 'blocking'
                }
              } as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streaming">Streaming</SelectItem>
                <SelectItem value="blocking">Blocking</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow 
            label="User Identifier" 
            description="Unique identifier for the user (for conversation tracking)"
          >
            <Input
              value={formData.difyOptions?.user || ''}
              onChange={(e) => setFormData({
                ...formData,
                difyOptions: {
                  ...formData.difyOptions,
                  user: e.target.value
                }
              } as any)}
              placeholder="abc-123"
            />
          </FormRow>

          <FormRow 
            label="Input Variables" 
            description="JSON object with input variables for your Dify workflow/app. Leave empty object { } if not needed."
          >
            <Textarea
              value={JSON.stringify(formData.difyOptions?.inputs || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setFormData({
                    ...formData,
                    difyOptions: {
                      ...formData.difyOptions,
                      inputs: parsed
                    }
                  } as any)
                } catch (err) {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{"variable1": "value1", "variable2": "value2"}'
              rows={4}
              className="font-mono text-xs"
            />
          </FormRow>
        </FormSection>
      )}

      {engineType === 'custom' && (
        <FormSection>
          <FormRow 
            label="API Endpoint" 
            description="URL endpoint for your custom API (e.g., https://api.example.com/chat)"
          >
            <Input
              value={formData.apiEndpoint || ''}
              onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              placeholder="https://api.example.com/chat"
            />
          </FormRow>

          <FormRow 
            label="API Authentication Type" 
            description="Select the authentication method for your API"
          >
            <Select
              value={formData.apiAuthType || 'none'}
              onValueChange={(v: any) => setFormData({ ...formData, apiAuthType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="custom">Custom Header</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          {formData.apiAuthType !== 'none' && (
            <FormRow 
              label="Authentication Value" 
              description="Enter your API authentication token or key"
            >
              <Input
                type="password"
                value={formData.apiAuthValue || ''}
                onChange={(e) => setFormData({ ...formData, apiAuthValue: e.target.value })}
                placeholder="Enter auth value"
              />
            </FormRow>
          )}
        </FormSection>
      )}
    </div>
  )
}

