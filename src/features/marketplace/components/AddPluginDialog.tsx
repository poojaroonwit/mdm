'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader, Plus, Sparkles } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast-utils'
import { PluginCategory } from '../types'
import {
  AdvancedPluginOptions,
  CodeGenerationOptions,
  PluginSourceOptions,
  type PluginSource,
  type UIComponentType
} from './AddPluginDialogOptions'

interface AddPluginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddPluginDialog({ open, onOpenChange, onSuccess }: AddPluginDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Basic required fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [provider, setProvider] = useState('')
  const [category, setCategory] = useState<PluginCategory>('other')
  
  // Optional fields
  const [providerUrl, setProviderUrl] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [documentationUrl, setDocumentationUrl] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [apiAuthType, setApiAuthType] = useState<'oauth2' | 'api_key' | 'bearer' | 'none'>('none')
  
  // Code generation options
  const [generateCodeFiles, setGenerateCodeFiles] = useState(true)
  const [generateUIComponent, setGenerateUIComponent] = useState(true)
  const [uiComponentType, setUiComponentType] = useState<UIComponentType>('basic')
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([])
  
  // External plugin options
  const [pluginSource, setPluginSource] = useState<PluginSource>('built-in')
  const [externalSourcePath, setExternalSourcePath] = useState('')
  const [externalProjectFolder, setExternalProjectFolder] = useState('')
  const [externalSourceUrl, setExternalSourceUrl] = useState('')

  const categories: Array<{ value: PluginCategory; label: string }> = [
    { value: 'business-intelligence', label: 'Business Intelligence' },
    { value: 'monitoring-observability', label: 'Monitoring & Observability' },
    { value: 'database-management', label: 'Database Management' },
    { value: 'storage-management', label: 'Storage Management' },
    { value: 'api-gateway', label: 'API Gateway' },
    { value: 'service-management', label: 'Service Management' },
    { value: 'data-integration', label: 'Data Integration' },
    { value: 'automation', label: 'Automation' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'security', label: 'Security' },
    { value: 'development-tools', label: 'Development Tools' },
    { value: 'other', label: 'Other' },
  ]

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !slug || !version || !provider || !category) {
      showError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setGeneratedFiles([])
    
    try {
      // Determine if this is an external plugin
      const isExternal = pluginSource !== 'built-in'
      
      // Choose the appropriate endpoint
      const endpoint = isExternal 
        ? '/api/marketplace/plugins/external/register'
        : '/api/marketplace/plugins'

      const requestBody: any = {
        name,
        slug,
        description: description || undefined,
        version,
        provider,
        providerUrl: providerUrl || undefined,
        category,
        status: 'approved',
        verified: false,
        iconUrl: iconUrl || undefined,
        documentationUrl: documentationUrl || undefined,
        apiBaseUrl: apiBaseUrl || undefined,
        apiAuthType: apiAuthType !== 'none' ? apiAuthType : undefined,
        capabilities: {},
        uiType: generateUIComponent ? 'react_component' : 'iframe',
        uiConfig: generateUIComponent ? {} : { iframeUrl: apiBaseUrl || 'https://example.com' },
        webhookSupported: false,
        webhookEvents: [],
        screenshots: [],
        pricingInfo: {
          type: 'free',
        },
      }

      // Add external plugin fields
      if (isExternal) {
        requestBody.source = pluginSource
        if (pluginSource === 'local-folder') {
          if (externalProjectFolder) {
            requestBody.projectFolder = externalProjectFolder
          }
          if (externalSourcePath) {
            requestBody.sourcePath = externalSourcePath
          }
        } else if (pluginSource === 'external') {
          if (externalSourceUrl) {
            requestBody.sourceUrl = externalSourceUrl
            // Detect source type from URL
            if (externalSourceUrl.includes('github.com') || externalSourceUrl.includes('gitlab.com')) {
              requestBody.source = 'git'
            } else if (externalSourceUrl.startsWith('http://') || externalSourceUrl.startsWith('https://')) {
              requestBody.source = 'cdn'
              requestBody.downloadUrl = externalSourceUrl
            } else if (externalSourceUrl.startsWith('@') || externalSourceUrl.includes('/')) {
              requestBody.source = 'npm'
            }
          }
        }
      }

      // Step 1: Save to database
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add plugin' }))
        throw new Error(errorData.error || 'Failed to add plugin')
      }

      const responseData = await response.json()

      // For external plugins, show success immediately
      if (isExternal) {
        showSuccess(
          `External plugin registered successfully! ${responseData.installedPath ? `Installed at: ${responseData.installedPath}` : ''}`
        )
        onSuccess()
        onOpenChange(false)
        setLoading(false)
        return
      }

      // Step 2: Generate code files if requested (only for built-in plugins)
      if (generateCodeFiles && pluginSource === 'built-in') {
        try {
          const generateResponse = await fetch('/api/marketplace/plugins/generate-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slug,
              name,
              description,
              version,
              provider,
              providerUrl,
              category,
              apiBaseUrl,
              apiAuthType,
              generateCodeFiles: true,
              generateUIComponent,
              uiComponentType,
            }),
          })

          if (generateResponse.ok) {
            const generateData = await generateResponse.json()
            if (generateData.created) {
              setGeneratedFiles(generateData.created)
              const hasAutoReg = generateData.created.some((f: string) => 
                f.includes('automatically registered')
              )
              if (hasAutoReg) {
                showSuccess(
                  `Plugin created, files generated, and automatically registered! 🎉`
                )
              } else {
                showSuccess(
                  `Plugin added and ${generateData.created.length} file(s) generated! 🎉`
                )
              }
            }
          } else {
            // File generation failed but plugin was saved
            showSuccess('Plugin added to database, but file generation had issues. Check console.')
          }
        } catch (fileError) {
          console.error('Error generating files:', fileError)
          showSuccess('Plugin added to database, but file generation failed. You can create files manually.')
        }
      } else {
        showSuccess('Plugin added successfully!')
      }

      // Reset form
      setName('')
      setSlug('')
      setDescription('')
      setVersion('1.0.0')
      setProvider('')
      setCategory('other')
      setProviderUrl('')
      setIconUrl('')
      setDocumentationUrl('')
      setApiBaseUrl('')
      setApiAuthType('none')
      setShowAdvanced(false)
      setGeneratedFiles([])
      
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add plugin'
      showError(errorMessage)
      console.error('Error adding plugin:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add New Plugin
          </DialogTitle>
          <DialogDescription>
            Create a plugin with automatic code generation! Fill in the form and we'll create all the files for you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Required Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Plugin Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., My Awesome Plugin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., my-awesome-plugin"
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this plugin do?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">
                    Version <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as PluginCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">
                  Provider <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g., Your Company Name"
                  required
                />
              </div>
            </div>

            {/* Plugin Source Selection */}
            <PluginSourceOptions
              pluginSource={pluginSource}
              setPluginSource={setPluginSource}
              setGenerateCodeFiles={setGenerateCodeFiles}
              externalProjectFolder={externalProjectFolder}
              setExternalProjectFolder={setExternalProjectFolder}
              externalSourcePath={externalSourcePath}
              setExternalSourcePath={setExternalSourcePath}
              externalSourceUrl={externalSourceUrl}
              setExternalSourceUrl={setExternalSourceUrl}
            />

            {/* Code Generation Options (only for built-in) */}
            <CodeGenerationOptions
              pluginSource={pluginSource}
              generateCodeFiles={generateCodeFiles}
              setGenerateCodeFiles={setGenerateCodeFiles}
              generateUIComponent={generateUIComponent}
              setGenerateUIComponent={setGenerateUIComponent}
              uiComponentType={uiComponentType}
              setUiComponentType={setUiComponentType}
            />
            {/* Advanced Options */}
            <AdvancedPluginOptions
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              providerUrl={providerUrl}
              setProviderUrl={setProviderUrl}
              iconUrl={iconUrl}
              setIconUrl={setIconUrl}
              documentationUrl={documentationUrl}
              setDocumentationUrl={setDocumentationUrl}
              apiBaseUrl={apiBaseUrl}
              setApiBaseUrl={setApiBaseUrl}
              apiAuthType={apiAuthType}
              setApiAuthType={setApiAuthType}
            />          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plugin
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



