import { icons } from '../components/icons'

export default function FeaturesPage() {
    const features = [
        {
            icon: 'activity',
            title: 'Real-time Analytics',
            description: 'Monitor your data pipelines and plugin performance in real-time with our advanced observability dashboard.',
            details: ['Live metrics streaming', 'Customizable dashboards', 'Alerting & Notifications']
        },
        {
            icon: 'shield',
            title: 'Security First',
            description: 'Built with enterprise-grade security standards. Every plugin is scanned and verified before publishing.',
            details: ['SOC2 Compliant', 'Automated Vulnerability Scanning', 'Role-Based Access Control']
        },
        {
            icon: 'globe',
            title: 'Global Distribution',
            description: 'Deploy plugins to edge locations worldwide for low-latency access and improved user experience.',
            details: ['Multi-region support', 'Edge computing compatible', 'Automatic CDN integration']
        },
        {
            icon: 'code',
            title: 'Developer Friendly',
            description: 'Comprehensive SDKs and APIs make it easy to build, test, and deploy custom plugins.',
            details: ['TypeScript & Go SDKs', 'CLI Tools', 'Extensive Documentation']
        }
    ]

    return (
        <div style={{ padding: '80px 24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '16px' }}>
                    Platform Features
                </h1>
                <p style={{ fontSize: '18px', color: 'hsl(var(--muted-foreground))', maxWidth: '700px', margin: '0 auto' }}>
                    Everything you need to extend, manage, and scale your data platform.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '64px' }}>
                {features.map((feature, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '64px',
                        flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'var(--primary-gradient)',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--primary-foreground))',
                                marginBottom: '24px'
                            }}>
                                {(() => {
                                    const Icon = icons[feature.icon as keyof typeof icons]
                                    return <Icon style={{ width: '32px', height: '32px' }} />
                                })()}
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '16px' }}>
                                {feature.title}
                            </h2>
                            <p style={{ fontSize: '18px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', marginBottom: '24px' }}>
                                {feature.description}
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {feature.details.map((detail, j) => (
                                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '16px', color: 'hsl(var(--foreground))' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }} />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{
                            flex: 1,
                            height: '400px',
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'hsl(var(--muted))'
                        }}>
                            {/* Placeholder for feature visualization */}
                            <div style={{ textAlign: 'center' }}>
                                {(() => {
                                    const Icon = icons[feature.icon as keyof typeof icons]
                                    return <Icon style={{ width: '64px', height: '64px', opacity: 0.2 }} />
                                })()}
                                <p style={{ marginTop: '16px', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Feature Visualization</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
