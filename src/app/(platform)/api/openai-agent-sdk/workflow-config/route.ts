import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowId, apiKey } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    if (!workflowId.startsWith('wf_')) {
      return NextResponse.json(
        { error: 'Invalid workflow ID format. Must start with wf_' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Try to fetch workflow configuration from OpenAI API
    // Note: The actual endpoint might vary, but we'll try the workflows endpoint
    let workflowConfig: any = null
    
    try {
      // Try different possible endpoints
      const endpoints = [
        `https://api.openai.com/v1/workflows/${workflowId}`,
        `https://api.openai.com/v1/assistants/${workflowId}`,
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            workflowConfig = await response.json()
            break
          }
        } catch (e) {
          // Continue to next endpoint
          continue
        }
      }

      // If no config found, return a structured response with defaults
      if (!workflowConfig) {
        return NextResponse.json({
          model: null,
          instructions: null,
          name: null,
          tools: null,
          message: 'Workflow configuration not available via API. The workflow may not expose configuration through the API, or the endpoint may not be available yet. You can manually configure the settings below.',
        })
      }

      // Extract relevant configuration from workflow
      const config = {
        model: workflowConfig.model || workflowConfig.agent?.model || workflowConfig.config?.model || null,
        instructions: workflowConfig.instructions || workflowConfig.agent?.instructions || workflowConfig.config?.instructions || null,
        name: workflowConfig.name || workflowConfig.title || null,
        tools: workflowConfig.tools || workflowConfig.agent?.tools || null,
        enableWebSearch: workflowConfig.enableWebSearch || workflowConfig.agent?.enableWebSearch || false,
        enableCodeInterpreter: workflowConfig.enableCodeInterpreter || workflowConfig.agent?.enableCodeInterpreter || false,
        enableComputerUse: workflowConfig.enableComputerUse || workflowConfig.agent?.enableComputerUse || false,
        enableImageGeneration: workflowConfig.enableImageGeneration || workflowConfig.agent?.enableImageGeneration || false,
        reasoningEffort: workflowConfig.reasoningEffort || workflowConfig.agent?.reasoningEffort || workflowConfig.config?.reasoningEffort || null,
        store: workflowConfig.store !== undefined ? workflowConfig.store : (workflowConfig.agent?.store !== undefined ? workflowConfig.agent.store : null),
        vectorStoreId: workflowConfig.vectorStoreId || workflowConfig.agent?.vectorStoreId || workflowConfig.config?.vectorStoreId || null,
        guardrails: workflowConfig.guardrails || workflowConfig.agent?.guardrails || workflowConfig.config?.guardrails || null,
        inputGuardrails: workflowConfig.inputGuardrails || workflowConfig.agent?.inputGuardrails || workflowConfig.config?.inputGuardrails || null,
        outputGuardrails: workflowConfig.outputGuardrails || workflowConfig.agent?.outputGuardrails || workflowConfig.config?.outputGuardrails || null,
        customFunctions: workflowConfig.customFunctions || workflowConfig.agent?.customFunctions || workflowConfig.config?.customFunctions || null,
        multiAgentConfig: workflowConfig.multiAgentConfig || workflowConfig.agent?.multiAgentConfig || workflowConfig.config?.multiAgentConfig || null,
        lifecycleHooks: workflowConfig.lifecycleHooks || workflowConfig.agent?.lifecycleHooks || workflowConfig.config?.lifecycleHooks || null,
        connectors: workflowConfig.connectors || workflowConfig.agent?.connectors || workflowConfig.config?.connectors || null,
        agentLoopConfig: workflowConfig.agentLoopConfig || workflowConfig.agent?.agentLoopConfig || workflowConfig.config?.agentLoopConfig || null,
        spreadsheetTools: workflowConfig.spreadsheetTools || workflowConfig.agent?.spreadsheetTools || workflowConfig.config?.spreadsheetTools || null,
        mcpServers: workflowConfig.mcpServers || workflowConfig.agent?.mcpServers || workflowConfig.config?.mcpServers || null, // MCP (Model Context Protocol) servers
      }

      return NextResponse.json(config)
    } catch (error) {
      console.error('Error fetching workflow config:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch workflow configuration',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Workflow config API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

