'use client'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Globe, Palette, RefreshCw } from 'lucide-react'
import type { SystemSettings as SystemSettingsType } from '../types'

interface SystemAppearanceSettingsTabProps {
  settings: SystemSettingsType
  setSettings: Dispatch<SetStateAction<SystemSettingsType>>
  onFaviconUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onLogoUpload: (event: ChangeEvent<HTMLInputElement>) => void
}

export function SystemAppearanceSettingsTab({
  settings,
  setSettings,
  onFaviconUpload,
  onLogoUpload,
}: SystemAppearanceSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance & Branding
        </CardTitle>
        <CardDescription>
          Customize your application's look and feel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="siteName">Application Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(event) => setSettings({ ...settings, siteName: event.target.value })}
              placeholder="My Application"
            />
          </div>
          <div>
            <Label htmlFor="siteUrl">Application URL</Label>
            <Input
              id="siteUrl"
              value={settings.siteUrl}
              onChange={(event) => setSettings({ ...settings, siteUrl: event.target.value })}
              placeholder="https://myapp.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Label htmlFor="logoUpload">Application Logo</Label>
            <div className="flex flex-col gap-3 mt-2">
              <div className="h-32 w-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 overflow-hidden relative group">
                {settings.logoUrl ? (
                  <>
                    <img
                      src={settings.logoUrl}
                      alt="App Logo"
                      className="max-h-full max-w-full object-contain p-2"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById('logoUpload')?.click()}
                      >
                        Change Logo
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="h-full w-full flex flex-col gap-2 text-muted-foreground hover:bg-transparent"
                    onClick={() => document.getElementById('logoUpload')?.click()}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Globe className="h-5 w-5 opacity-40" />
                    </div>
                    <span className="text-xs">Upload Logo</span>
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended size: 200x50px. Max 2MB.
              </div>
              <Input
                id="logoUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="faviconUpload">Favicon</Label>
            <div className="flex flex-col gap-3 mt-2">
              <div className="h-32 w-32 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20 overflow-hidden relative group">
                {settings.faviconUrl ? (
                  <>
                    <img
                      src={settings.faviconUrl}
                      alt="Favicon"
                      className="h-16 w-16 object-contain"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => document.getElementById('faviconUpload')?.click()}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="h-full w-full flex flex-col gap-2 text-muted-foreground hover:bg-transparent"
                    onClick={() => document.getElementById('faviconUpload')?.click()}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Globe className="h-5 w-5 opacity-40" />
                    </div>
                    <span className="text-[10px]">Upload</span>
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended size: 32x32px. Max 1MB.
              </div>
              <Input
                id="faviconUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFaviconUpload}
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="siteDescription">Application Description</Label>
          <Textarea
            id="siteDescription"
            value={settings.siteDescription}
            onChange={(event) => setSettings({ ...settings, siteDescription: event.target.value })}
            placeholder="Brief description of your application"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
