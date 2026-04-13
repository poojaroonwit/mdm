'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Palette, Layout, Rocket, TrendingUp, Smartphone } from 'lucide-react'
import { PWATab } from './components/PWATab'
import { StyleTab } from '../StyleTab'
import { Chatbot } from './types'
import { EngineConfig } from './components/EngineConfig'
import { ConfigTab } from './components/ConfigTab'

import { PerformanceTab } from './components/PerformanceTab'

interface ChatbotEditorProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  activeTab: 'engine' | 'style' | 'config' | 'performance' | 'pwa'
  onTabChange: (tab: 'engine' | 'style' | 'config' | 'performance' | 'pwa') => void
  onGenerateEmbedCode: (chatbot: Chatbot) => string
  hideTabsList?: boolean
  onSave?: () => Promise<Chatbot | null>
}

export function ChatbotEditor({
  formData,
  setFormData,
  selectedChatbot,
  activeTab,
  onTabChange,
  onGenerateEmbedCode,
  hideTabsList = false,
  onSave,
}: ChatbotEditorProps) {
  // Render tab content based on activeTab when hideTabsList is true
  const renderTabContent = () => {
    if (activeTab === 'engine') {
      return <EngineConfig formData={formData} setFormData={setFormData} />
    }

    if (activeTab === 'style') {
      return (
        <div className="space-y-6 pt-4">
          <StyleTab formData={formData} setFormData={setFormData} />
        </div>
      )
    }

    if (activeTab === 'config') {
      return <ConfigTab formData={formData} setFormData={setFormData} />
    }



    if (activeTab === 'performance') {
      return <PerformanceTab chatbot={selectedChatbot} />
    }

    if (activeTab === 'pwa') {
      return <PWATab formData={formData} setFormData={setFormData} />
    }

    return null
  }

  // When hideTabsList is true, render content directly without Tabs wrapper
  if (hideTabsList) {
    return <div className="w-full">{renderTabContent()}</div>
  }

  // Otherwise, use the Tabs component with TabsList
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)}>
        <TabsList className="w-full flex justify-start gap-2">
          <TabsTrigger value="engine">
            <Settings className="h-4 w-4 mr-2" />
            Engine
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="h-4 w-4 mr-2" />
            Style
          </TabsTrigger>
          <TabsTrigger value="config">
            <Layout className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>

          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="pwa">
            <Smartphone className="h-4 w-4 mr-2" />
            PWA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engine" className="space-y-4 pt-4">
          <EngineConfig formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="style" className="space-y-6 pt-4">
          <StyleTab formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4 pt-4">
          <ConfigTab formData={formData} setFormData={setFormData} />
        </TabsContent>



        <TabsContent value="performance" className="space-y-4 pt-4">
          <PerformanceTab chatbot={selectedChatbot} />
        </TabsContent>

        <TabsContent value="pwa" className="space-y-4 pt-4">
          <PWATab formData={formData} setFormData={setFormData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
