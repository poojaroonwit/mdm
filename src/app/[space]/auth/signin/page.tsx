'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Layers, Smartphone, ArrowLeft } from 'lucide-react'
import { loadBrandingConfig } from '@/lib/branding'

export default function SpaceSignInPage() {
  const params = useParams() as { space: string }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null)
  const [ssoProviders, setSsoProviders] = useState({ google: false, azure: false })
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [loginPageConfig, setLoginPageConfig] = useState<any>(null)
  const [branding, setBranding] = useState<any>(null)

  const readJsonIfAvailable = async (response: Response) => {
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('application/json')) {
      return null
    }

    try {
      return await response.json()
    } catch {
      return null
    }
  }

  useEffect(() => {
    loadBrandingConfig().then(setBranding)
  }, [])

  useEffect(() => {
    const loadSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${params.space}`)
        const json = (await readJsonIfAvailable(res)) || {}
        const space = json.space || null
        let features = space?.features || null
        if (typeof features === 'string') {
          try { features = JSON.parse(features) } catch { features = null }
        }
        setLoginImageUrl(features?.login_image_url || null)
      } catch {
        setLoginImageUrl(null)
      }
    }
    loadSpace()

    // Fetch enabled SSO providers
    fetch('/api/auth/sso-providers')
      .then(readJsonIfAvailable)
      .then(data => {
        if (!data) return
        setSsoProviders({
          google: !!data.google,
          azure: !!data.azure,
        })
      })
      .catch(err => console.error('Error fetching SSO providers:', err))

    // Fetch login page config
    fetch(`/api/spaces/${params.space}/login-config`)
      .then(readJsonIfAvailable)
      .then(data => setLoginPageConfig(data?.loginPageConfig || null))
      .catch(err => console.error('Error fetching login config:', err))
  }, [params.space])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please try again.')
        } else if (result.error === '2FA_REQUIRED') {
            setShowTwoFactorInput(true)
            setError('')
        } else {
          setError(result.error)
        }
      } else {
        // Get the default page for this space from layout config
        try {
          const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
          if (spaceRes.ok) {
            const data = await spaceRes.json()
            const defaultPath = data.path || '/dashboard'
            window.location.assign(`/${params.space}${defaultPath}`)
          } else {
            window.location.assign(`/${params.space}/dashboard`)
          }
        } catch {
          window.location.assign(`/${params.space}/dashboard`)
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!totpCode || totpCode.length !== 6) {
          setError('Please enter a valid 6-digit code')
          return
      }

      setIsLoading(true)
      setError('')

      try {
        const result = await signIn('credentials', {
            email,
            password,
            totpCode,
            redirect: false
        })

        if (result?.error) {
            setError(result.error)
        } else {
            // Get the default page for this space from layout config
            try {
              const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
              if (spaceRes.ok) {
                const data = await spaceRes.json()
                const defaultPath = data.path || '/dashboard'
                window.location.assign(`/${params.space}${defaultPath}`)
              } else {
                window.location.assign(`/${params.space}/dashboard`)
              }
            } catch {
              window.location.assign(`/${params.space}/dashboard`)
            }
        }
      } catch (error) {
          setError('An error occurred. Please try again.')
      } finally {
          setIsLoading(false)
      }
  }

  // Get styling from config or use defaults
  const config = loginPageConfig || {}
  const bgType = config.backgroundType
  const bgImage = config.backgroundImage || loginImageUrl
  const title = config.title || 'Sign in'
  const description = config.description || 'Access this workspace'

  // Build background style
  const getBackgroundStyle = () => {
    if (bgType === 'image' && bgImage) {
      return { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    } else if (bgType === 'color' && config.backgroundColor) {
      return { backgroundColor: config.backgroundColor }
    } else if (bgType === 'gradient' && config.gradient) {
      const { angle, from, to } = config.gradient
      return { background: `linear-gradient(${angle}deg, ${from}, ${to})` }
    }

    // Default light grey background
    return {
      background: 'linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%)',
      backgroundColor: '#f3f4f6'
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden md:h-screen md:flex-row" style={getBackgroundStyle()}>
      {/* Animated background blobs for default style - Removed to match clean white/pink/blue design */}
      {/* {!bgType && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        </div>
      )} */}

      {/* Left Column - App Name & Description */}
      <div className="relative z-10 flex flex-col justify-start px-6 pb-6 pt-12 md:flex-1 md:justify-center md:p-12 lg:p-20">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          <div className="mb-2 flex items-center space-x-4">
            <div className="rounded-2xl border border-gray-200 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
              {branding?.applicationLogo ? (
                <img src={branding.applicationLogo} alt="Logo" className="h-10 w-10 object-contain" />
              ) : (
                <Layers className="h-10 w-10 text-primary fill-primary/10" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 drop-shadow-sm md:text-5xl lg:text-6xl">
              {branding?.applicationName || 'Unified Data Platform'}
            </h1>
          </div>
          <p className="ml-1 max-w-lg text-base font-light leading-relaxed text-gray-600 md:text-2xl">
            {branding?.applicationDescription || 'Experience the future of data management. Secure, scalable, and simple.'}
          </p>
        </div>
      </div>

      {/* Right Column - Login Panel (40% width on Desktop) */}
      <div className="relative z-10 mt-auto flex h-auto w-full min-w-[320px] flex-col justify-end px-0 pt-2 md:h-full md:w-[40%] md:p-6 md:justify-center">
        <Card
          className="relative flex min-h-[68vh] w-full flex-col justify-center rounded-t-[32px] border-x-0 border-b-0 border-t border-gray-200 shadow-[0_-24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl md:h-full md:min-h-0 md:rounded-2xl md:border md:shadow-2xl"
          style={{
            backgroundColor: config.cardStyle?.backgroundColor || 'rgba(255, 255, 255, 0.8)',
            color: config.cardStyle?.textColor || '#1f2937',
            borderColor: config.cardStyle?.borderColor || 'rgba(229, 231, 235, 0.5)',
            boxShadow: config.cardStyle?.shadow !== false ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
          }}
        >
          <CardHeader className="flex flex-col items-center space-y-1 px-6 pb-2 pt-8 text-center md:pt-6">
            <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-muted-foreground/80 text-lg">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:px-12 md:pb-6">
            {showTwoFactorInput ? (
                <form onSubmit={handle2FASubmit} className="space-y-4">
                     <div className="flex flex-col items-center space-y-2 mb-4">
                         <div className="p-3 bg-primary/10 rounded-full">
                             <Smartphone className="h-8 w-8 text-primary" />
                         </div>
                         <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
                         <p className="text-sm text-muted-foreground text-center">
                             Please enter the 6-digit code from your authenticator app
                         </p>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="totpCode">Authentication Code</Label>
                        <Input
                            id="totpCode"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000 000"
                            value={totpCode}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                                setTotpCode(val)
                            }}
                            className="text-center text-lg tracking-widest"
                            autoFocus
                        />
                     </div>

                    {error && (
                        <Alert variant="destructive" className="border-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </Button>

                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => {
                            setShowTwoFactorInput(false)
                            setTotpCode('')
                            setError('')
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/50 border-white/30 focus:bg-white/80 transition-all hover:bg-white/60"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/50 border-white/30 focus:bg-white/80 transition-all hover:bg-white/60"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (<EyeOff className="h-4 w-4 text-muted-foreground" />) : (<Eye className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-500 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            )}

            {(ssoProviders.google || ssoProviders.azure) && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><Separator className="w-full bg-border/50" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground backdrop-blur-sm rounded-full">Or continue with</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  {ssoProviders.google && (
                    <Button variant="outline" className="w-full bg-white/50 hover:bg-white/80 border-white/40" onClick={async () => {
                      try {
                        const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
                        const defaultPath = spaceRes.ok ? (await spaceRes.json()).path : '/dashboard'
                        await signIn('google', { callbackUrl: `/${params.space}${defaultPath}` })
                      } catch {
                        await signIn('google', { callbackUrl: `/${params.space}/dashboard` })
                      }
                    }} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </Button>
                  )}
                  {ssoProviders.azure && (
                    <Button variant="outline" className="w-full bg-white/50 hover:bg-white/80 border-white/40" onClick={async () => {
                      try {
                        const spaceRes = await fetch(`/api/spaces/${params.space}/default-page`)
                        const defaultPath = spaceRes.ok ? (await spaceRes.json()).path : '/dashboard'
                        await signIn('azure-ad', { callbackUrl: `/${params.space}${defaultPath}` })
                      } catch {
                        await signIn('azure-ad', { callbackUrl: `/${params.space}/dashboard` })
                      }
                    }} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                      </svg>
                      Microsoft Azure
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
