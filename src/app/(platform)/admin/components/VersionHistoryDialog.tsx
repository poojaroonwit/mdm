'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { History, Rocket } from 'lucide-react'

type Chatbot = any

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedChatbot: Chatbot | null
}

export function VersionHistoryDialog({ open, onOpenChange, selectedChatbot }: VersionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and manage versions of {selectedChatbot?.name}
          </DialogDescription>
        </DialogHeader>
        {selectedChatbot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Current Version</div>
                <div className="text-sm text-muted-foreground">v{selectedChatbot.currentVersion}</div>
              </div>
              <Badge variant={selectedChatbot.isPublished ? 'default' : 'secondary'}>
                {selectedChatbot.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Version History</h4>
              {selectedChatbot.versions && selectedChatbot.versions.length > 0 ? (
                <div className="space-y-2">
                  {selectedChatbot.versions
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((version: any) => (
                      <Card key={version.id} className={version.isPublished ? 'border-primary' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={version.isPublished ? 'default' : 'outline'}>
                                  v{version.version}
                                </Badge>
                                {version.isPublished && (
                                  <Badge variant="secondary" className="text-xs">
                                    Published
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(version.createdAt).toLocaleString()}
                              </div>
                              {version.changes && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {version.changes}
                                </div>
                              )}
                            </div>
                            {version.isPublished && (
                              <Rocket className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No versions yet</p>
                  <p className="text-xs">Versions will be created when you save changes</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


