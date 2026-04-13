'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose
} from '@/components/ui/drawer'
import { History, RotateCcw, X, Check, FileText } from 'lucide-react'
import { ChatbotVersion, Chatbot } from '../types'
import toast from 'react-hot-toast'

interface VersionDrawerProps {
  versions: ChatbotVersion[]
  currentVersion?: string
  onRestore: (version: ChatbotVersion) => void
  chatbot?: Partial<Chatbot>
  iconOnly?: boolean // If true, show only icon without label
  open?: boolean // Controlled open state
  onOpenChange?: (open: boolean) => void // Controlled open change handler
}

export function VersionDrawer({
  versions,
  currentVersion,
  onRestore,
  chatbot,
  iconOnly = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: VersionDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const handleRestore = async (version: ChatbotVersion) => {
    setRestoringId(version.id)
    try {
      await onRestore(version)
      toast.success(`Restored to version ${version.version}`)
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Sort versions by date (newest first)
  const sortedVersions = [...versions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted">
            <History className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {versions.length}
              </Badge>
            )}
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent widthClassName="w-[400px]">
        <DrawerHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <DrawerTitle>Version History</DrawerTitle>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {sortedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No versions yet</p>
              <p className="text-sm">Save your chatbot to create the first version</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVersions.map((version, index) => {
                const isCurrent = version.version === currentVersion || (index === 0 && !currentVersion)
                const isRestoring = restoringId === version.id

                return (
                  <div
                    key={version.id}
                    className={`
                      relative rounded-lg border p-4 transition-all
                      ${isCurrent 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            v{version.version}
                          </span>
                          
                          {/* Draft/Published Badge */}
                          {version.isPublished ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Draft
                            </Badge>
                          )}

                          {/* Current Indicator */}
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                              Current
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(version.createdAt)}
                        </p>

                        {version.changes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {version.changes}
                          </p>
                        )}
                      </div>

                      {/* Restore Button - only show for non-current versions */}
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleRestore(version)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          <span className="ml-1.5">Restore</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with current status */}
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current version:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">v{currentVersion || sortedVersions[0]?.version || '1.0.0'}</span>
              {chatbot?.isPublished ? (
                <Badge variant="default" className="bg-green-600 text-xs">Published</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
