'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Globe, Lock, FileText, Eye } from 'lucide-react'
import { TemplateItem } from '../types'

export function PageTemplatesAdmin() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'space'>('all')

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const j = await res.json()
        setTemplates(j.templates || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const filtered = templates.filter(t => {
    if (filterScope === 'all') return true
    if (filterScope === 'global') return (t.scope || 'global') === 'global'
    return (t.scope || 'global') === 'space'
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Page Templates
          </h2>
          <p className="text-muted-foreground">Manage visibility and distribution of page templates across spaces</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterScope} onValueChange={(v:any)=> setFilterScope(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="space">Space-specific</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{t.displayName}</span>
                <Badge variant="outline" className="text-xs">v{t.version}</Badge>
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                { (t.scope || 'global') === 'global' ? (
                  <><Globe className="h-4 w-4" /> Global</>
                ) : (
                  <><Lock className="h-4 w-4" /> Space</>
                ) }
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                <Button size="sm">Set Visibility</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


