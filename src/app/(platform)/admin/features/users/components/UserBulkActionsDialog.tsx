'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Space } from '../types'

type BulkOperation = 'role' | 'space' | 'activate' | 'deactivate' | 'delete'

interface UserBulkActionsDialogProps {
  open: boolean
  selectedUserIds: string[]
  spaces: Space[]
  onCompleted: () => void
  onOpenChange: (open: boolean) => void
}

export function UserBulkActionsDialog({
  open,
  selectedUserIds,
  spaces,
  onCompleted,
  onOpenChange,
}: UserBulkActionsDialogProps) {
  const [operation, setOperation] = useState<BulkOperation | null>(null)
  const [role, setRole] = useState('')
  const [spaceId, setSpaceId] = useState('')
  const [spaceRole, setSpaceRole] = useState('')
  const [processing, setProcessing] = useState(false)

  const resetForm = () => {
    setOperation(null)
    setRole('')
    setSpaceId('')
    setSpaceRole('')
  }

  useEffect(() => {
    if (!open) resetForm()
  }, [open])

  const handleSubmit = async () => {
    if (!operation) {
      toast.error('Please select an operation')
      return
    }

    if (operation === 'role' && !role) {
      toast.error('Please select a role')
      return
    }

    if (operation === 'space' && (!spaceId || !spaceRole)) {
      toast.error('Please select space and role')
      return
    }

    if (
      operation === 'delete' &&
      !confirm(`Are you sure you want to permanently delete ${selectedUserIds.length} user(s)? This action cannot be undone.`)
    ) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          operation: ['activate', 'deactivate', 'delete'].includes(operation) ? operation : undefined,
          role: operation === 'role' ? role : undefined,
          spaceId: operation === 'space' ? spaceId : undefined,
          spaceRole: operation === 'space' ? spaceRole : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const actionName =
          operation === 'delete'
            ? 'deleted'
            : operation === 'activate'
              ? 'activated'
              : operation === 'deactivate'
                ? 'deactivated'
                : 'updated'

        toast.success(`Successfully ${actionName} ${data.results.success.length} user(s)`)
        if (data.results.failed.length > 0) {
          toast.error(`${data.results.failed.length} user(s) failed: ${data.results.failed.map((failure: any) => failure.error).join(', ')}`)
        }

        onOpenChange(false)
        resetForm()
        onCompleted()
        return
      }

      const error = await response.json()
      toast.error(error.error || 'Bulk operation failed')
    } catch (error) {
      console.error('Error in bulk operation:', error)
      toast.error('Bulk operation failed')
    } finally {
      setProcessing(false)
    }
  }

  const disableApply =
    processing ||
    !operation ||
    (operation === 'role' && !role) ||
    (operation === 'space' && (!spaceId || !spaceRole))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Apply actions to {selectedUserIds.length} selected user(s)
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 p-6 pt-2 pb-4">
          <div>
            <Label>Operation Type</Label>
            <Select value={operation || ''} onValueChange={(value) => setOperation(value as BulkOperation)}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="role">Update Global Role</SelectItem>
                <SelectItem value="space">Assign to Space</SelectItem>
                <SelectItem value="activate">Activate Users</SelectItem>
                <SelectItem value="deactivate">Deactivate Users</SelectItem>
                <SelectItem value="delete">Delete Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === 'role' && (
            <div>
              <Label>Global Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'space' && (
            <div className="space-y-4">
              <div>
                <Label>Space</Label>
                <Select value={spaceId} onValueChange={setSpaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Space Role</Label>
                <Select value={spaceRole} onValueChange={setSpaceRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(operation === 'activate' || operation === 'deactivate') && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                This will {operation === 'activate' ? 'activate' : 'deactivate'} {selectedUserIds.length} selected user(s).
                {operation === 'deactivate' && ' Deactivated users will not be able to log in.'}
              </p>
            </div>
          )}

          {operation === 'delete' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-900 dark:text-red-200 font-semibold">
                Warning: This action cannot be undone. This will permanently delete {selectedUserIds.length} user(s) and all their associated data.
              </p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              resetForm()
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disableApply}
            variant={operation === 'delete' ? 'destructive' : 'default'}
          >
            {processing ? 'Processing...' : operation === 'delete' ? 'Delete Users' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
