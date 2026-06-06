import type { LoginPageConfig as BaseLoginPageConfig } from '@/lib/space-studio-manager'

type LoginPageGradient = NonNullable<BaseLoginPageConfig['gradient']>

type LoginPageCardStyle = {
  backgroundColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  shadow: boolean
}

export type PartialLoginPageConfig = Partial<Omit<LoginPageConfig, 'gradient' | 'cardStyle'>> & {
  gradient?: Partial<LoginPageGradient>
  cardStyle?: Partial<LoginPageCardStyle>
}

export interface LoginPageConfig extends Omit<BaseLoginPageConfig, 'gradient' | 'cardStyle'> {
  gradient: LoginPageGradient
  cardStyle: LoginPageCardStyle
  helpText?: string
  heroTitle?: string
  heroDescription?: string
  signInButtonLabel?: string
}

export const DEFAULT_LOGIN_PAGE_CONFIG: LoginPageConfig = {
  backgroundType: 'gradient',
  backgroundColor: '#f8fafc',
  backgroundImage: '',
  gradient: {
    from: '#eff6ff',
    to: '#dbeafe',
    angle: 135,
  },
  leftPanelWidth: '60%',
  rightPanelWidth: '40%',
  title: 'Welcome back',
  description: 'Sign in to access this workspace.',
  heroTitle: 'Your space, ready when you are',
  heroDescription: 'Secure access for your team, data, and workflows in one place.',
  signInButtonLabel: 'Sign in',
  helpText: '',
  showLogo: true,
  logoUrl: '',
  cardStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    textColor: '#111827',
    borderColor: 'rgba(226, 232, 240, 0.9)',
    borderRadius: 24,
    shadow: true,
  },
}

export function normalizeLoginPageConfig(config?: PartialLoginPageConfig | null): LoginPageConfig {
  return {
    ...DEFAULT_LOGIN_PAGE_CONFIG,
    ...(config || {}),
    gradient: {
      ...DEFAULT_LOGIN_PAGE_CONFIG.gradient,
      ...(config?.gradient || {}),
    },
    cardStyle: {
      ...DEFAULT_LOGIN_PAGE_CONFIG.cardStyle,
      ...(config?.cardStyle || {}),
    },
  }
}
