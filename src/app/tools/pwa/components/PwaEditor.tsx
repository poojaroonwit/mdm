'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from 'react-hot-toast'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { PwaIconInput } from './PwaIconInput'
import { ScreenshotsInput } from './ScreenshotsInput'
import { PwaBannerEditor } from './PwaBannerEditor'
import { Loader2, Save, Rocket, FileText, LayoutTemplate, ClipboardList, Palette, Settings, Code, ImageIcon, Type, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PwaEditorProps {
  pwaId: string
  onDataChange?: (data: any) => void
}

// Sidebar menu items
const MENU_ITEMS = [
  { id: 'app-info', label: 'App Info', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'loading-screen', label: 'Loading Screen', icon: Loader2 },
  { id: 'installation', label: 'Installation', icon: LayoutTemplate },
] as const

type MenuId = typeof MENU_ITEMS[number]['id']

export function PwaEditor({ pwaId, onDataChange }: PwaEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuId>('app-info')

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    url: '',
    shortName: '',
    themeColor: '#ffffff',
    bgColor: '#ffffff',
    displayMode: 'standalone',
    orientation: 'any',
    startUrl: '/',
    scope: '/',
    iconUrl: '',
    installMode: 'browser',
    promptDelay: 0
  })

  // Notify parent of changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData)
    }
  }, [formData, onDataChange])

  // Load PWA data
  useEffect(() => {
    const fetchPwa = async () => {
      try {
        const res = await fetch(`/api/pwa/${pwaId}`)
        if (!res.ok) throw new Error('Failed to load PWA')
        const data = await res.json()
        setFormData(data.pwa)
      } catch (error) {
        toast.error('Error loading PWA configuration')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPwa()
  }, [pwaId])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/pwa/${pwaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Configuration saved')
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeploy = async () => {
    if (!confirm('Are you sure you want to publish this version? This will generate a new version number.')) return

    setIsDeploying(true)
    try {
      const res = await fetch(`/api/pwa/${pwaId}/deploy`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to deploy')
      toast.success('PWA Published Successfully')
    } catch (error) {
      toast.error('Failed to publish PWA')
    } finally {
      setIsDeploying(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card shrink-0">
        <div>
          <h2 className="text-lg font-semibold">{formData.name}</h2>
          <p className="text-sm text-muted-foreground">{formData.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r bg-muted/30 shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* App Info Section */}
          {activeMenu === 'app-info' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                App Info
              </h3>
              <Accordion type="single" collapsible defaultValue="basic">
                <AccordionItem value="basic" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Type className="h-4 w-4" />
                      Basic Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>App Name</Label>
                        <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Short Name</Label>
                        <Input value={formData.shortName || ''} onChange={(e) => handleChange('shortName', e.target.value)} placeholder="e.g. MyShop" />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label>Website URL</Label>
                        <Input value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="metadata" className="border rounded-lg bg-card px-4 mt-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4" />
                      Metadata & Screenshots
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Categories</Label>
                        <Input
                          value={formData.categories?.join(', ') || ''}
                          onChange={(e) => handleChange('categories', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="productivity, business"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Language</Label>
                        <Input
                          value={formData.manifestParams?.lang || 'en'}
                          onChange={(e) => handleChange('manifestParams', { ...formData.manifestParams, lang: e.target.value })}
                          placeholder="en-US"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="mb-2 block">Mobile Screenshots</Label>
                        <ScreenshotsInput
                          values={formData.screenshots || []}
                          onChange={(vals) => handleChange('screenshots', vals)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Appearance Section */}
          {activeMenu === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance & Branding
              </h3>
              <Accordion type="single" collapsible defaultValue="colors">
                <AccordionItem value="colors" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="h-4 w-4" />
                      Theme Colors
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Theme Color (Toolbar)</Label>
                        <ColorInput
                          value={formData.themeColor || '#ffffff'}
                          onChange={(color) => handleChange('themeColor', color)}
                          allowImageVideo={false}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Background Color (Splash)</Label>
                        <ColorInput
                          value={formData.bgColor || '#ffffff'}
                          onChange={(color) => handleChange('bgColor', color)}
                          allowImageVideo={false}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="icon" className="border rounded-lg bg-card px-4 mt-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="h-4 w-4" />
                      App Icon
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="space-y-2">
                      <PwaIconInput
                        value={formData.iconUrl || ''}
                        onChange={(val) => handleChange('iconUrl', val)}
                      />
                      <p className="text-xs text-muted-foreground">Recommended: 512x512px PNG.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Loading Screen Section */}
          {activeMenu === 'loading-screen' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary" />
                Loading Screen
              </h3>
              <Accordion type="single" collapsible defaultValue="loader-style">
                <AccordionItem value="loader-style" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="h-4 w-4" />
                      Loader Styling
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Loader Background Color</Label>
                        <ColorInput
                          value={formData.manifestParams?.loadingConfig?.backgroundColor || formData.bgColor || '#ffffff'}
                          onChange={(color) => handleChange('manifestParams', {
                            ...formData.manifestParams,
                            loadingConfig: { ...(formData.manifestParams?.loadingConfig || {}), backgroundColor: color }
                          })}
                          allowImageVideo={false}
                        />
                        <p className="text-xs text-muted-foreground">Usually same as Splash Background.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label>Spinner Color</Label>
                        <ColorInput
                          value={formData.manifestParams?.loadingConfig?.spinnerColor || formData.themeColor || '#000000'}
                          onChange={(color) => handleChange('manifestParams', {
                            ...formData.manifestParams,
                            loadingConfig: { ...(formData.manifestParams?.loadingConfig || {}), spinnerColor: color }
                          })}
                          allowImageVideo={false}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="loader-text" className="border rounded-lg bg-card px-4 mt-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Type className="h-4 w-4" />
                      Loading Text
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="grid gap-2">
                      <Label>Loading Text (Optional)</Label>
                      <Input
                        value={formData.manifestParams?.loadingConfig?.text || ''}
                        onChange={(e) => handleChange('manifestParams', {
                          ...formData.manifestParams,
                          loadingConfig: { ...(formData.manifestParams?.loadingConfig || {}), text: e.target.value }
                        })}
                        placeholder="Loading..."
                      />
                      <p className="text-xs text-muted-foreground">Displayed below the spinner while loading.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Installation Section */}
          {activeMenu === 'installation' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Installation & Embed
              </h3>
              <Accordion type="single" collapsible defaultValue="banner-design">
                <AccordionItem value="banner-design" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="h-4 w-4" />
                      Install Banner Design
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <PwaBannerEditor
                      config={formData.installBannerConfig || {}}
                      onChange={(conf) => handleChange('installBannerConfig', conf)}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="embed-code" className="border rounded-lg bg-card px-4 mt-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Code className="h-4 w-4" />
                      Embed Code
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add this script to your website's HTML to enable PWA features including the loading screen, install prompt, and service worker.
                      </p>
                      <div className="relative rounded-md bg-muted p-4 font-mono text-xs">
                        <code className="break-all block pr-8">
                          {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/pwa/${pwaId}/embed.js"></script>`}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(`<script src="${window.location.origin}/api/pwa/${pwaId}/embed.js"></script>`)
                            toast.success('Copied to clipboard')
                          }}
                        >
                          <ClipboardList className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>What this script does:</strong></p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>Injects the PWA manifest</li>
                          <li>Registers a Service Worker with your loading screen</li>
                          <li>Handles the install prompt based on your settings</li>
                          <li>Shows install banner (if enabled)</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="behavior" className="border rounded-lg bg-card px-4 mt-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Settings className="h-4 w-4" />
                      Behavior Settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Display Mode</Label>
                        <Select value={formData.displayMode} onValueChange={(val) => handleChange('displayMode', val)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standalone">Standalone (App-like)</SelectItem>
                            <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                            <SelectItem value="fullscreen">Fullscreen</SelectItem>
                            <SelectItem value="browser">Browser</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Orientation</Label>
                        <Select value={formData.orientation} onValueChange={(val) => handleChange('orientation', val)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="natural">Natural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start URL</Label>
                          <Input value={formData.startUrl} onChange={(e) => handleChange('startUrl', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Scope</Label>
                          <Input value={formData.scope} onChange={(e) => handleChange('scope', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid gap-2 pt-4 border-t">
                        <Label className="mb-2">Install Prompt Strategy</Label>
                        <div className="flex items-center justify-between border p-3 rounded-md">
                          <div className="space-y-0.5">
                            <Label className="text-base">Automatic Browser Prompt</Label>
                            <p className="text-sm text-muted-foreground">Let the browser decide when to show the install prompt.</p>
                          </div>
                          <Switch
                            checked={formData.installMode === 'browser'}
                            onCheckedChange={(checked) => handleChange('installMode', checked ? 'browser' : 'manual')}
                          />
                        </div>
                        {formData.installMode === 'manual' && (
                          <div className="bg-muted/50 p-4 rounded-md text-sm">
                            You selected <strong>Manual</strong> mode. You will need to trigger the install prompt programmatically using our SDK.
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
