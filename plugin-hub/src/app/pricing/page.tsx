import { icons } from '../components/icons'

export default function PricingPage() {
    const plans = [
        {
            name: 'Community',
            price: '$0',
            description: 'For individuals and open-source projects',
            features: ['Unlimited Public Plugins', 'Community Support', 'Basic Analytics', '1 Team Member']
        },
        {
            name: 'Pro',
            price: '$29',
            period: '/mo',
            description: 'For growing teams and businesses',
            features: ['Private Plugins', 'Priority Support', 'Advanced Analytics', '5 Team Members', 'Custom Domains'],
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large organizations with specific needs',
            features: ['Unlimited Private Plugins', 'Dedicated Support', 'SSO & Audit Logs', 'Unlimited Team Members', 'SLA Guarantees']
        }
    ]

    return (
        <div style={{ padding: '80px 24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '16px' }}>
                    Simple, Transparent Pricing
                </h1>
                <p style={{ fontSize: '18px', color: 'hsl(var(--muted-foreground))', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that's right for you. Change or cancel anytime.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                {plans.map((plan, i) => (
                    <div key={i} style={{
                        background: 'hsl(var(--card))',
                        border: plan.popular ? '2px solid hsl(var(--foreground))' : '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-lg)',
                        padding: '32px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {plan.popular && (
                            <span style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'hsl(var(--foreground))',
                                color: 'hsl(var(--background))',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                Most Popular
                            </span>
                        )}
                        <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                            {plan.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', marginBottom: '24px' }}>
                            {plan.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                            <span style={{ fontSize: '48px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{plan.price}</span>
                            {plan.period && <span style={{ fontSize: '16px', color: 'hsl(var(--muted-foreground))' }}>{plan.period}</span>}
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                            {plan.features.map((feature, j) => (
                                <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'hsl(var(--foreground))', fontSize: '14px' }}>
                                    <icons.check style={{ width: '16px', height: '16px', color: 'hsl(var(--primary))' }} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button style={{
                            width: '100%',
                            padding: '12px',
                            background: plan.popular ? 'var(--primary-gradient)' : 'hsl(var(--muted))',
                            color: plan.popular ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                        }}>
                            {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
