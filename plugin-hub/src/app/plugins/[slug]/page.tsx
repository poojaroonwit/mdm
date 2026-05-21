'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface FileNode {
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
  content?: string
}

interface PluginDetail {
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
  supportUrl?: string
  files: FileNode[]
}

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
  rating: number
  helpfulCount?: number
}

export default function PluginDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug
  const [plugin, setPlugin] = useState<PluginDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewAuthor, setReviewAuthor] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!slug) return

    Promise.all([
      fetch(`/api/plugins/${slug}`).then((res) => res.json()),
      fetch(`/api/plugins/${slug}/comments`).then((res) => res.json()),
    ])
      .then(([pluginData, commentsData]) => {
        if (pluginData.error) {
          throw new Error(pluginData.error)
        }

        setPlugin(pluginData)
        setComments(commentsData.comments || [])
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load plugin')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!slug || !reviewText.trim()) return

    try {
      setPosting(true)
      const response = await fetch(`/api/plugins/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: reviewAuthor || 'Anonymous',
          content: reviewText,
          rating: 5,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post review')
      }

      setComments((current) => [data.comment, ...current])
      setReviewText('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to post review')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return <div style={shellStyle}>Loading plugin details...</div>
  }

  if (!plugin) {
    return (
      <div style={shellStyle}>
        <div style={panelStyle}>
          <h1 style={{ marginTop: 0 }}>Plugin not found</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>{error || 'This plugin could not be loaded.'}</p>
          <Link href="/plugins" style={linkStyle}>Back to plugins</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section style={panelStyle}>
          <Link href="/plugins" style={{ ...linkStyle, marginBottom: '16px', display: 'inline-block' }}>Back to plugins</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '36px' }}>{plugin.name}</h1>
              <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '720px' }}>
                {plugin.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={softTagStyle}>{plugin.category}</span>
                <span style={softTagStyle}>v{plugin.version}</span>
                <span style={softTagStyle}>{plugin.provider}</span>
                {plugin.verified && <span style={softTagStyle}>Verified</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href={plugin.documentationUrl || 'http://localhost:3000/marketplace/developer'} style={linkStyle}>Documentation</a>
              <a href="http://localhost:3000/marketplace" style={primaryLinkStyle}>Open Marketplace</a>
            </div>
          </div>
        </section>

        {error && <div style={{ ...panelStyle, color: 'hsl(var(--destructive))' }}>{error}</div>}

        <section style={{ display: 'grid', gap: '24px', gridTemplateColumns: '2fr 1fr' }}>
          <div style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Source preview</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <FileTree nodes={plugin.files} depth={0} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Developer workflow</h2>
              <p style={mutedText}>Use the main app to manage plugin records, installations, and MCP tools.</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <a href="http://localhost:3000/marketplace/developer" style={linkStyle}>Project developer docs</a>
                <a href="http://localhost:3000/api/marketplace/templates/plugin-starter" style={linkStyle}>Download starter template</a>
                <a href="http://localhost:3000/api/developer/mcp" style={linkStyle}>HTTP MCP endpoint</a>
              </div>
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Reviews</h2>
              <form onSubmit={submitComment} style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
                <input
                  value={reviewAuthor}
                  onChange={(event) => setReviewAuthor(event.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  rows={4}
                  placeholder="Write a review"
                  style={inputStyle}
                />
                <button type="submit" disabled={posting} style={primaryButtonStyle}>
                  {posting ? 'Posting...' : 'Post review'}
                </button>
              </form>

              <div style={{ display: 'grid', gap: '12px' }}>
                {comments.length === 0 ? (
                  <p style={mutedText}>No reviews yet.</p>
                ) : (
                  comments.map((comment) => (
                    <article key={comment.id} style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <strong>{comment.author}</strong>
                        <span style={mutedText}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ marginBottom: 0, color: 'hsl(var(--muted-foreground))' }}>{comment.content}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FileTree({ nodes, depth }: { nodes: FileNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node) => (
        <div key={`${depth}-${node.name}`} style={{ paddingLeft: `${depth * 16}px`, borderLeft: depth > 0 ? '1px solid hsl(var(--border))' : 'none' }}>
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              {node.type === 'directory' ? `${node.name}/` : node.name}
            </div>
            {node.content && (
              <pre style={{
                margin: '8px 0 0',
                padding: '12px',
                borderRadius: '12px',
                background: 'hsl(var(--muted))',
                overflowX: 'auto',
                fontSize: '12px',
              }}>
                {node.content}
              </pre>
            )}
          </div>
          {node.children && node.children.length > 0 && (
            <FileTree nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </>
  )
}

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'hsl(var(--background))',
  padding: '32px 24px',
}

const panelStyle: CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '24px',
  padding: '24px',
}

const mutedText: CSSProperties = {
  color: 'hsl(var(--muted-foreground))',
  fontSize: '14px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}

const linkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'hsl(var(--foreground))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '999px',
  padding: '10px 14px',
  fontWeight: 600,
}

const primaryLinkStyle: CSSProperties = {
  ...linkStyle,
  background: 'var(--primary-gradient)',
  color: 'hsl(var(--primary-foreground))',
  border: '1px solid transparent',
}

const primaryButtonStyle: CSSProperties = {
  borderRadius: '999px',
  border: '1px solid transparent',
  padding: '12px 16px',
  background: 'var(--primary-gradient)',
  color: 'hsl(var(--primary-foreground))',
  fontWeight: 600,
  cursor: 'pointer',
}

const softTagStyle: CSSProperties = {
  background: 'hsl(var(--muted))',
  color: 'hsl(var(--muted-foreground))',
  borderRadius: '999px',
  padding: '5px 10px',
  fontSize: '12px',
}
