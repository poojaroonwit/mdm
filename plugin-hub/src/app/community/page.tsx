'use client'

import { icons } from '../components/icons'
import Link from 'next/link'

export default function CommunityPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', paddingTop: '80px' }}>

            {/* Hero Section */}
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    marginBottom: '24px',
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Join the Community
                </h1>
                <p style={{ fontSize: '20px', color: 'hsl(var(--muted-foreground))', maxWidth: '600px', margin: '0 auto' }}>
                    Connect with other developers, share your plugins, and help shape the future of the MDM Plugin Hub.
                </p>
            </div>

            {/* Social Cards */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                {/* Discord */}
                <div style={cardStyle}>
                    <div style={{ ...iconContainerStyle, background: '#5865F2' }}>
                        <icons.discord style={{ width: '32px', height: '32px', color: '#fff' }} />
                    </div>
                    <h2 style={cardTitleStyle}>Discord Server</h2>
                    <p style={cardTextStyle}>Join our active chat server to discuss plugin development, get help, and hang out.</p>
                    <Link href="#" style={buttonStyle}>Join Discord</Link>
                </div>

                {/* GitHub */}
                <div style={cardStyle}>
                    <div style={{ ...iconContainerStyle, background: '#181717' }}>
                        <icons.github style={{ width: '32px', height: '32px', color: '#fff' }} />
                    </div>
                    <h2 style={cardTitleStyle}>GitHub Discussions</h2>
                    <p style={cardTextStyle}>Report bugs, request features, and contribute to the open-source codebase.</p>
                    <Link href="#" style={buttonStyle}>View on GitHub</Link>
                </div>

                {/* Twitter */}
                <div style={cardStyle}>
                    <div style={{ ...iconContainerStyle, background: '#1DA1F2' }}>
                        <icons.twitter style={{ width: '32px', height: '32px', color: '#fff' }} />
                    </div>
                    <h2 style={cardTitleStyle}>Twitter / X</h2>
                    <p style={cardTextStyle}>Follow us for the latest announcements, plugin spotlights, and tips.</p>
                    <Link href="#" style={buttonStyle}>Follow @MDMHub</Link>
                </div>
            </div>

            {/* Resources Section */}
            <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 24px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '40px', textAlign: 'center' }}>Developer Resources</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

                    <div style={resourceCardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <icons.book style={{ width: '24px', height: '24px', color: 'hsl(var(--primary))' }} />
                            <h3 style={{ fontSize: '24px', fontWeight: 600 }}>Documentation</h3>
                        </div>
                        <p style={cardTextStyle}>Complete guides on how to build, publish, and maintain your plugins.</p>
                        <Link href="#" style={{ ...buttonStyle, background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', marginTop: '20px' }}>Read Docs</Link>
                    </div>

                    <div style={resourceCardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <icons.newspaper style={{ width: '24px', height: '24px', color: 'hsl(var(--primary))' }} />
                            <h3 style={{ fontSize: '24px', fontWeight: 600 }}>Blog</h3>
                        </div>
                        <p style={cardTextStyle}>Deep dives, tutorials, and community showcases.</p>
                        <Link href="#" style={{ ...buttonStyle, background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', marginTop: '20px' }}>Read Blog</Link>
                    </div>

                </div>
            </div>

        </div>
    )
}

const cardStyle: React.CSSProperties = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'default'
}

const iconContainerStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px'
}

const cardTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'hsl(var(--foreground))'
}

const cardTextStyle: React.CSSProperties = {
    fontSize: '16px',
    color: 'hsl(var(--muted-foreground))',
    lineHeight: '1.6',
    flex: 1
}

const buttonStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '12px 24px',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    display: 'inline-block'
}

const resourceCardStyle: React.CSSProperties = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '16px',
    padding: '32px',
}
