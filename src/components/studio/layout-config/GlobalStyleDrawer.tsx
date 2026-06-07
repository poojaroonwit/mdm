'use client'

import React, { useState, useEffect } from 'react'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Upload, X, Search, LogIn, Save } from 'lucide-react'
import { GlobalStyleConfig } from './types'
import { GlobalComponentStyles } from './GlobalComponentStyles'
import { ColorInput } from './ColorInput'
import { GlobalLoginPageSection } from './GlobalLoginPageSection'
import toast from 'react-hot-toast'
import { Z_INDEX } from '@/lib/z-index'
import { SpacesEditorManager, LoginPageConfig, SpacesEditorPage } from '@/lib/space-studio-manager'
import { Separator as SeparatorComponent } from '@/components/ui/separator'

interface GlobalStyleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  isMobileViewport: boolean
  componentConfigs: Record<string, any>
  handleComponentConfigUpdate: (type: string, updates: Partial<any>) => void
  pages?: SpacesEditorPage[]
}

const DEFAULT_LOGIN_PAGE_CONFIG: LoginPageConfig = {
  backgroundType: 'gradient',
  backgroundColor: '#1e40af',
  gradient: {
    from: '#1e40af',
    to: '#1e40af',
    angle: 135
  },
  leftPanelWidth: '70%',
  rightPanelWidth: '30%',
  cardStyle: {
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadow: true
  },
  title: 'Sign in',
  description: 'Access this workspace',
  showLogo: false
}

