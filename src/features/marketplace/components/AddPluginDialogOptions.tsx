import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronUp, FileCode, Sparkles } from 'lucide-react'

export type PluginSource = 'built-in' | 'local-folder' | 'external'
export type UIComponentType = 'basic' | 'management'

interface PluginSourceOptionsProps {
  pluginSource: PluginSource
  setPluginSource: (source: PluginSource) => void
  setGenerateCodeFiles: (enabled: boolean) => void
  externalProjectFolder: string
  setExternalProjectFolder: (value: string) => void
  externalSourcePath: string
  setExternalSourcePath: (value: string) => void
  externalSourceUrl: string
  setExternalSourceUrl: (value: string) => void
}

export function PluginSourceOptions({
  pluginSource,
  setPluginSource,
  setGenerateCodeFiles,
  externalProjectFolder,
  setExternalProjectFolder,
  externalSourcePath,
  setExternalSourcePath,
  externalSourceUrl,
  setExternalSourceUrl
}: PluginSourceOptionsProps) {
  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pluginSource" className="font-medium">Plugin Source</Label>
        <Select
          value={pluginSource}
          onValueChange={(value) => {
            const source = value as PluginSource
            setPluginSource(source)
            setGenerateCodeFiles(source === 'built-in')
          }}
        >
          <SelectTrigger id="pluginSource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="built-in">Built-in (Same Project)</SelectItem>
            <SelectItem value="local-folder">External Folder (Different Project)</SelectItem>
            <SelectItem value="external">External URL (CDN/Git/npm)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {pluginSource === 'built-in' && 'Plugin will be created in this project'}
          {pluginSource === 'local-folder' && 'Plugin exists in a different project folder'}
          {pluginSource === 'external' && 'Plugin will be loaded from external source'}
        </p>
      </div>

      {pluginSource === 'local-folder' && (
        <div className="space-y-3 pl-4 border-l-2">
          <div className="space-y-2">
            <Label htmlFor="externalProjectFolder">Project Folder Name</Label>
            <Input
              id="externalProjectFolder"
              value={externalProjectFolder}
              onChange={(e) => setExternalProjectFolder(e.target.value)}
              placeholder="e.g., my-plugin-project"
            />
            <p className="text-xs text-muted-foreground">
              Name of the project folder containing the plugin (e.g., ../my-plugin-project)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalSourcePath">Plugin Path (Alternative)</Label>
            <Input
              id="externalSourcePath"
              value={externalSourcePath}
              onChange={(e) => setExternalSourcePath(e.target.value)}
              placeholder="e.g., ../my-plugin-project/src/plugins/my-plugin"
            />
            <p className="text-xs text-muted-foreground">
              Or specify full path to plugin folder (relative or absolute)
            </p>
          </div>
        </div>
      )}

      {pluginSource === 'external' && (
        <div className="space-y-3 pl-4 border-l-2">
          <div className="space-y-2">
            <Label htmlFor="externalSourceUrl">Source URL</Label>
            <Input
              id="externalSourceUrl"
              type="url"
              value={externalSourceUrl}
              onChange={(e) => setExternalSourceUrl(e.target.value)}
              placeholder="https://github.com/user/plugin-repo or https://cdn.example.com/plugin"
            />
            <p className="text-xs text-muted-foreground">
              Git repository URL, CDN URL, or npm package name
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface CodeGenerationOptionsProps {
  pluginSource: PluginSource
  generateCodeFiles: boolean
  setGenerateCodeFiles: (enabled: boolean) => void
  generateUIComponent: boolean
  setGenerateUIComponent: (enabled: boolean) => void
  uiComponentType: UIComponentType
  setUiComponentType: (value: UIComponentType) => void
}

export function CodeGenerationOptions({
  pluginSource,
  generateCodeFiles,
  setGenerateCodeFiles,
  generateUIComponent,
  setGenerateUIComponent,
  uiComponentType,
  setUiComponentType
}: CodeGenerationOptionsProps) {
  if (pluginSource !== 'built-in') return null

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="generateCodeFiles"
          checked={generateCodeFiles}
          onCheckedChange={(checked) => setGenerateCodeFiles(checked === true)}
        />
        <Label htmlFor="generateCodeFiles" className="flex items-center gap-2 cursor-pointer">
          <FileCode className="h-4 w-4" />
          <span className="font-medium">Generate Code Files</span>
          <span className="text-xs text-muted-foreground">(Recommended)</span>
        </Label>
      </div>

      {generateCodeFiles && (
        <div className="ml-6 space-y-3 pl-4 border-l-2">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-xs">
              We'll automatically create plugin.ts, UI component, and update index.ts for you!
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="generateUIComponent"
              checked={generateUIComponent}
              onCheckedChange={(checked) => setGenerateUIComponent(checked === true)}
            />
            <Label htmlFor="generateUIComponent" className="cursor-pointer">
              Generate UI Component
            </Label>
          </div>

          {generateUIComponent && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="uiComponentType" className="text-sm">Component Type</Label>
              <Select
                value={uiComponentType}
                onValueChange={(value) => setUiComponentType(value as UIComponentType)}
              >
                <SelectTrigger id="uiComponentType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (Simple UI)</SelectItem>
                  <SelectItem value="management">Management (With Controls)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AdvancedPluginOptionsProps {
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  providerUrl: string
  setProviderUrl: (value: string) => void
  iconUrl: string
  setIconUrl: (value: string) => void
  documentationUrl: string
  setDocumentationUrl: (value: string) => void
  apiBaseUrl: string
  setApiBaseUrl: (value: string) => void
  apiAuthType: 'oauth2' | 'api_key' | 'bearer' | 'none'
  setApiAuthType: (value: 'oauth2' | 'api_key' | 'bearer' | 'none') => void
}

export function AdvancedPluginOptions({
  showAdvanced,
  setShowAdvanced,
  providerUrl,
  setProviderUrl,
  iconUrl,
  setIconUrl,
  documentationUrl,
  setDocumentationUrl,
  apiBaseUrl,
  setApiBaseUrl,
  apiAuthType,
  setApiAuthType
}: AdvancedPluginOptionsProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between mb-4"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span>Advanced Options (Optional)</span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showAdvanced && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="providerUrl">Provider URL</Label>
            <Input
              id="providerUrl"
              type="url"
              value={providerUrl}
              onChange={(e) => setProviderUrl(e.target.value)}
              placeholder="https://yourcompany.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iconUrl">Icon URL</Label>
            <Input
              id="iconUrl"
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="/icons/my-plugin.svg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentationUrl">Documentation URL</Label>
            <Input
              id="documentationUrl"
              type="url"
              value={documentationUrl}
              onChange={(e) => setDocumentationUrl(e.target.value)}
              placeholder="https://docs.example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiBaseUrl">API Base URL</Label>
            <Input
              id="apiBaseUrl"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiAuthType">API Authentication Type</Label>
            <Select
              value={apiAuthType}
              onValueChange={(value) => setApiAuthType(value as AdvancedPluginOptionsProps['apiAuthType'])}
            >
              <SelectTrigger id="apiAuthType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
