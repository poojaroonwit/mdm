'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ExternalLink, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import {
  DEFAULT_LOGIN_PAGE_CONFIG,
  type LoginPageConfig,
} from '@/lib/login-page-config'

interface LoginPageSettingsPanelProps {
  config: LoginPageConfig
  loginPageUrl: string
  saving: boolean
  onSave: () => void
  setConfig: Dispatch<SetStateAction<LoginPageConfig>>
}

function getPreviewBackground(config: LoginPageConfig) {
  if (config.backgroundType === 'color') {
    return config.backgroundColor
  }

  if (config.backgroundType === 'image' && config.backgroundImage) {
    return `url(${config.backgroundImage}) center / cover no-repeat`
  }

  return `linear-gradient(${config.gradient.angle}deg, ${config.gradient.from}, ${config.gradient.to})`
}

export function LoginPageSettingsPanel({
  config,
  loginPageUrl,
  saving,
  onSave,
  setConfig,
}: LoginPageSettingsPanelProps) {
  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="gap-4 pb-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Layout className="h-5 w-5" />
            <span>Login Page Customization</span>
          </CardTitle>
          <CardDescription>
            Configure the actual space login experience, not just the artwork. These settings drive the live sign-in page.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={loginPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Login Page
            </a>
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Login Page'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Hero Preview</p>
                <h3 className="mt-2 text-3xl font-semibold text-foreground">
                  {config.heroTitle || DEFAULT_LOGIN_PAGE_CONFIG.heroTitle}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {config.heroDescription || DEFAULT_LOGIN_PAGE_CONFIG.heroDescription}
                </p>
              </div>
              <div
                className="min-h-[180px] rounded-2xl border border-white/40 p-5"
                style={{ background: getPreviewBackground(config) }}
              >
                <div
                  className="ml-auto flex max-w-sm flex-col gap-3 rounded-2xl border p-4"
                  style={{
                    backgroundColor: config.cardStyle.backgroundColor,
                    borderColor: config.cardStyle.borderColor,
                    color: config.cardStyle.textColor,
                    borderRadius: config.cardStyle.borderRadius,
                    boxShadow: config.cardStyle.shadow === false ? 'none' : '0 20px 45px rgba(15, 23, 42, 0.12)',
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{config.title || DEFAULT_LOGIN_PAGE_CONFIG.title}</p>
                    <p className="text-sm opacity-80">{config.description || DEFAULT_LOGIN_PAGE_CONFIG.description}</p>
                  </div>
                  <div className="rounded-md border bg-background/70 px-3 py-2 text-sm text-muted-foreground">name@example.com</div>
                  <div className="rounded-md border bg-background/70 px-3 py-2 text-sm text-muted-foreground">Password</div>
                  <div className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                    {config.signInButtonLabel || DEFAULT_LOGIN_PAGE_CONFIG.signInButtonLabel}
                  </div>
                  {config.helpText ? (
                    <p className="text-xs opacity-80">{config.helpText}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="border border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content</CardTitle>
                  <CardDescription>Headline, helper copy, and call-to-action text.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Sign-in Title</Label>
                      <Input
                        value={config.title || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Welcome back"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Label</Label>
                      <Input
                        value={config.signInButtonLabel || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, signInButtonLabel: event.target.value }))}
                        placeholder="Sign in"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sign-in Description</Label>
                    <Textarea
                      value={config.description || ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, description: event.target.value }))}
                      rows={2}
                      placeholder="Sign in to access this workspace."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Title</Label>
                    <Input
                      value={config.heroTitle || ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, heroTitle: event.target.value }))}
                      placeholder="Your space, ready when you are"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Description</Label>
                    <Textarea
                      value={config.heroDescription || ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, heroDescription: event.target.value }))}
                      rows={3}
                      placeholder="Secure access for your team, data, and workflows in one place."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Helper Text</Label>
                    <Textarea
                      value={config.helpText || ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, helpText: event.target.value }))}
                      rows={2}
                      placeholder="Optional support text shown under the form."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Show Logo</p>
                        <p className="text-xs text-muted-foreground">Display a space-specific mark above the hero title.</p>
                      </div>
                      <Select
                        value={config.showLogo === false ? 'hide' : 'show'}
                        onValueChange={(value) => setConfig((prev) => ({ ...prev, showLogo: value === 'show' }))}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Show</SelectItem>
                          <SelectItem value="hide">Hide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={config.logoUrl || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, logoUrl: event.target.value }))}
                        placeholder="https://example.com/logo.svg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Visual Style</CardTitle>
                  <CardDescription>Background, layout split, and card appearance.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Background Type</Label>
                      <Select
                        value={config.backgroundType}
                        onValueChange={(value) => {
                          setConfig((prev) => ({
                            ...prev,
                            backgroundType: value as LoginPageConfig['backgroundType'],
                          }))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="color">Solid Color</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Left Panel Width</Label>
                      <Input
                        value={config.leftPanelWidth || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, leftPanelWidth: event.target.value }))}
                        placeholder="60%"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Right Panel Width</Label>
                      <Input
                        value={config.rightPanelWidth || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, rightPanelWidth: event.target.value }))}
                        placeholder="40%"
                      />
                    </div>
                  </div>

                  {config.backgroundType === 'color' ? (
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <ColorInput
                        value={config.backgroundColor || DEFAULT_LOGIN_PAGE_CONFIG.backgroundColor || '#f8fafc'}
                        onChange={(value) => setConfig((prev) => ({ ...prev, backgroundColor: value }))}
                        allowImageVideo={false}
                      />
                    </div>
                  ) : null}

                  {config.backgroundType === 'gradient' ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Gradient From</Label>
                        <ColorInput
                          value={config.gradient.from}
                          onChange={(value) => setConfig((prev) => ({
                            ...prev,
                            gradient: { ...prev.gradient, from: value },
                          }))}
                          allowImageVideo={false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gradient To</Label>
                        <ColorInput
                          value={config.gradient.to}
                          onChange={(value) => setConfig((prev) => ({
                            ...prev,
                            gradient: { ...prev.gradient, to: value },
                          }))}
                          allowImageVideo={false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Angle</Label>
                        <Input
                          type="number"
                          value={config.gradient.angle}
                          onChange={(event) => setConfig((prev) => ({
                            ...prev,
                            gradient: { ...prev.gradient, angle: Number(event.target.value) || DEFAULT_LOGIN_PAGE_CONFIG.gradient.angle },
                          }))}
                          min="0"
                          max="360"
                        />
                      </div>
                    </div>
                  ) : null}

                  {config.backgroundType === 'image' ? (
                    <div className="space-y-2">
                      <Label>Background Image URL</Label>
                      <Input
                        value={config.backgroundImage || ''}
                        onChange={(event) => setConfig((prev) => ({ ...prev, backgroundImage: event.target.value }))}
                        placeholder="https://example.com/background.jpg"
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Card Background</Label>
                      <ColorInput
                        value={config.cardStyle.backgroundColor}
                        onChange={(value) => setConfig((prev) => ({
                          ...prev,
                          cardStyle: { ...prev.cardStyle, backgroundColor: value },
                        }))}
                        allowImageVideo={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Text Color</Label>
                      <ColorInput
                        value={config.cardStyle.textColor}
                        onChange={(value) => setConfig((prev) => ({
                          ...prev,
                          cardStyle: { ...prev.cardStyle, textColor: value },
                        }))}
                        allowImageVideo={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Border Color</Label>
                      <ColorInput
                        value={config.cardStyle.borderColor}
                        onChange={(value) => setConfig((prev) => ({
                          ...prev,
                          cardStyle: { ...prev.cardStyle, borderColor: value },
                        }))}
                        allowImageVideo={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Radius</Label>
                      <Input
                        type="number"
                        value={config.cardStyle.borderRadius}
                        onChange={(event) => setConfig((prev) => ({
                          ...prev,
                          cardStyle: {
                            ...prev.cardStyle,
                            borderRadius: Number(event.target.value) || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderRadius,
                          },
                        }))}
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
