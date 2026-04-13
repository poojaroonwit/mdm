'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { Copy, Globe, Info, Smartphone, Check } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Chatbot, ChatbotVersion } from '../types'
import { VersionDrawer } from './VersionDrawer'
import toast from 'react-hot-toast'

interface DeploymentTabProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  onGenerateEmbedCode: (chatbot: Chatbot) => string
  onSave?: (data?: Partial<Chatbot>) => Promise<Chatbot | null>
}

export function DeploymentTab({
  formData,
  setFormData,
  selectedChatbot,
  onGenerateEmbedCode,
  onSave,
}: DeploymentTabProps) {

  // Handle restoring a version
  const handleRestoreVersion = (version: ChatbotVersion) => {
    // Merge the version's config back into formData
    // This allows the user to see exactly what was in that version and edit it further
    setFormData(prev => ({
      ...prev,
      ...version.config, // Apply the full saved configuration
      currentVersion: version.version,
      isPublished: false // When restoring, it becomes a new draft by default
    }))
    toast.success(`Loaded configuration from v${version.version}`)
  }

  const versions = selectedChatbot?.versions || formData.versions || []
  const currentVersion = formData.currentVersion || selectedChatbot?.currentVersion

  return (
    <div className="space-y-4 pt-4">
      {/* Workflow Note */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Save &amp; Publish Workflow</p>
            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
              Use <strong>Save Draft</strong> to save your changes without making them live. 
              Each save creates a new version. Use <strong>Publish</strong> when ready to make your chatbot live.
            </p>
          </div>
        </div>
      </div>

      {/* Version Status Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Current Version:</span>
          <Badge variant="outline" className="font-mono">
            v{currentVersion || '1.0.0'}
          </Badge>
          {formData.isPublished ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <Check className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
          {(() => {
            const latestVersion = versions[0]
            if (!latestVersion || !formData.isPublished) return null
            
            // Compare essential fields to detect changes
            // Note: This is an approximation. A deep comparison of all style/config fields would be better.
            const latestConfig = latestVersion.config || {}
            
            // Check if any field in formData (excluding metadata) differs from latestConfig
            const hasChanges = Object.keys(formData).some(key => {
              if (['versions', 'createdAt', 'updatedAt', 'currentVersion', 'isPublished', 'id'].includes(key)) return false
              return JSON.stringify((formData as any)[key]) !== JSON.stringify(latestConfig[key])
            })

            if (hasChanges) {
              return (
                <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10 gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unpublished Changes
                </Badge>
              )
            }
            return null
          })()}
        </div>
        <div className="flex items-center gap-2">
          {/* Version history drawer */}
          <VersionDrawer
            versions={versions}
            currentVersion={currentVersion}
            onRestore={handleRestoreVersion}
            chatbot={formData}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deployment Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'popover',
              label: 'Popover Chat',
              description: 'Facebook Messenger style widget',
              icon: Smartphone
            },
            {
              value: 'popup-center',
              label: 'Popup Center',
              description: 'Centered dialog modal',
              icon: Copy
            },
            {
              value: 'fullpage',
              label: 'Full Page',
              description: 'Standalone page link',
              icon: Globe
            }
          ].map((option) => (
            <div
              key={option.value}
              className={`
                relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50
                ${formData.deploymentType === option.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-muted bg-card'}
              `}
              onClick={() => setFormData({ ...formData, deploymentType: option.value as any })}
            >
              <div className="flex flex-col gap-2">
                <option.icon className={`h-6 w-6 ${formData.deploymentType === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="space-y-1">
                  <p className="font-medium leading-none">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        {/* Step 1: Custom Domains */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <Label className="font-semibold">Custom Embed URL (CDN)</Label>
            </div>
            <Input
              type="text"
              placeholder="https://chat.yourdomain.com"
              value={formData.customEmbedDomain || ''}
              onChange={(e) => setFormData({ ...formData, customEmbedDomain: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Specify the base URL for the script source. If empty, the current server's origin will be used.
            </p>
          </div>
        </div>

        {/* Step 2: Security Allowlist */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icons.ShieldCheck className="h-4 w-4 text-green-600" />
              <Label className="font-semibold">Domain Allowlist (API Security)</Label>
            </div>
            <Input
              type="text"
              placeholder="site-a.com, site-b.com"
              value={formData.domainAllowlist || ''}
              onChange={(e) => setFormData({ ...formData, domainAllowlist: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Comma-separated list of domains allowed to embed this bot. Leave empty to allow all (not recommended).
            </p>
          </div>
        </div>
      </div>



      <div className="space-y-2">
        <Label>Embed Code</Label>
        <div className="flex gap-2">
          <Textarea
            readOnly
            rows={8}
            className="bg-muted border-0 resize-none font-mono text-xs"
            value={(() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = {
                ...formData,
                id: chatbotId,
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              return onGenerateEmbedCode(chatbot)
            })()}
          />
          <Button
            variant="outline"
            onClick={async () => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = {
                ...formData,
                id: chatbotId,
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              const code = onGenerateEmbedCode(chatbot)
              const { copyToClipboard } = await import('@/lib/clipboard')
              const success = await copyToClipboard(code)
              if (success) {
                toast.success('Embed code copied to clipboard')
              } else {
                toast.error('Failed to copy to clipboard')
              }
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy this code and paste it into your website HTML to embed the chatbot.
        </p>
      </div>
    </div>
  )
}

