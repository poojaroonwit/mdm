'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CustomerDetailDialogProps {
  customer: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {customer?.firstName} {customer?.lastName}
          </DialogTitle>
          <DialogDescription>
            {customer?.email} | {customer?.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 h-full">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <p className="text-sm text-muted-foreground">{customer?.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <p className="text-sm text-muted-foreground">{customer?.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{customer?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-muted-foreground">{customer?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Company</label>
                    <p className="text-sm text-muted-foreground">{customer?.company}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <p className="text-sm text-muted-foreground">{customer?.position}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Source</label>
                    <p className="text-sm text-muted-foreground">{customer?.source}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Industry</label>
                    <p className="text-sm text-muted-foreground">{customer?.industry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Contact</label>
                    <p className="text-sm text-muted-foreground">{customer?.lastContact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Show</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No events associated</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    No comments yet
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <div className="font-medium">Customer created</div>
                    <div className="text-muted-foreground">2 days ago by Admin User</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Email updated</div>
                    <div className="text-muted-foreground">1 day ago by Manager User</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
