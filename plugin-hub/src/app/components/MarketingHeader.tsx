'use client'

import Link from 'next/link'
import { icons } from './icons'

export function MarketingHeader() {
    return (
        <header style={{
            background: 'linear-gradient(180deg, rgba(9, 14, 29, 0.94), rgba(18, 25, 43, 0.84))',
            borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                background: 'var(--primary-gradient)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--primary-foreground))',
                            }}>
                                <icons.package style={{ width: '20px', height: '20px' }} />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                                MDM Plugin Hub
                            </span>
                        </div>
                    </Link>
                    {/* Nav Links */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link
                            href="/plugins"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Plugins
                        </Link>
                        <Link
                            href="http://localhost:3000/marketplace"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="http://localhost:3000/marketplace/developer"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Developer Docs
                        </Link>
                        <Link
                            href="http://localhost:3000/api-docs"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Swagger
                        </Link>
                        <Link
                            href="http://localhost:3000/api/marketplace/templates/plugin-starter"
                            style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                        >
                            Starter Download
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link href="http://localhost:3000/marketplace" style={{
                            textDecoration: 'none',
                            padding: '10px 20px',
                            background: 'var(--primary-gradient)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: 'hsl(var(--primary-foreground))',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}>
                            Open Main App
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
