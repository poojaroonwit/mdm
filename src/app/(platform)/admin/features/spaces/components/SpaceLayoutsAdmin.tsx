'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { useSpace } from '@/contexts/space-context'
import { Layout, Eye, Plus, Save, Trash2 } from 'lucide-react'
import { LayoutTemplate } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

const TEMPLATES_KEY = 'space_layout_templates'

function loadTemplates(): LayoutTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTemplates(items: LayoutTemplate[]) {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(items)) } catch {}
}

export function SpaceLayoutsAdmin() {
  const { spaces, isLoading: spacesLoading } = useSpace()
  const [templates, setTemplates] = useState<LayoutTemplate[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<LayoutTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview')
  const [form, setForm] = useState<{ name: string; description: string }>({ name: '', description: '' })
  const [allowedDialog, setAllowedDialog] = useState<LayoutTemplate | null>(null)

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  const startCreate = () => {
    setEditing({ id: `layout_${Date.now()}`, name: 'New Layout', description: '', json: {}, allowedSpaceIds: [] })
    setForm({ name: 'New Layout', description: '' })
    setActiveTab('preview')
    setShowEditor(true)
  }

  const startEdit = (item: LayoutTemplate) => {
    setEditing(item)
    setForm({ name: item.name, description: item.description || '' })
    setActiveTab('preview')
    setShowEditor(true)
  }

  const removeTemplate = (id: string) => {
    const next = templates.filter(t => t.id !== id)
    setTemplates(next)
    saveTemplates(next)
  }

  const saveTemplate = () => {
    if (!editing) return
    const next: LayoutTemplate = { ...editing, name: form.name.trim() || editing.name, description: form.description }
    const list = templates.some(t => t.id === next.id)
      ? templates.map(t => (t.id === next.id ? next : t))
      : [...templates, next]
    setTemplates(list)
    saveTemplates(list)
    setShowEditor(false)
  }

  const toggleAllowed = (tmpl: LayoutTemplate, spaceId: string) => {
    const exists = tmpl.allowedSpaceIds.includes(spaceId)
    const updated: LayoutTemplate = {
      ...tmpl,
      allowedSpaceIds: exists
        ? tmpl.allowedSpaceIds.filter(id => id !== spaceId)
        : [...tmpl.allowedSpaceIds, spaceId]
    }
    const list = templates.map(t => (t.id === tmpl.id ? updated : t))
    setTemplates(list)
    saveTemplates(list)
    setAllowedDialog(updated)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Space Layout Templates</h2>
        </div>
        <Button className="rounded-xl font-bold" onClick={startCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Allowed Spaces</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 px-3 font-medium">{t.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{t.description}</td>
                    <td className="py-2 px-3">{t.allowedSpaceIds.length}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Button className="rounded-xl font-bold" size="sm" variant="outline" onClick={() => startEdit(t)}>
                          <Eye className="h-4 w-4 mr-1" /> Configure
                        </Button>
                        <Button className="rounded-xl font-bold" size="sm" variant="outline" onClick={() => setAllowedDialog(t)}>
                          Allowed Spaces
                        </Button>
                        <Button className="rounded-xl font-bold" size="sm" variant="destructive" onClick={() => removeTemplate(t.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">No templates yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Editor dialog with 70/30 split */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit Layout Template</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 md:grid-cols-10 gap-4">
            <div className="md:col-span-7">
              <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl" />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-3">
              <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Name</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Description</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800 shadow-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <Button className="rounded-xl font-bold w-full" onClick={saveTemplate}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Allowed spaces dialog */}
      <Dialog open={!!allowedDialog} onOpenChange={(v) => !v && setAllowedDialog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Allowed Spaces</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-2 max-h-[60vh] overflow-y-auto">
            {spacesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
              </div>
            ) : spaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No spaces available</p>
              </div>
            ) : (
              spaces.map((s: any) => {
                const checked = !!allowedDialog?.allowedSpaceIds.includes(s.id)
                return (
                  <label key={s.id} className="flex items-center justify-between border rounded p-2 hover:bg-muted/50 cursor-pointer">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.slug || s.id}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => allowedDialog && toggleAllowed(allowedDialog, s.id)}
                      className="cursor-pointer"
                    />
                  </label>
                )
              })
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SpaceLayoutsAdmin


