'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ArrowLeft, Rocket } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { ChatbotEditor } from '@/app/admin/components/chatbot/ChatbotEditor'
import { ChatbotEmulator } from '@/app/admin/components/chatbot/ChatbotEmulator'
import type { Chatbot } from '@/app/admin/components/chatbot/types'
import { DeploymentDrawer } from '@/app/admin/components/chatbot/components/DeploymentDrawer'
import { VersionDrawer } from '@/app/admin/components/chatbot/components/VersionDrawer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface ChatbotEditingWorkspaceProps {
  selectedChatbot: Chatbot | null
  editorFormData: Partial<Chatbot>
  setEditorFormData: Dispatch<SetStateAction<Partial<Chatbot>>>
  activeTab: 'engine' | 'style' | 'config' | 'performance' | 'pwa'
  setActiveTab: Dispatch<SetStateAction<'engine' | 'style' | 'config' | 'performance' | 'pwa'>>
  previewMode: 'popover' | 'fullpage' | 'popup-center'
  setPreviewMode: Dispatch<SetStateAction<'popover' | 'fullpage' | 'popup-center'>>
  deploymentDrawerOpen: boolean
  setDeploymentDrawerOpen: Dispatch<SetStateAction<boolean>>
  setIsEditing: Dispatch<SetStateAction<boolean>>
  handleSave: (dataOverride?: Partial<Chatbot>) => Promise<Chatbot | null>
  handlePublishFromEditor: () => Promise<Chatbot | null>
  generateEmbedCode: (chatbot: Chatbot) => string
}

export function ChatbotEditingWorkspace({
  selectedChatbot,
  editorFormData,
  setEditorFormData,
  activeTab,
  setActiveTab,
  previewMode,
  setPreviewMode,
  deploymentDrawerOpen,
  setDeploymentDrawerOpen,
  setIsEditing,
  handleSave,
  handlePublishFromEditor,
  generateEmbedCode
}: ChatbotEditingWorkspaceProps) {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {selectedChatbot ? `Edit ${selectedChatbot.name}` : 'Create New Chatbot'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
              v{editorFormData.currentVersion || selectedChatbot?.currentVersion || '1.0.0'}
            </span>
            {editorFormData.isPublished ? (
              <span className="text-green-600 text-xs font-medium">Published</span>
            ) : (
              <span className="text-amber-600 text-xs font-medium">Draft</span>
            )}
            <VersionDrawer
              versions={selectedChatbot?.versions || editorFormData.versions || []}
              currentVersion={editorFormData.currentVersion || selectedChatbot?.currentVersion}
              onRestore={(version) => {
                setEditorFormData(prev => ({
                  ...prev,
                  ...version.config,
                  currentVersion: version.version,
                  isPublished: false
                }))
                toast.success(`Loaded configuration from v${version.version}`)
              }}
              chatbot={editorFormData}
              iconOnly={true}
            />
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Switch
              id="chatbot-enabled-header"
              checked={editorFormData.chatbotEnabled !== false}
              onCheckedChange={(checked) => setEditorFormData(prev => ({ ...prev, chatbotEnabled: checked }))}
            />
            <span className={`text-xs font-medium ${editorFormData.chatbotEnabled !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
              {editorFormData.chatbotEnabled !== false ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="w-px h-6 bg-border" />
          <Button variant="outline" onClick={() => setDeploymentDrawerOpen(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            Deployment
          </Button>
          <Button variant="outline" onClick={() => handleSave()}>
            Save Draft
          </Button>
          <Button
            onClick={() => handlePublishFromEditor()}
            className="bg-green-600 hover:bg-green-700"
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-[500px] border-r border-border/50">
          <ChatbotEditor
            formData={editorFormData}
            setFormData={setEditorFormData}
            selectedChatbot={selectedChatbot}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onGenerateEmbedCode={generateEmbedCode}
            onSave={handleSave}
          />
        </div>

        <div className="w-[450px] lg:w-[600px] xl:w-[700px] bg-muted/10 h-full overflow-hidden shrink-0">
          <ChatbotEmulator
            selectedChatbot={selectedChatbot}
            formData={editorFormData}
            onFormDataChange={setEditorFormData}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        </div>
      </div>

      <DeploymentDrawer
        open={deploymentDrawerOpen}
        onOpenChange={setDeploymentDrawerOpen}
        formData={editorFormData}
        setFormData={setEditorFormData}
        selectedChatbot={selectedChatbot}
        onGenerateEmbedCode={generateEmbedCode}
        onSave={handleSave}
      />
    </div>
  )
}
