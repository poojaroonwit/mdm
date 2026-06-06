'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { showError, showSuccess } from '@/lib/toast-utils'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface SpaceDangerZoneProps {
  selectedSpace: any
  spaces: any[]
  onRefreshSpaces: () => Promise<void> | void
}

export function SpaceDangerZone({
  selectedSpace,
  spaces,
  onRefreshSpaces,
}: SpaceDangerZoneProps) {
  const handleDeleteSpace = async () => {
    try {
      const response = await fetch(`/api/spaces/${selectedSpace.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete space')
      }

      showSuccess('Space deleted successfully')
      await onRefreshSpaces()

      const remainingSpaces = spaces.filter((space) => space.id !== selectedSpace.id)
      if (remainingSpaces.length > 0) {
        const defaultSpace = remainingSpaces.find((space) => space.is_default) || remainingSpaces[0]
        window.location.href = `/${defaultSpace.slug || defaultSpace.id}/settings`
      } else {
        sessionStorage.setItem('navigate-to-spaces', 'true')
        window.location.href = '/spaces'
      }
    } catch (error) {
      console.error('Error deleting space:', error)
      showError(error instanceof Error ? error.message : 'Failed to delete space')
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Danger Zone</span>
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions. Please proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Delete Space</h4>
              <p className="text-sm text-destructive/80 mt-1">
                Permanently delete this space and all its data. This action cannot be undone.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="ml-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Space
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Space</DialogTitle>
                  <DialogDescription>
                    Are you absolutely sure you want to delete "{selectedSpace?.name}"? This will permanently delete:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All data models and their data</li>
                      <li>All dashboards and visualizations</li>
                      <li>All space members and permissions</li>
                      <li>All workflows and automation</li>
                      <li>All imported/exported data</li>
                    </ul>
                    <strong className="text-destructive mt-3 block">
                      This action cannot be undone.
                    </strong>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" className="border-0" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={handleDeleteSpace}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Space
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
