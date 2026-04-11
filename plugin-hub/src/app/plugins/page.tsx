'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { icons } from '../components/icons'

const categoryIconMap: Record<string, keyof typeof icons> = {
    'business-intelligence': 'barChart',
    'monitoring-observability': 'activity',
    'database-management': 'database',
    'storage-management': 'hardDrive',
    'api-gateway': 'globe',
    'service-management': 'settings',
    'data-integration': 'zap',
    'automation': 'zap',
    'analytics': 'barChart',
    'security': 'shield',
    'development-tools': 'code',
    'report-templates': 'template',
    'other': 'package'
}

interface Plugin {
    id: string
    name: string
    slug: string
    description?: string
    version: string
    provider: string
    category: string
    status: string
    verified: boolean
    iconUrl?: string
    installationCount?: number
}

interface Template {
    id: string
    name: string
    description?: string
    source: string
    visibility: 'private' | 'public'
    author_name?: string
    preview_image?: string
    tags?: string[]
    downloads: number
}

export default function PluginsPage() {
    const [plugins, setPlugins] = useState<Plugin[]>([])
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'plugins' | 'templates'>('plugins')
    const [searchQuery, setSearchQuery] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        source: 'CUSTOM_EMBED_LINK',
        visibility: 'public' as 'public' | 'private',
        author_name: '',
        tags: '',
    })

    useEffect(() => {
        Promise.all([
            fetch('/api/plugins').then(res => res.json()),
            fetch('/api/templates').then(res => res.json())
        ])
            .then(([pluginData, templateData]) => {
                setPlugins(pluginData.plugins || [])
                setTemplates(templateData.templates || [])
                setLoading(false)
            })
            .catch(err => {
                console.error('Error fetching data:', err)
                setLoading(false)
            })
    }, [])

    const filteredPlugins = plugins.filter(p =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredTemplates = templates.filter(t =>
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.source) return

        setUploading(true)
        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setTemplates([data.template, ...templates])
                setShowUploadModal(false)
                setFormData({ name: '', description: '', source: 'CUSTOM_EMBED_LINK', visibility: 'public', author_name: '', tags: '' })
            }
        } catch (err) {
            console.error('Upload error:', err)
        } finally {
            setUploading(false)
        }
    }

    const getCategoryIcon = (category: string) => {
        const iconKey = categoryIconMap[category] || 'package'
        const Icon = icons[iconKey]
        return <Icon style={{ width: '24px', height: '24px' }} />
    }

    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', padding: '32px 24px' }}>
            <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>Plugin Hub</h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your plugins and templates</p>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '32px',
                    borderBottom: '1px solid hsl(var(--border))',
                    paddingBottom: '0',
                }}>
                    <button
                        onClick={() => setActiveTab('plugins')}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'plugins' ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                            color: activeTab === 'plugins' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: '0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <icons.package style={{ width: '16px', height: '16px' }} />
                        Plugins
                        <span style={{
                            background: activeTab === 'plugins' ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
                            color: activeTab === 'plugins' ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}>
                            {filteredPlugins.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'templates' ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                            color: activeTab === 'templates' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: '0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <icons.template style={{ width: '16px', height: '16px' }} />
                        Templates
                        <span style={{
                            background: activeTab === 'templates' ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
                            color: activeTab === 'templates' ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}>
                            {filteredTemplates.length}
                        </span>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid hsl(var(--border))',
                            borderTopColor: 'hsl(var(--foreground))',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : activeTab === 'plugins' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '16px',
                    }}>
                        {filteredPlugins.map((plugin, i) => (
                            <Link
                                key={plugin.id}
                                href={`/plugins/${plugin.slug}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div
                                    style={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '20px',
                                        transition: '0.15s ease',
                                        cursor: 'pointer',
                                        animation: `fadeIn 0.3s ease ${i * 0.05}s forwards`,
                                        opacity: 0,
                                        height: '100%'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--foreground))'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--border))'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'hsl(var(--muted))',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'hsl(var(--muted-foreground))',
                                            flexShrink: 0,
                                        }}>
                                            {getCategoryIcon(plugin.category)}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h3 style={{
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    color: 'hsl(var(--foreground))',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {plugin.name}
                                                </h3>
                                                {plugin.verified && (
                                                    <span style={{
                                                        background: 'hsl(142, 76%, 36%, 0.1)',
                                                        color: 'hsl(142, 76%, 36%)',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <icons.check style={{ width: '12px', height: '12px' }} />
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{
                                                fontSize: '13px',
                                                color: 'hsl(var(--muted-foreground))',
                                                marginBottom: '12px',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: '1.5',
                                            }}>
                                                {plugin.description || 'No description available'}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                                                    v{plugin.version}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                                                    {plugin.provider}
                                                </span>
                                                <span style={{
                                                    fontSize: '12px',
                                                    background: 'hsl(var(--muted))',
                                                    color: 'hsl(var(--muted-foreground))',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                }}>
                                                    {plugin.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {filteredPlugins.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: 'hsl(var(--muted-foreground))',
                            }}>
                                <div style={{ marginBottom: '16px', color: 'hsl(var(--muted-foreground))' }}>
                                    <icons.package style={{ width: '48px', height: '48px' }} />
                                </div>
                                <p>No plugins found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '16px',
                    }}>
                        {filteredTemplates.map((template, i) => (
                            <div
                                key={template.id}
                                style={{
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '20px',
                                    transition: '0.15s ease',
                                    cursor: 'pointer',
                                    animation: `fadeIn 0.3s ease ${i * 0.05}s forwards`,
                                    opacity: 0,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'hsl(var(--foreground))'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'hsl(var(--border))'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: 'var(--primary-gradient)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'hsl(var(--primary-foreground))',
                                        flexShrink: 0,
                                    }}>
                                        <icons.template style={{ width: '24px', height: '24px' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                                {template.name}
                                            </h3>
                                            <span style={{
                                                background: template.visibility === 'public'
                                                    ? 'hsl(142, 76%, 36%, 0.1)'
                                                    : 'hsl(var(--muted))',
                                                color: template.visibility === 'public'
                                                    ? 'hsl(142, 76%, 36%)'
                                                    : 'hsl(var(--muted-foreground))',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                {template.visibility === 'public' ? (
                                                    <><icons.globe style={{ width: '12px', height: '12px' }} /> Public</>
                                                ) : (
                                                    <><icons.lock style={{ width: '12px', height: '12px' }} /> Private</>
                                                )}
                                            </span>
                                        </div>
                                        <p style={{
                                            fontSize: '13px',
                                            color: 'hsl(var(--muted-foreground))',
                                            marginBottom: '12px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: '1.5',
                                        }}>
                                            {template.description || 'No description'}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '12px',
                                                background: 'hsl(var(--muted))',
                                                color: 'hsl(var(--muted-foreground))',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                            }}>
                                                {template.source}
                                            </span>
                                            {template.author_name && (
                                                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                                                    by {template.author_name}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '12px',
                                                color: 'hsl(var(--muted-foreground))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <icons.download style={{ width: '12px', height: '12px' }} />
                                                {template.downloads || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredTemplates.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: 'hsl(var(--muted-foreground))',
                            }}>
                                <div style={{ marginBottom: '16px', color: 'hsl(var(--muted-foreground))' }}>
                                    <icons.template style={{ width: '48px', height: '48px' }} />
                                </div>
                                <p>No templates yet. Be the first to upload one!</p>
                                <button
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 24px',
                                        background: 'var(--primary-gradient)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--primary-foreground))',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: '0.15s ease',
                                    }}
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    <icons.upload style={{ width: '16px', height: '16px' }} />
                                    Upload Template
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                    onClick={(e) => e.target === e.currentTarget && setShowUploadModal(false)}
                >
                    <div
                        style={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px',
                            maxWidth: '480px',
                            width: '100%',
                            animation: 'fadeIn 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <icons.upload style={{ width: '20px', height: '20px' }} />
                                Upload Template
                            </h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'hsl(var(--muted-foreground))',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                }}
                            >
                                <icons.x style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="My Dashboard Template"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'hsl(var(--input))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--foreground))',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your template..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'hsl(var(--input))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--foreground))',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                        Type
                                    </label>
                                    <select
                                        value={formData.source}
                                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'hsl(var(--input))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'hsl(var(--foreground))',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <option value="CUSTOM_EMBED_LINK">Embed Link</option>
                                        <option value="POWER_BI">Power BI</option>
                                        <option value="GRAFANA">Grafana</option>
                                        <option value="LOOKER_STUDIO">Looker Studio</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.author_name}
                                        onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                                        placeholder="Your name"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'hsl(var(--input))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'hsl(var(--foreground))',
                                            fontSize: '14px',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="dashboard, analytics, sales"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'hsl(var(--input))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--foreground))',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{
                                marginBottom: '24px',
                                padding: '12px 16px',
                                background: 'hsl(var(--input))',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {formData.visibility === 'public' ? (
                                        <icons.globe style={{ width: '18px', height: '18px', color: 'hsl(142, 76%, 36%)' }} />
                                    ) : (
                                        <icons.lock style={{ width: '18px', height: '18px', color: 'hsl(var(--muted-foreground))' }} />
                                    )}
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '2px' }}>
                                            {formData.visibility === 'public' ? 'Public' : 'Private'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                                            {formData.visibility === 'public' ? 'Anyone can see this' : 'Only you can see this'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, visibility: formData.visibility === 'public' ? 'private' : 'public' })}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        background: formData.visibility === 'public' ? 'hsl(142, 76%, 36%)' : 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: '0.15s ease',
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: formData.visibility === 'public' ? '22px' : '2px',
                                        width: '20px',
                                        height: '20px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        transition: '0.15s ease',
                                    }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'transparent',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--muted-foreground))',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    style={{
                                        padding: '10px 24px',
                                        background: 'var(--primary-gradient)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'hsl(var(--primary-foreground))',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        opacity: uploading ? 0.7 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <icons.upload style={{ width: '16px', height: '16px' }} />
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
