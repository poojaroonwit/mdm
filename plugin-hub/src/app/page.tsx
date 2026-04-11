'use client'

import Link from 'next/link'
import { MarketingFeatures } from './components/MarketingFeatures'
import { icons } from './components/icons'

export default function HubHome() {
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <section style={{
        background: 'hsl(var(--muted))',
        padding: '80px 24px',
        textAlign: 'center',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          color: 'hsl(var(--foreground))',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
          maxWidth: '800px',
          lineHeight: '1.2',
        }}>
          Supercharge your platform with powerful plugins
        </h1>
        <p style={{
          fontSize: '20px',
          color: 'hsl(var(--muted-foreground))',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
        }}>
          Discover integrations, templates, and tools to extend the capabilities of your MDM solution.
        </p>

        <Link href="/plugins" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '16px 32px',
            background: 'var(--primary-gradient)',
            border: 'none',
            borderRadius: '8px',
            color: 'hsl(var(--primary-foreground))',
            fontSize: '18px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <icons.package style={{ width: '20px', height: '20px' }} />
            Browse Plugin Hub
          </button>
        </Link>
      </section>

      <MarketingFeatures />

      {/* Social Proof / Trust Section */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '32px' }}>
          Trusted by industry leaders
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', opacity: 0.5, flexWrap: 'wrap' }}>
          {/* Placeholders for logos */}
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>ACME Corp</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Globex</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Soylent</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Initech</div>
        </div>
      </section>
    </div>
  )
}
