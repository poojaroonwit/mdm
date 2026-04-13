'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  LayoutTemplate, 
  MessageSquare, 
  Settings2, 
  Languages, 
  UserCircle, 
  Sparkles, 
  History,
  PanelTop,
  CircleDot,
  ThumbsUp,
  Cpu,
  Tag,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'
import type { Chatbot } from '../types'
import {
  LocaleSection,
  PopoverSection,
  WidgetSection,
  PersonaPickerSection,
  RegularAvatarSection,
  AnimationSection,
  ChatKitHeaderSection,
  ChatKitHistorySection,
  ChatKitGeneralSettingsSection,
  ThreadItemActionsSection,
  ModelPickerSection,
  EntitiesSection,
  DisclaimerSection,
  ThemeSection
} from './sections'

interface ChatKitStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: (data: Partial<Chatbot> | ((prev: Partial<Chatbot>) => Partial<Chatbot>)) => void
  chatkitOptions: any
}

// Wrapper for section content to ensure consistent styling
const SectionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      {children}
    </div>
  )
}

export function ChatKitStyleConfig({ formData, setFormData, chatkitOptions }: ChatKitStyleConfigProps) {
  const [activeTab, setActiveTab] = useState('theme')
  
  return (
    <div className="flex flex-col md:flex-row w-full gap-8 min-h-[600px]">
      <Tabs 
        defaultValue="theme" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex flex-col md:flex-row w-full gap-8"
      >
        {/* Sidebar Navigation */}
        <div className="w-full md:w-56 lg:w-64 shrink-0">
          <TabsList className="flex flex-col h-auto gap-0.5 bg-muted/30 p-1.5 rounded-xl border border-border/40 w-full justify-start overflow-hidden">
            <div className="px-3 py-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Brand & Style</span>
            </div>
            <TabsTrigger value="theme" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Palette className="h-3.5 w-3.5" />
              Theme Configuration
            </TabsTrigger>
            <TabsTrigger value="animation" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Motion & Velocity
            </TabsTrigger>
            <TabsTrigger value="avatar" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <UserCircle className="h-3.5 w-3.5" />
              Identity & Avatars
            </TabsTrigger>

            <div className="px-3 py-2 mt-4 mb-1 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Layout & Containers</span>
            </div>
            <TabsTrigger value="header" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <PanelTop className="h-3.5 w-3.5" />
              Navigation Header
            </TabsTrigger>
            <TabsTrigger value="popover" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              Popover Container
            </TabsTrigger>
            <TabsTrigger value="history" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <History className="h-3.5 w-3.5" />
              Session History
            </TabsTrigger>
            <TabsTrigger value="widget" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <CircleDot className="h-3.5 w-3.5" />
              Floating Trigger
            </TabsTrigger>

            <div className="px-3 py-2 mt-4 mb-1 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Interactive Features</span>
            </div>
            <TabsTrigger value="persona" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <UserCircle className="h-3.5 w-3.5" />
              Persona Multi-Kit
            </TabsTrigger>
            <TabsTrigger value="actions" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <ThumbsUp className="h-3.5 w-3.5" />
              Message Actions
            </TabsTrigger>
            <TabsTrigger value="locale" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Languages className="h-3.5 w-3.5" />
              Internationalization
            </TabsTrigger>

            <div className="px-3 py-2 mt-4 mb-1 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Advanced</span>
            </div>
            <TabsTrigger value="model" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Cpu className="h-3.5 w-3.5" />
              Model Controls
            </TabsTrigger>
            <TabsTrigger value="entities" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Tag className="h-3.5 w-3.5" />
              Metadata Entities
            </TabsTrigger>
            <TabsTrigger value="disclaimer" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Legal Disclaimer
            </TabsTrigger>
            <TabsTrigger value="settings" className="justify-start gap-2.5 px-3 py-2 rounded-lg w-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-muted/50 transition-all text-xs">
              <Settings2 className="h-3.5 w-3.5" />
              Platform Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 min-w-0">
          <TabsContent value="theme" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ThemeSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="animation" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <AnimationSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="avatar" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <RegularAvatarSection formData={formData} setFormData={setFormData} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="header" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ChatKitHeaderSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="popover" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <PopoverSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="history" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ChatKitHistorySection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="widget" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <WidgetSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="persona" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <PersonaPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="actions" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ThreadItemActionsSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="locale" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <LocaleSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="model" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ModelPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="entities" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <EntitiesSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="disclaimer" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <DisclaimerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="settings" className="m-0 focus-visible:outline-none">
            <SectionWrapper>
              <ChatKitGeneralSettingsSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
