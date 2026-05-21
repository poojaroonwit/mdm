'use client'

import Link from 'next/link'
import { icons } from './icons'

const columns = [
    {
        title: 'Explore',
        links: [
            { label: 'Plugin catalog', href: '/plugins' },
            { label: 'Marketplace app', href: 'http://localhost:3000/marketplace' },
            { label: 'Developer docs', href: 'http://localhost:3000/marketplace/developer' },
        ],
    },
    {
        title: 'Build',
        links: [
            { label: 'HTTP MCP endpoint', href: 'http://localhost:3000/api/developer/mcp' },
            { label: 'Starter template', href: 'http://localhost:3000/api/marketplace/templates/plugin-starter' },
            { label: 'API docs', href: 'http://localhost:3000/api-docs' },
        ],
    },
    {
        title: 'Workflow',
        links: [
            { label: 'Manage plugins', href: 'http://localhost:3000/marketplace' },
            { label: 'Installed plugins', href: 'http://localhost:3000/marketplace' },
            { label: 'Project docs', href: 'http://localhost:3000/marketplace/developer' },
        ],
    },
]

export function MarketingFooter() {
    return (
        <footer
            style={{
                background: 'hsl(var(--background))',
                borderTop: '1px solid hsl(var(--border))',
                padding: '80px 24px 40px',
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '40px',
                        marginBottom: '64px',
                    }}
                >
                    <div style={{ maxWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'var(--primary-gradient)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'hsl(var(--primary-foreground))',
                                }}
                            >
                                <icons.package style={{ width: '18px', height: '18px' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                MDM Plugin Hub
                            </span>
                        </div>

                        <p
                            style={{
                                fontSize: '14px',
                                color: 'hsl(var(--muted-foreground))',
                                lineHeight: '1.7',
                                margin: 0,
                            }}
                        >
                            A real plugin workspace connected to the live marketplace flow, developer documentation,
                            and the HTTP MCP tooling shipped with this project.
                        </p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <h4
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'hsl(var(--foreground))',
                                    margin: '0 0 20px',
                                }}
                            >
                                {column.title}
                            </h4>
                            <ul
                                style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                }}
                            >
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            style={{
                                                fontSize: '14px',
                                                color: 'hsl(var(--muted-foreground))',
                                                textDecoration: 'none',
                                                transition: 'color 0.15s ease',
                                            }}
                                            onMouseEnter={(event) => {
                                                event.currentTarget.style.color = 'hsl(var(--foreground))'
                                            }}
                                            onMouseLeave={(event) => {
                                                event.currentTarget.style.color = 'hsl(var(--muted-foreground))'
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        borderTop: '1px solid hsl(var(--border))',
                        paddingTop: '32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '24px',
                    }}
                >
                    <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
                        (c) 2026 MDM Plugin Hub. Connected to the live marketplace workflow.
                    </div>
                    <Link
                        href="http://localhost:3000/marketplace/developer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'hsl(var(--muted-foreground))',
                            textDecoration: 'none',
                            fontSize: '14px',
                        }}
                    >
                        <icons.globe style={{ width: '18px', height: '18px' }} />
                        Open developer docs
                    </Link>
                </div>
            </div>
        </footer>
    )
}
