'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { icons } from '../../components/icons'

// Types (should ideally be shared)
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
    description: string
    version: string
    provider: string
    category: string
    status: string
    verified: boolean
    files: FileNode[]
}

export default function PluginDetailPage() {
    const params = useParams()
    const [plugin, setPlugin] = useState<PluginDetail | null>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'reviews'>('overview')
    const [comments, setComments] = useState<any[]>([])

    // Fetch comments when tab changes to reviews or on mount
    useEffect(() => {
        if (params.slug) {
            fetch(`/api/plugins/${params.slug}/comments`)
                .then(res => res.json())
                .then(data => {
                    if (data.comments) setComments(data.comments)
                })
                .catch(console.error)
        }
    }, [params.slug])

    const handlePostComment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const author = formData.get('author')
        const content = formData.get('content')

        if (!author || !content) return

        try {
            const res = await fetch(`/api/plugins/${params.slug}/comments`, {
                method: 'POST',
                body: JSON.stringify({ author, content, rating: 5 }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await res.json()
            if (data.comment) {
                setComments(prev => [data.comment, ...prev])
                // @ts-ignore
                e.target.reset()
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (params.slug) {
            fetch(`/api/plugins/${params.slug}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setPlugin(data)
                    } else {
                        setError(data)
                    }
                    setLoading(false)
                })
                .catch(err => {
                    console.error(err)
                    setError({ error: err.message })
                    setLoading(false)
                })
        }
    }, [params.slug])

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'hsl(var(--background))' }}>
            <div style={{
                width: '40px', height: '40px',
                border: '3px solid hsl(var(--border))',
                borderTopColor: 'hsl(var(--foreground))',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (!plugin) return (
        <div style={{ minHeight: '100vh', padding: '100px', textAlign: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
            <h1>Plugin not found</h1>
            {error && <pre style={{ marginTop: '20px', textAlign: 'left', background: 'hsl(var(--muted))', padding: '20px', borderRadius: '8px', overflow: 'auto', maxWidth: '800px', margin: '20px auto' }}>{JSON.stringify(error, null, 2)}</pre>}
            <Link href="/plugins" style={{ color: 'hsl(var(--primary))' }}>Back to Hub</Link>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--background)))',
                padding: '40px 24px',
                borderBottom: '1px solid hsl(var(--border))'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Link href="/plugins" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--muted-foreground))', textDecoration: 'none', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                        <icons.check style={{ transform: 'rotate(180deg)', width: '16px', height: '16px' }} /> {/* Using Check as arrow fallback for now if arrowLeft missing, or just text */}
                        Back to Plugins
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'hsl(var(--foreground))',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <icons.package style={{ width: '40px', height: '40px' }} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>
                                    {plugin.name}
                                </h1>
                                {plugin.verified && (
                                    <span style={{
                                        background: 'hsl(142, 76%, 36%, 0.1)',
                                        color: 'hsl(142, 76%, 36%)',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <icons.check style={{ width: '14px', height: '14px' }} />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '16px', color: 'hsl(var(--muted-foreground))', maxWidth: '600px', lineHeight: '1.6' }}>
                                {plugin.description}
                            </p>

                            <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Version</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{plugin.version}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{plugin.provider}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{plugin.category}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}>
                                Documentation
                            </button>
                            <button style={{
                                padding: '12px 24px',
                                background: 'var(--primary-gradient)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'hsl(var(--primary-foreground))',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                Install Plugin
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '48px' }}>
                {/* Sidebar Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: activeTab === 'overview' ? 'hsl(var(--muted))' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: activeTab === 'overview' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: '0.15s ease'
                        }}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: activeTab === 'files' ? 'hsl(var(--muted))' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: activeTab === 'files' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: '0.15s ease'
                        }}
                    >
                        Source Code
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: activeTab === 'reviews' ? 'hsl(var(--muted))' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: activeTab === 'reviews' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: '0.15s ease'
                        }}
                    >
                        Reviews
                    </button>
                </div>

                {/* Main Content */}
                <div style={{ minHeight: '400px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '24px' }}>
                    {activeTab === 'overview' && (
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--foreground))' }}>About this plugin</h3>
                            <p style={{ lineHeight: '1.7', color: 'hsl(var(--muted-foreground))' }}>
                                {plugin.description}
                            </p>
                            <div style={{ marginTop: '32px', padding: '20px', background: 'hsl(var(--muted))', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--foreground))' }}>Dependencies</h4>
                                <ul style={{ paddingLeft: '20px', color: 'hsl(var(--muted-foreground))' }}>
                                    <li>mdm-core v{plugin.version}</li>
                                    <li>react ^18.0.0</li>
                                    <li>nodejs ^18.0.0</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>File Browser</h3>
                                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Read-only implementation</span>
                            </div>
                            <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '8px', overflow: 'hidden' }}>
                                <FileTree nodes={plugin.files} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>User Reviews</h3>
                                <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>{comments.length} reviews</span>
                            </div>

                            {/* Comment List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                                {comments.length === 0 ? (
                                    <p style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>No reviews yet. Be the first!</p>
                                ) : (
                                    comments.map((comment: any) => (
                                        <div key={comment.id} style={{ paddingBottom: '20px', borderBottom: '1px solid hsl(var(--border))' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                                    {comment.author.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', fontSize: '14px' }}>{comment.author}</span>
                                                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5', paddingLeft: '44px' }}>
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Comment Form */}
                            <div style={{ background: 'hsl(var(--muted))', padding: '24px', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'hsl(var(--foreground))' }}>Write a Review</h4>
                                <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <input
                                            name="author"
                                            placeholder="Your Name (e.g. John Doe)"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--background))',
                                                color: 'hsl(var(--foreground))',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            name="content"
                                            placeholder="Share your experience with this plugin..."
                                            required
                                            rows={4}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--background))',
                                                color: 'hsl(var(--foreground))',
                                                fontSize: '14px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="submit"
                                            style={{
                                                padding: '10px 24px',
                                                background: 'var(--primary-gradient)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Post Review
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FileTree({ nodes, depth = 0 }: { nodes: FileNode[], depth?: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {nodes.map((node, i) => (
                <FileNodeItem key={i} node={node} depth={depth} />
            ))}
        </div>
    )
}

function FileNodeItem({ node, depth }: { node: FileNode, depth: number }) {
    const [expanded, setExpanded] = useState(false)
    const isDir = node.type === 'directory'

    return (
        <div>
            <div
                onClick={() => isDir && setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    paddingLeft: `${depth * 20 + 12}px`,
                    cursor: isDir ? 'pointer' : 'default',
                    color: 'hsl(var(--foreground))',
                    background: 'transparent',
                    fontSize: '14px',
                    borderBottom: '1px solid hsl(var(--border))' // grid lines style
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <div style={{ width: '16px', display: 'flex', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
                    {isDir ? (
                        <icons.folder style={{ width: '14px', height: '14px', fill: expanded ? 'currentColor' : 'none' }} />
                    ) : (
                        <icons.file style={{ width: '14px', height: '14px' }} />
                    )}
                </div>
                <span style={{ flex: 1, fontFamily: 'monospace' }}>{node.name}</span>
                {isDir && (
                    <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                        {expanded ? '▼' : '▶'}
                    </span>
                )}
            </div>
            {isDir && expanded && node.children && (
                <FileTree nodes={node.children} depth={depth + 1} />
            )}
        </div>
    )
}
