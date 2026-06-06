'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showError, showSuccess } from '@/lib/toast-utils'
import { Settings } from 'lucide-react'

interface SpaceBasicInformationPanelProps {
  space: {
    id: string
    name: string
    slug?: string | null
    description?: string | null
  }
  onRefreshSpaces: () => Promise<void> | void
}

export function SpaceBasicInformationPanel({
  space,
  onRefreshSpaces,
}: SpaceBasicInformationPanelProps) {
  const updateSpace = async (payload: Record<string, string>) => {
    const response = await fetch(`/api/spaces/${space.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to update space')
    }

    await onRefreshSpaces()
  }

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Settings className="h-5 w-5" />
          <span>Basic Information</span>
        </CardTitle>
        <CardDescription>Update your space's core details and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="space-name" className="text-sm font-medium">Space Name</Label>
            <Input
              id="space-name"
              defaultValue={space.name}
              className="h-11 border border-input bg-background"
              onBlur={async (event) => {
                const name = event.currentTarget.value.trim()
                if (!name || name === space.name) return

                try {
                  await updateSpace({ name })
                  showSuccess('Space name updated')
                } catch {
                  showError('Failed to update name')
                }
              }}
            />
            <p className="text-xs text-muted-foreground">The display name for your space</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-slug" className="text-sm font-medium">Custom URL (Slug)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                /
              </span>
              <Input
                id="space-slug"
                defaultValue={space.slug || ''}
                className="h-11 pl-8 border border-input bg-background"
                placeholder="my-space"
                onBlur={async (event) => {
                  const slug = event.currentTarget.value.trim()
                  if (slug === (space.slug || '')) return

                  try {
                    await updateSpace({ slug })
                    showSuccess('Slug updated')
                  } catch {
                    showError('Failed to update slug')
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Custom URL: /{space.slug || space.id}/dashboard
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="space-desc" className="text-sm font-medium">Description</Label>
          <Textarea
            id="space-desc"
            defaultValue={space.description || ''}
            rows={4}
            className="resize-none border border-input bg-background"
            placeholder="Describe what this space is used for..."
            onBlur={async (event) => {
              const description = event.currentTarget.value
              if (description === (space.description || '')) return

              try {
                await updateSpace({ description })
                showSuccess('Description updated')
              } catch {
                showError('Failed to update description')
              }
            }}
          />
          <p className="text-xs text-muted-foreground">A brief description of your space's purpose</p>
        </div>
      </CardContent>
    </Card>
  )
}
