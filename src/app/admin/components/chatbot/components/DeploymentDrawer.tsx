'use client'

import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { DeploymentTab } from './DeploymentTab'
import { Chatbot } from '../types'

interface DeploymentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  onGenerateEmbedCode: (chatbot: Chatbot) => string
  onSave?: (data?: Partial<Chatbot>) => Promise<Chatbot | null>
}

export function DeploymentDrawer({
  open,
  onOpenChange,
  formData,
  setFormData,
  selectedChatbot,
  onGenerateEmbedCode,
  onSave,
}: DeploymentDrawerProps) {
  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Deployment"
      description="Configure deployment settings and embed code"
      width="w-[40%]"
    >
      <div className="flex-1 overflow-y-auto">
        <DeploymentTab
          formData={formData}
          setFormData={setFormData}
          selectedChatbot={selectedChatbot}
          onGenerateEmbedCode={onGenerateEmbedCode}
          onSave={onSave}
        />
      </div>
    </CentralizedDrawer>
  )
}
