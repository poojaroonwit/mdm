'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { showSuccess, showError } from '@/lib/toast-utils'

interface AddVMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId?: string | null
  onSuccess: () => void
}

export function AddVMDialog({
  open,
  onOpenChange,
  spaceId,
  onSuccess,
}: AddVMDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    description: '',
    spaceId: spaceId || '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        host: '',
        port: '22',
        username: '',
        password: '',
        description: '',
        spaceId: spaceId || '',
      })
    }
  }, [open, spaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const connectionConfig: any = {
        username: form.username,
        password: form.password,
      }

      const response = await fetch('/api/infrastructure/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: 'vm',
          host: form.host,
          port: form.port ? parseInt(form.port) : 22,
          protocol: 'ssh',
          connection_type: 'ssh',
          connection_config: connectionConfig,
          description: form.description || null,
          space_id: form.spaceId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create VM')
      }

      showSuccess('VM created successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to create VM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Virtual Machine</DialogTitle>
          <DialogDescription>
            Add a new virtual machine to your infrastructure. You'll be able to manage and monitor it from here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-zinc-500">VM Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter VM name"
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host" className="text-xs font-black uppercase tracking-widest text-zinc-500">Host / IP Address *</Label>
                  <Input
                    id="host"
                    value={form.host}
                    onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
                    placeholder="e.g., 192.168.1.100"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port" className="text-xs font-black uppercase tracking-widest text-zinc-500">SSH Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))}
                    placeholder="22"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-zinc-500">SSH Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter SSH username"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-500">SSH Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter SSH password"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-zinc-500">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="rounded-2xl"
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-11 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name || !form.host} className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold">
              {loading ? 'Creating...' : 'Create VM'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

