'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function RolesSection() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ])
      
      if (!rRes.ok) {
        const errorData = await rRes.json().catch(() => ({}))
        throw new Error(`Failed to load roles: ${rRes.status} ${rRes.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      
      if (!pRes.ok) {
        const errorData = await pRes.json().catch(() => ({}))
        throw new Error(`Failed to load permissions: ${pRes.status} ${pRes.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      
      const r = await rRes.json()
      const p = await pRes.json()
      setRoles(r.roles || [])
      setPermissions(p.permissions || [])
    } catch (e: any) {
      console.error('Load roles/permissions error:', e)
      setError(e.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setSelectedPerms([])
    setOpen(true)
  }

  function openEdit(role: any) {
    setEditing(role)
    setName(role.name)
    setDescription(role.description || '')
    setSelectedPerms((role.permissions || []).map((p: any) => p.id))
    setOpen(true)
  }

  async function save() {
    try {
      if (!name.trim()) throw new Error('Name is required')
      if (editing) {
        const res = await fetch(`/api/roles/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) })
        if (!res.ok) throw new Error('Failed to update role')
      } else {
        const res = await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) })
        if (!res.ok) throw new Error('Failed to create role')
      }

      // Update permissions mapping
      const targetRoleId = editing ? editing.id : (await (await fetch('/api/roles')).json()).roles.find((r: any) => r.name === name)?.id
      if (targetRoleId) {
        const pres = await fetch(`/api/roles/${targetRoleId}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionIds: selectedPerms }) })
        if (!pres.ok) throw new Error('Failed to update permissions')
      }

      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this role?')) return
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Manage application roles and permissions</div>
        <Button onClick={openCreate}>Create Role</Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Permissions</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={4}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="p-4 text-red-600" colSpan={4}>{error}</td></tr>
            ) : roles.length === 0 ? (
              <tr><td className="p-4" colSpan={4}>No roles</td></tr>
            ) : (
              roles.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.description || '-'}</td>
                  <td className="p-2">{(r.permissions || []).map((p: any) => p.name).join(', ') || '-'}</td>
                  <td className="p-2 text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => openEdit(r)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(r.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto border rounded p-2">
                {permissions.map((p) => {
                  const checked = selectedPerms.includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(selectedPerms)
                          if (e.target.checked) next.add(p.id)
                          else next.delete(p.id)
                          setSelectedPerms(Array.from(next))
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