export function GlobalStyleDrawer({
  open,
  onOpenChange,
  spaceId,
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
  pages,
}: GlobalStyleDrawerProps) {
  const globalStyle = componentConfigs.global as any as GlobalStyleConfig | undefined
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loginPageConfig, setLoginPageConfig] = useState<LoginPageConfig | null>(null)
  const [postAuthRedirectPageId, setPostAuthRedirectPageId] = useState<string>('')
  const [isSavingLoginConfig, setIsSavingLoginConfig] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
        if (config) {
          setLoginPageConfig(config.loginPageConfig || DEFAULT_LOGIN_PAGE_CONFIG)
          setPostAuthRedirectPageId(config.postAuthRedirectPageId || '')
        } else {
          setLoginPageConfig(DEFAULT_LOGIN_PAGE_CONFIG)
        }
      } catch (error) {
        console.error('Error loading login config:', error)
        setLoginPageConfig(DEFAULT_LOGIN_PAGE_CONFIG)
      }
    }
    if (open) {
      loadConfig()
    }
  }, [spaceId, open])

  const handleSaveLoginConfig = async () => {
    setIsSavingLoginConfig(true)
    try {
      const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId) || await SpacesEditorManager.createDefaultConfig(spaceId)

      const finalLoginConfig = loginPageConfig || DEFAULT_LOGIN_PAGE_CONFIG

      const updatedConfig = {
        ...config,
        loginPageConfig: finalLoginConfig,
        postAuthRedirectPageId: postAuthRedirectPageId || undefined,
        updatedAt: new Date().toISOString()
      }
      await SpacesEditorManager.saveSpacesEditorConfig(updatedConfig)
      setLoginPageConfig(finalLoginConfig)
      toast.success('Login page configuration saved')
    } catch (error) {
      console.error('Error saving login config:', error)
      toast.error('Failed to save login page configuration')
    } finally {
      setIsSavingLoginConfig(false)
    }
  }

  const availablePages = (pages || []).filter(p => p.isActive && !p.hidden)

  const currentLoginConfig = loginPageConfig || DEFAULT_LOGIN_PAGE_CONFIG

  const handleGlobalStyleUpdate = (updates: Partial<GlobalStyleConfig>) => {
    handleComponentConfigUpdate('global' as any, updates as any)
  }

  // Filter settings based on search query
  const searchLower = searchQuery.toLowerCase()
  const matchesSearch = (text: string) => text.toLowerCase().includes(searchLower)

  const showLogo = !searchQuery || matchesSearch('logo') || matchesSearch('application')
  const showFavicon = !searchQuery || matchesSearch('favicon')
  const showPrimaryColor = !searchQuery || matchesSearch('primary') || matchesSearch('color')
  const showTheme = !searchQuery || matchesSearch('theme')
  const showBackgroundColor = !searchQuery || matchesSearch('background') || matchesSearch('color')
  const showFontFamily = !searchQuery || matchesSearch('font') || matchesSearch('family')
  const showFontSize = !searchQuery || matchesSearch('font') || matchesSearch('size')
  const showBorderRadius = !searchQuery || matchesSearch('border') || matchesSearch('radius')
  const showComponentStyles = !searchQuery || matchesSearch('component') || matchesSearch('input') || matchesSearch('button') || matchesSearch('select') || matchesSearch('card') || matchesSearch('table') || matchesSearch('modal') || matchesSearch('tooltip') || matchesSearch('tabs')
  const showLoginPage = !searchQuery || matchesSearch('login') || matchesSearch('auth') || matchesSearch('sign') || matchesSearch('page')

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Global Config"
      zIndex={Z_INDEX.drawer + 100}
      width="w-full md:w-[720px]"
    >
      <div className="flex-1 overflow-y-auto pb-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-background py-3 mb-4 border-b" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-6">
          {/* Application Logo */}
          {showLogo && (
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"} htmlFor="logo-upload-drawer">Application Logo</Label>
              <div className="flex items-center gap-2 mt-1">
                {globalStyle?.logoUrl ? (
                  <>
                    <img
                      src={globalStyle.logoUrl}
                      alt="Logo"
                      className={`${isMobileViewport ? 'h-12 w-12' : 'h-10 w-10'} object-contain rounded border border-border`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleGlobalStyleUpdate({ logoUrl: '' })
                        toast.success('Logo removed')
                      }}
                      className={isMobileViewport ? "h-10" : "h-8"}
                    >
                      <X className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1`} />
                      Remove
                    </Button>
                  </>
                ) : (
                  <label htmlFor="logo-upload-drawer" className="cursor-pointer">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className={`${isMobileViewport ? 'h-10' : 'h-8'} flex items-center gap-1`}
                    >
                      <Upload className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                      Upload Logo
                    </Button>
                    <input
                      id="logo-upload-drawer"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        if (!file.type.startsWith('image/')) {
                          toast.error('Please select a valid image file')
                          return
                        }

                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('File size must be less than 2MB')
                          return
                        }

                        try {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            const result = e.target?.result as string
                            handleGlobalStyleUpdate({ logoUrl: result })
                          }
                          reader.readAsDataURL(file)

                          const formData = new FormData()
                          formData.append('logo', file)

                          const response = await fetch('/api/upload/logo', {
                            method: 'POST',
                            body: formData,
                          })

                          if (response.ok) {
                            const { url } = await response.json()
                            handleGlobalStyleUpdate({ logoUrl: url })
                            toast.success('Logo uploaded successfully')
                          } else {
                            reader.readAsDataURL(file)
                          }
                        } catch (error) {
                          console.error('Error uploading logo:', error)
                          toast.error('Failed to upload logo')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground mt-1`}>
                PNG, JPG, SVG up to 2MB
              </p>
            </div>
          )}

          {/* Favicon */}
          {showFavicon && (
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"} htmlFor="favicon-upload-drawer">Favicon</Label>
              <div className="flex items-center gap-2 mt-1">
                {globalStyle?.faviconUrl ? (
                  <>
                    <img
                      src={globalStyle.faviconUrl}
                      alt="Favicon"
                      className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} object-contain rounded border border-border`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleGlobalStyleUpdate({ faviconUrl: '' })
                        toast.success('Favicon removed')
                      }}
                      className={isMobileViewport ? "h-10" : "h-8"}
                    >
                      <X className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1`} />
                      Remove
                    </Button>
                  </>
                ) : (
                  <label htmlFor="favicon-upload-drawer" className="cursor-pointer">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className={`${isMobileViewport ? 'h-10' : 'h-8'} flex items-center gap-1`}
                    >
                      <Upload className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                      Upload Favicon
                    </Button>
                    <input
                      id="favicon-upload-drawer"
                      type="file"
                      accept="image/*,.ico"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', '.ico']
                        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
                          toast.error('Please select a valid favicon file (PNG, ICO, SVG)')
                          return
                        }

                        if (file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          return
                        }

                        try {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            const result = e.target?.result as string
                            handleGlobalStyleUpdate({ faviconUrl: result })
                          }
                          reader.readAsDataURL(file)

                          const formData = new FormData()
                          formData.append('favicon', file)

                          const response = await fetch('/api/upload/favicon', {
                            method: 'POST',
                            body: formData,
                          })

                          if (response.ok) {
                            const { url } = await response.json()
                            handleGlobalStyleUpdate({ faviconUrl: url })
                            toast.success('Favicon uploaded successfully')
                          } else {
                            reader.readAsDataURL(file)
                          }
                        } catch (error) {
                          console.error('Error uploading favicon:', error)
                          toast.error('Failed to upload favicon')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground mt-1`}>
                ICO, PNG, SVG up to 1MB
              </p>
            </div>
          )}

          {/* Primary Color */}
          {showPrimaryColor && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Primary Color</Label>
              <ColorInput
                value={globalStyle?.primaryColor || '#1e40af'}
                onChange={(color) => handleGlobalStyleUpdate({ primaryColor: color })}
                allowImageVideo={false}
                className="relative w-32"
                placeholder="#1e40af"
                inputClassName={isMobileViewport ? "h-10 pl-7" : "h-8 text-xs pl-7"}
              />
            </div>
          )}

          {/* Theme */}
          {showTheme && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Theme</Label>
              <Select value={globalStyle?.theme || 'light'} onValueChange={(value) => handleGlobalStyleUpdate({ theme: value as 'light' | 'dark' | 'auto' })}>
                <SelectTrigger className={`${isMobileViewport ? "h-10" : "h-8"} w-32`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Background Color */}
          {showBackgroundColor && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background Color</Label>
              <ColorInput
                value={globalStyle?.backgroundColor || '#ffffff'}
                onChange={(color) => handleGlobalStyleUpdate({ backgroundColor: color })}
                allowImageVideo={false}
                className="relative w-32"
                placeholder="#ffffff"
                inputClassName={isMobileViewport ? "h-10 pl-7" : "h-8 text-xs pl-7"}
              />
            </div>
          )}

          {/* Font Family */}
          {showFontFamily && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Font Family</Label>
              <Select value={globalStyle?.fontFamily || 'system'} onValueChange={(value) => handleGlobalStyleUpdate({ fontFamily: value })}>
                <SelectTrigger className={`${isMobileViewport ? "h-10" : "h-8"} w-32`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Font Size */}
          {showFontSize && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Font Size (base)</Label>
              <Input
                type="number"
                className={`${isMobileViewport ? "h-10" : "h-8"} w-32`}
                value={globalStyle?.fontSize || 14}
                onChange={(e) => handleGlobalStyleUpdate({ fontSize: parseInt(e.target.value) || 14 })}
              />
            </div>
          )}

          {/* Border Radius */}
          {showBorderRadius && (
            <div className="flex items-center justify-between">
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Border Radius</Label>
              <Select value={globalStyle?.borderRadius || 'medium'} onValueChange={(value) => handleGlobalStyleUpdate({ borderRadius: value })}>
                <SelectTrigger className={`${isMobileViewport ? "h-10" : "h-8"} w-32`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Component Styles */}
          {showComponentStyles && (
            <div className="border-t pt-4">
              <GlobalComponentStyles
                globalStyle={globalStyle}
                onUpdate={handleGlobalStyleUpdate}
                isMobileViewport={isMobileViewport}
              />
            </div>
          )}

          {/* Login Page Configuration */}
          {showLoginPage && (
            <GlobalLoginPageSection
              currentLoginConfig={currentLoginConfig}
              postAuthRedirectPageId={postAuthRedirectPageId}
              availablePages={availablePages}
              isMobileViewport={isMobileViewport}
              isSavingLoginConfig={isSavingLoginConfig}
              setLoginPageConfig={setLoginPageConfig}
              setPostAuthRedirectPageId={setPostAuthRedirectPageId}
              onSaveLoginConfig={handleSaveLoginConfig}
            />
          )}
        </div>
      </div>
    </CentralizedDrawer>
  )
}

