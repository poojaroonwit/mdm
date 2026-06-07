'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { ChevronRight, Layout, LayoutDashboard, Loader2, Plus } from 'lucide-react'

interface CreateDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dialogStep: 1 | 2
  setDialogStep: (step: 1 | 2) => void
  createReportSpaceId: string
  setCreateReportSpaceId: (spaceId: string) => void
  pagesLoading: boolean
  spacePages: Array<{ id: string; title: string }>
  selectedPageId: string
  setSelectedPageId: (pageId: string) => void
  pageMode: 'existing' | 'create'
  setPageMode: (mode: 'existing' | 'create') => void
  newPageName: string
  setNewPageName: (name: string) => void
  isCreating: boolean
  handleNextStep: () => Promise<void>
  handleConfirmCreate: () => Promise<void>
}

export function CreateDashboardDialog({
  open,
  onOpenChange,
  dialogStep,
  setDialogStep,
  createReportSpaceId,
  setCreateReportSpaceId,
  pagesLoading,
  spacePages,
  selectedPageId,
  setSelectedPageId,
  pageMode,
  setPageMode,
  newPageName,
  setNewPageName,
  isCreating,
  handleNextStep,
  handleConfirmCreate
}: CreateDashboardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Create New Dashboard
          </DialogTitle>
          <DialogDescription>
            {dialogStep === 1
              ? 'Choose the space where you want to create your dashboard.'
              : 'Select an existing page or create a new one for your dashboard.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="p-6 pt-2 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4">
            <span className={dialogStep === 1 ? 'text-foreground font-medium' : ''}>1. Select Space</span>
            <ChevronRight className="h-4 w-4" />
            <span className={dialogStep === 2 ? 'text-foreground font-medium' : ''}>2. Select Page</span>
          </div>

          {dialogStep === 1 && (
            <div className="space-y-4">
              <SpaceSelector
                value={createReportSpaceId}
                onValueChange={setCreateReportSpaceId}
                className="w-full"
                showAllOption={false}
              />
            </div>
          )}

          {dialogStep === 2 && (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {pagesLoading ? (
                <div className="w-full space-y-2 py-2">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-2/3 rounded-md" />
                </div>
              ) : (
                <>
                  {spacePages.length > 0 && (
                    <div className="space-y-1">
                      {spacePages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => { setSelectedPageId(page.id); setPageMode('existing') }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                            pageMode === 'existing' && selectedPageId === page.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Layout className="h-4 w-4 shrink-0" />
                          {page.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPageMode('create')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                      pageMode === 'create'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted border border-dashed border-border'
                    }`}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Create new page
                  </button>

                  {pageMode === 'create' && (
                    <Input
                      placeholder="Page name"
                      value={newPageName}
                      onChange={(event) => setNewPageName(event.target.value)}
                      autoFocus
                    />
                  )}
                </>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="px-6 py-4 bg-muted/10">
          {dialogStep === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!createReportSpaceId || pagesLoading}
              >
                {pagesLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setDialogStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleConfirmCreate}
                disabled={isCreating || (pageMode === 'existing' && !selectedPageId) || (pageMode === 'create' && !newPageName.trim())}
              >
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create &amp; Open
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
