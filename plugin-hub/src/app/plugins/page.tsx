'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Plugin {
  id: string
  name: string
  slug: string
  description?: string
  version: string
  provider: string
  category: string
  status: string
  verified?: boolean
  documentationUrl?: string
}

interface Template {
  id: string
  name: string
  description?: string
  source: string
  downloads: number
  author_name?: string
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plugins' | 'templates'>('plugins')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/plugins').then((res) => res.json()),
      fetch('/api/templates').then((res) => res.json()),
    ])
      .then(([pluginData, templateData]) => {
        setPlugins(pluginData.plugins || [])
        setTemplates(templateData.templates || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredPlugins = useMemo(() => {
    return plugins.filter((plugin) => {
      const query = search.toLowerCase()
      return !query
        || plugin.name.toLowerCase().includes(query)
        || plugin.description?.toLowerCase().includes(query)
        || plugin.provider.toLowerCase().includes(query)
    })
  }, [plugins, search])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const query = search.toLowerCase()
      return !query
        || template.name.toLowerCase().includes(query)
        || template.description?.toLowerCase().includes(query)
        || template.source.toLowerCase().includes(query)
    })
  }, [templates, search])

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', padding: '32px 24px' }}>
      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section style={{ border: '1px solid hsl(var(--border))', borderRadius: '24px', padding: '28px', background: 'hsl(var(--card))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                Plugin Hub
              </p>
              <h1 style={{ margin: '8px 0 10px', fontSize: '36px', lineHeight: 1.1 }}>Real plugins, starter templates, and project docs</h1>
              <p style={{ maxWidth: '700px', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                Browse the plugin folders that actually exist in this repository, inspect their source previews,
                and jump into the marketplace developer workflow.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="http://localhost:3000/marketplace/developer" style={primaryLinkStyle}>Developer Docs</a>
              <a href="http://localhost:3000/api/marketplace/templates/plugin-starter" style={secondaryLinkStyle}>Download Starter</a>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('plugins')} style={tabStyle(activeTab === 'plugins')}>
            Plugins ({filteredPlugins.length})
          </button>
          <button onClick={() => setActiveTab('templates')} style={tabStyle(activeTab === 'templates')}>
            Templates ({filteredTemplates.length})
          </button>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search plugins or templates..."
            style={{
              flex: '1 1 280px',
              minWidth: '240px',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
            }}
          />
        </section>

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading hub data...</div>
        ) : activeTab === 'plugins' ? (
          <section style={gridStyle}>
            {filteredPlugins.map((plugin) => (
              <Link key={plugin.id} href={`/plugins/${plugin.slug}`} style={cardLinkStyle}>
                <article style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px' }}>{plugin.name}</h2>
                      <p style={{ margin: '6px 0 0', color: 'hsl(var(--muted-foreground))', fontSize: '14px' }}>{plugin.provider}</p>
                    </div>
                    {plugin.verified && <span style={pillStyle}>Verified</span>}
                  </div>
                  <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', lineHeight: 1.5 }}>
                    {plugin.description || 'No description provided.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={softTagStyle}>{plugin.category}</span>
                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>v{plugin.version}</span>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        ) : (
          <section style={gridStyle}>
            {filteredTemplates.map((template) => (
              <article key={template.id} style={cardStyle}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>{template.name}</h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', lineHeight: 1.5 }}>
                  {template.description || 'No description provided.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={softTagStyle}>{template.source}</span>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                    {template.downloads || 0} downloads
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardStyle: CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '20px',
  padding: '20px',
  display: 'grid',
  gap: '14px',
}

const pillStyle: CSSProperties = {
  border: '1px solid hsl(var(--border))',
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: '12px',
}

const softTagStyle: CSSProperties = {
  background: 'hsl(var(--muted))',
  color: 'hsl(var(--muted-foreground))',
  borderRadius: '999px',
  padding: '5px 10px',
  fontSize: '12px',
}

const primaryLinkStyle: CSSProperties = {
  textDecoration: 'none',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'var(--primary-gradient)',
  color: 'hsl(var(--primary-foreground))',
  fontWeight: 600,
}

const secondaryLinkStyle: CSSProperties = {
  textDecoration: 'none',
  borderRadius: '999px',
  padding: '12px 18px',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  fontWeight: 600,
}

function tabStyle(active: boolean): CSSProperties {
  return {
    borderRadius: '999px',
    border: active ? '1px solid transparent' : '1px solid hsl(var(--border))',
    padding: '10px 16px',
    cursor: 'pointer',
    background: active ? 'var(--primary-gradient)' : 'transparent',
    color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    fontWeight: 600,
  }
}
