'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BookOpen, ChevronDown, ChevronRight, Copy, ExternalLink, Globe } from 'lucide-react'
import type { SSOConfig } from '../types'

interface GoogleSSOSectionProps {
  config: SSOConfig
  setConfig: (config: SSOConfig) => void
  showGuide: 'google' | 'azure' | null
  setShowGuide: (guide: 'google' | 'azure' | null) => void
  copyToClipboard: (text: string) => void
}

export function GoogleSSOSection({
  config,
  setConfig,
  showGuide,
  setShowGuide,
  copyToClipboard,
}: GoogleSSOSectionProps) {
  return (
    <>
      {/* Google SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google SSO
              </CardTitle>
              <CardDescription>
                Configure Google OAuth authentication
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuide(showGuide === 'google' ? null : 'google')}
                className="text-muted-foreground"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Setup Guide
                {showGuide === 'google' ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
              <Switch
                checked={config.googleEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, googleEnabled: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        {showGuide === 'google' && (
          <CardContent className="border-t bg-muted/30">
            <div className="space-y-4 py-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                How to set up Google OAuth
              </h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
                  <span>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a> and select or create a project.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
                  <span>Navigate to <strong>APIs &amp; Services → OAuth consent screen</strong>. Set the app as <strong>Internal</strong> (for org users) or <strong>External</strong>, then fill in the required fields.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
                  <span>Go to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</strong>. Choose <strong>Web application</strong> as the type.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">4</span>
                  <div className="space-y-1">
                    <p>Under <strong>Authorized redirect URIs</strong>, add your callback URL:</p>
                    <div className="flex items-center gap-2 bg-background border rounded px-3 py-1.5 font-mono text-xs">
                      <span className="flex-1">{'{your-domain}'}/api/auth/callback/google</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => copyToClipboard('/api/auth/callback/google')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">5</span>
                  <span>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> from the created credential and paste them in the fields below.</span>
                </li>
              </ol>
            </div>
          </CardContent>
        )}
        {config.googleEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="googleClientId">Client ID</Label>
                <Input
                  id="googleClientId"
                  value={config.googleClientId}
                  onChange={(e) =>
                    setConfig({ ...config, googleClientId: e.target.value })
                  }
                  placeholder="your-google-client-id.apps.googleusercontent.com"
                />
              </div>
              <div>
                <Label htmlFor="googleClientSecret">Client Secret</Label>
                <Input
                  id="googleClientSecret"
                  type="password"
                  value={config.googleClientSecret}
                  onChange={(e) =>
                    setConfig({ ...config, googleClientSecret: e.target.value })
                  }
                  placeholder="GOCSPX-..."
                />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Google SSO will appear on all login pages.
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </>
  )
}
