import React from 'react'

interface UseChatKitHookOptionsArgs {
  agentId: string | undefined
  apiKey: string | undefined
  chatbot: any
  chatkitOptions: any
  deploymentType: string
  serverOrigin: string
  theme: any
  useChatKitInRegularStyle: boolean
}

export function useChatKitHookOptions({
  agentId,
  apiKey,
  chatbot,
  chatkitOptions,
  deploymentType,
  serverOrigin,
  theme,
  useChatKitInRegularStyle
}: UseChatKitHookOptionsArgs) {
  return React.useMemo(() => ({
    api: {
      async getClientSecret(existing: any) {
        try {
          // Use absolute URL to ensure API calls go to the chatbot server, not the host website
          // Using /next-api/ prefix to bypass Nginx /api collision with PostgREST
          const apiUrl = `${serverOrigin}/next-api/chatkit/session`
          
          const commonMeta = {
            agentId,
            chatbotId: chatbot.id,
            spaceId: (chatbot as any).spaceId || undefined,
            deploymentType,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            language: typeof navigator !== 'undefined' ? navigator.language : undefined,
            timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
          }

          if (existing) {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit', // Don't send cookies - this is a public API
              body: JSON.stringify({ ...commonMeta, existing }),
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
              console.error('❌ Session refresh failed:', errorData)
              const errorMessage = errorData.details
                ? `${errorData.error}: ${errorData.details}`
                : errorData.error || 'Failed to refresh ChatKit session'
              throw new Error(errorMessage)
            }
            const { client_secret } = await res.json()
            return client_secret
          }

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit', // Don't send cookies - this is a public API
            body: JSON.stringify(commonMeta),
          })
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
            console.error('❌ ChatKit session creation failed:', {
              status: res.status,
              statusText: res.statusText,
              errorData
            })
            const errorMessage = errorData.details
              ? `${errorData.error}: ${errorData.details}`
              : errorData.error || 'Failed to create ChatKit session'
            throw new Error(errorMessage)
          }
          const sessionData = await res.json()
          if (!sessionData.client_secret) {
            console.error('❌ No client secret in response')
            throw new Error('No client secret received from session endpoint')
          }
          const clientSecret = String(sessionData.client_secret).trim()
          if (!clientSecret) {
            console.error('❌ Client secret is empty after trimming')
            throw new Error('Client secret is empty')
          }
          return clientSecret
        } catch (error) {
          console.error('❌ Error in getClientSecret:', error)
          throw error
        }
      },
    },
    theme: theme as any,
    locale: chatkitOptions.locale as any,
    composer: (() => {
      // Build composer tools array
      const composerTools: any[] = []

      // Add file upload tool if enabled
      if (chatbot.enableFileUpload) {
        composerTools.push({
          id: 'file-upload',
          label: 'Attach file',
          icon: 'document',
          pinned: true
        })
      }

      // Add custom tools from chatkitOptions
      if (chatkitOptions.composer?.tools && Array.isArray(chatkitOptions.composer.tools)) {
        const customTools = chatkitOptions.composer.tools.map((tool: any) => {
          const supportedTool: any = {}
          if (tool.id !== undefined && tool.id !== null && tool.id !== '') supportedTool.id = tool.id
          if (tool.label !== undefined && tool.label !== null && tool.label !== '') supportedTool.label = tool.label
          if (tool.shortLabel !== undefined && tool.shortLabel !== null && tool.shortLabel !== '') supportedTool.shortLabel = tool.shortLabel
          
          // Only include valid icon names
          if (tool.icon !== undefined && tool.icon !== null && tool.icon !== '') {
            supportedTool.icon = tool.icon
          }
          
          if (tool.pinned !== undefined) supportedTool.pinned = tool.pinned
          if (tool.placeholderOverride !== undefined && tool.placeholderOverride !== null && tool.placeholderOverride !== '') supportedTool.placeholderOverride = tool.placeholderOverride
          
          return supportedTool
        }).filter((tool: any) => tool.id && tool.label)
        composerTools.push(...customTools)
      }

      // Return composer config if there's any configuration
      if (chatkitOptions.composer?.placeholder || composerTools.length > 0) {
        return {
          placeholder: chatkitOptions.composer?.placeholder,
          tools: composerTools.length > 0 ? composerTools : undefined
        }
      }
      return undefined
    })(),
    // Don't pass header config to ChatKit when using regular style header (regular header will be used instead)
    // Note: ChatKit header only supports specific properties - description, logo are NOT supported
    // The title should be an object with 'text' property, not a plain string
    header: useChatKitInRegularStyle ? undefined : (() => {
      const header = { ...(chatkitOptions.header || {}) }
      const supportedHeader: any = {}

      // ChatKit expects title as an object with 'text' property
      if (header.title !== undefined) {
        if (typeof header.title === 'object' && header.title !== null) {
          // Already an object, pass through
          supportedHeader.title = header.title
        } else if (typeof header.title === 'string' && header.title !== '') {
          // Convert string to expected object format
          supportedHeader.title = { text: header.title }
        }
      } else if ((chatbot as any).headerTitle) {
        // Support legacy formData.headerTitle - convert to object format
        supportedHeader.title = { text: (chatbot as any).headerTitle }
      }

      // Note: 'description' and 'logo' are NOT supported by ChatKit header
      // These fields are ignored to prevent "Unrecognized keys" errors

      // Force removal of rightAction if it exists in source config to prevent errors
      if (supportedHeader.rightAction) {
        delete supportedHeader.rightAction
      }

      if (Object.keys(supportedHeader).length > 0) {
        return supportedHeader
      }
      return undefined
    })(),
    startScreen: chatkitOptions.startScreen ? (() => {
      const supportedStartScreen: any = {}

      if (chatkitOptions.startScreen.greeting) {
        supportedStartScreen.greeting = chatkitOptions.startScreen.greeting
      } else {
        // Fallback to chatbot config greeting if not explicitly set in chatkitOptions
        const fallbackGreeting = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener
        if (fallbackGreeting) {
          supportedStartScreen.greeting = fallbackGreeting
        }
      }

      if (chatkitOptions.startScreen.prompts && chatkitOptions.startScreen.prompts.length > 0) {
        // Valid ChatKit icon names (ChatKitIcon type)
        const validChatKitIcons = [
          'agent', 'analytics', 'atom', 'bolt', 'book-open', 'calendar', 'chart', 'check', 'check-circle',
          'chevron-left', 'chevron-right', 'circle-question', 'compass', 'confetti', 'cube', 'document',
          'dots-horizontal', 'empty-circle', 'globe', 'keys', 'lab', 'images', 'info', 'lifesaver',
          'lightbulb', 'mail', 'map-pin', 'maps', 'name', 'notebook', 'notebook-pencil', 'page-blank',
          'phone', 'plus', 'profile', 'profile-card', 'star', 'star-filled', 'search', 'sparkle',
          'sparkle-double', 'square-code', 'square-image', 'square-text', 'suitcase', 'settings-slider',
          'user', 'wreath', 'write', 'write-alt', 'write-alt2', 'bug'
        ]

        const filteredPrompts = chatkitOptions.startScreen.prompts.map((prompt: any) => {
          const supportedPrompt: any = {}
          // ChatKit supports 'label', 'prompt', and 'icon' properties
          // 'name' is not supported and will cause errors
          if (prompt.label !== undefined && prompt.label !== null && prompt.label !== '') {
            supportedPrompt.label = prompt.label
          }
          if (prompt.prompt !== undefined && prompt.prompt !== null && prompt.prompt !== '') {
            supportedPrompt.prompt = prompt.prompt
          }
          // Only include icon if it's a valid ChatKitIcon value
          if (prompt.icon !== undefined && prompt.icon !== null && prompt.icon !== '' &&
            validChatKitIcons.includes(prompt.icon)) {
            supportedPrompt.icon = prompt.icon
          }
          return supportedPrompt
        }).filter((prompt: any) => prompt.label || prompt.prompt)

        if (filteredPrompts.length > 0) {
          supportedStartScreen.prompts = filteredPrompts
        }
      }

      return Object.keys(supportedStartScreen).length > 0 ? supportedStartScreen : undefined
    })() : undefined,
    entities: chatkitOptions.entities ? (() => {
      const e: any = {}
      if (chatkitOptions.entities.onTagSearch) e.onTagSearch = chatkitOptions.entities.onTagSearch
      if (chatkitOptions.entities.onRequestPreview) e.onRequestPreview = chatkitOptions.entities.onRequestPreview
      return Object.keys(e).length > 0 ? e : undefined
    })() : undefined,
    disclaimer: chatkitOptions.disclaimer && chatkitOptions.disclaimer.text && chatkitOptions.disclaimer.text.trim() !== '' ? {
      text: chatkitOptions.disclaimer.text.trim(),
    } : undefined,
    threadItemActions: (chatkitOptions.threadItemActions &&
      (chatkitOptions.threadItemActions.feedback === true || chatkitOptions.threadItemActions.retry === true)) ? {
      feedback: chatkitOptions.threadItemActions.feedback === true,
      retry: chatkitOptions.threadItemActions.retry === true,
    } : undefined,
    // History panel configuration
    history: chatkitOptions.history !== undefined ? (() => {
      const historyConfig: any = {}
      if (chatkitOptions.history.enabled !== undefined) {
        historyConfig.enabled = chatkitOptions.history.enabled
      }
      if (chatkitOptions.history.showDelete !== undefined) {
        historyConfig.showDelete = chatkitOptions.history.showDelete
      }
      if (chatkitOptions.history.showRename !== undefined) {
        historyConfig.showRename = chatkitOptions.history.showRename
      }
      return Object.keys(historyConfig).length > 0 ? historyConfig : undefined
    })() : undefined,
  }), [agentId, apiKey, chatbot, theme, chatkitOptions, useChatKitInRegularStyle, serverOrigin, deploymentType])
}
