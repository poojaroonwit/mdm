'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Rocket, Loader2 } from 'lucide-react'
import { Chatbot } from '../types'
interface WorkflowConfigPreviewProps {
  agentId: string
  fetchedConfig: any
  formData: Partial<Chatbot>
  isFetchingWorkflowConfig: boolean
  isWorkflow: boolean
  onFetchWorkflowConfig: () => void
  onHideFetchedConfig: () => void
  showFetchedConfig: boolean
}

export function WorkflowConfigPreview({
  agentId,
  fetchedConfig,
  formData,
  isFetchingWorkflowConfig,
  isWorkflow,
  onFetchWorkflowConfig,
  onHideFetchedConfig,
  showFetchedConfig,
}: WorkflowConfigPreviewProps) {
  if (!isWorkflow) {
    return null
  }

  return (
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
            onClick={onFetchWorkflowConfig}
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
            <Button type="button" variant="ghost" size="sm" onClick={onHideFetchedConfig} className="h-6 w-6 p-0">
              x
            </Button>
          </div>
          <div className="space-y-2 text-xs">
            {fetchedConfig.name && <ConfigLine label="Name" value={fetchedConfig.name} />}
            {fetchedConfig.model && <ConfigLine label="Model" value={fetchedConfig.model} />}
            {fetchedConfig.instructions && (
              <div>
                <strong className="text-blue-800 dark:text-blue-200">Instructions:</strong>
                <p className="text-blue-700 dark:text-blue-300 mt-1 whitespace-pre-wrap">
                  {fetchedConfig.instructions.substring(0, 200)}
                  {fetchedConfig.instructions.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
            {fetchedConfig.reasoningEffort && <ConfigLine label="Reasoning Effort" value={fetchedConfig.reasoningEffort} />}
            <ConfigLine label="Store Traces" value={fetchedConfig.store !== undefined ? (fetchedConfig.store ? 'Yes' : 'No') : 'Not specified'} />
            {fetchedConfig.vectorStoreId && <ConfigLine label="Vector Store ID" value={fetchedConfig.vectorStoreId} mono />}
            <FetchedTools config={fetchedConfig} />
            <FetchedGuardrails config={fetchedConfig} />
            {fetchedConfig.message && (
              <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                <p className="text-blue-600 dark:text-blue-400 italic">{fetchedConfig.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ConfigLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p>
      <strong className="text-blue-800 dark:text-blue-200">{label}:</strong>{' '}
      <span className={`text-blue-700 dark:text-blue-300 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </p>
  )
}

function FetchedTools({ config }: { config: any }) {
  return (
    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
      <strong className="text-blue-800 dark:text-blue-200">Tools:</strong>
      <div className="mt-1 space-y-1">
        <p className="text-blue-700 dark:text-blue-300">Web Search: {config.enableWebSearch ? 'Enabled' : 'Disabled'}</p>
        <p className="text-blue-700 dark:text-blue-300">Code Interpreter: {config.enableCodeInterpreter ? 'Enabled' : 'Disabled'}</p>
        <p className="text-blue-700 dark:text-blue-300">Computer Use: {config.enableComputerUse ? 'Enabled' : 'Disabled'}</p>
        <p className="text-blue-700 dark:text-blue-300">Image Generation: {config.enableImageGeneration ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  )
}

function FetchedGuardrails({ config }: { config: any }) {
  if (!config.guardrails && !config.inputGuardrails && !config.outputGuardrails) {
    return null
  }

  return (
    <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
      <strong className="text-blue-800 dark:text-blue-200">Guardrails:</strong>
      <div className="mt-1 space-y-1">
        {config.inputGuardrails && (
          <p className="text-blue-700 dark:text-blue-300">
            Input: {Array.isArray(config.inputGuardrails) ? `${config.inputGuardrails.length} configured` : 'Enabled'}
          </p>
        )}
        {config.outputGuardrails && (
          <p className="text-blue-700 dark:text-blue-300">
            Output: {Array.isArray(config.outputGuardrails) ? `${config.outputGuardrails.length} configured` : 'Enabled'}
          </p>
        )}
        {config.guardrails && !config.inputGuardrails && !config.outputGuardrails && (
          <p className="text-blue-700 dark:text-blue-300">Configured</p>
        )}
      </div>
    </div>
  )
}
