'use client'

import type { Chatbot } from './chatbot/types'
import { ChatKitStyleConfig } from './chatbot/style/ChatKitStyleConfig'
import { RegularStyleConfig } from './chatbot/style/RegularStyleConfig'

export function StyleTab({
  formData,
  setFormData,
}: {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}) {
  if (!formData) {
    console.error('[StyleTab] formData is missing!')
    return <div className="p-4 text-red-500">Error: Chatbot data is missing. Please reload.</div>
  }

  const engineType = (formData as any).engineType || 'custom'

  console.log('[StyleTab] Rendering with engineType:', engineType)
  console.log('[StyleTab] formData:', formData)
  console.log('[StyleTab] chatkitOptions:', (formData as any).chatkitOptions)

  // If ChatKit engine, show ChatKit theme/style config
  if (engineType === 'chatkit') {
    return <ChatKitStyleConfig formData={formData} setFormData={setFormData} chatkitOptions={(formData as any).chatkitOptions} />
  }

  // Otherwise (including openai-agent-sdk), show regular style config
  return <RegularStyleConfig formData={formData} setFormData={setFormData} />
}

export default StyleTab
