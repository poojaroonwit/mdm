'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  User as UserIcon,
  Save,
  Palette,
  Bell,
  Mail,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTheme } from 'next-themes'
import { useThemeContext } from '@/contexts/theme-context'

interface ProfileSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

interface ProfileData {
  name: string
  email: string
}

const defaultProfile: ProfileData = {
  name: '',
  email: '',
}

export function ProfileSettingsModal({ open, onOpenChange, user }: ProfileSettingsModalProps) {
  const { theme, setTheme } = useTheme()
  const { currentTheme, setThemeById, lightThemes, darkThemes } = useThemeContext()
  
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (open && user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
      })
      setHasChanges(false)
    }
  }, [open, user])

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleThemeSelect = (themeId: string) => {
    setThemeById(themeId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile information and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update the profile details stored on your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => updateProfile('name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      placeholder="john@example.com"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Appearance
                </CardTitle>
                <CardDescription>
                  Customize the appearance of your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Theme Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light, dark, or system preference
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex-1"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  {/* Light Themes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light Themes
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Select a light theme variant
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lightThemes.map((themeConfig) => {
                        const isSelected = currentTheme?.id === themeConfig.id
                        return (
                          <button
                            key={themeConfig.id}
                            onClick={() => handleThemeSelect(themeConfig.id)}
                            className={`p-4 border rounded-lg text-left transition-all hover:border-primary ${
                              isSelected ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-border"
                                style={{
                                  backgroundColor: `hsl(${themeConfig.colors.primary})`,
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {themeConfig.name}
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {themeConfig.variant} variant
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Dark Themes */}
                  <div className="space-y-3 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark Themes
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Select a dark theme variant
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {darkThemes.map((themeConfig) => {
                        const isSelected = currentTheme?.id === themeConfig.id
                        return (
                          <button
                            key={themeConfig.id}
                            onClick={() => handleThemeSelect(themeConfig.id)}
                            className={`p-4 border rounded-lg text-left transition-all hover:border-primary ${
                              isSelected ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-border"
                                style={{
                                  backgroundColor: `hsl(${themeConfig.colors.primary})`,
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {themeConfig.name}
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {themeConfig.variant} variant
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Notification preferences will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

