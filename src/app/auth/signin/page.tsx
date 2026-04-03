'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Layers, Smartphone, ArrowLeft } from 'lucide-react'
import { loadBrandingConfig } from '@/lib/branding'
import { useSystemSettingsSafe } from '@/contexts/system-settings-context'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [ssoProviders, setSsoProviders] = useState({ google: false, azure: false })
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [loginBgStyle, setLoginBgStyle] = useState<React.CSSProperties>({})
  const [loginBgVideo, setLoginBgVideo] = useState<string | undefined>(undefined)
  const { settings } = useSystemSettingsSafe()
  const [appName, setAppName] = useState(settings?.siteName || 'Unified Data Platform')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const router = useRouter()

  // Update appName when settings load
  useEffect(() => {
    if (settings?.siteName) {
      setAppName(settings.siteName)
    }
  }, [settings])

  // Load branding config for login background
  useEffect(() => {
    loadBrandingConfig().then((branding) => {
      // Load app name and logo
      if (branding?.applicationName) {
        setAppName(branding.applicationName)
      }
      if (branding?.applicationLogo) {
        setLogoUrl(branding.applicationLogo)
      }

      // Fetch security settings for other UI needs if any
      fetch('/api/settings')
        .then(res => {
          if (!res.ok) return null // Silently fail for branding UI if not available
          return res.json()
        })
        .then(settings => {
          // Setting parsing is handled by SecurityProvider globally, 
          // but we can still use settings here if needed for specific login UI
        })
        .catch(console.error)

      if (branding?.loginBackground) {
        const bg = branding.loginBackground
        let style: React.CSSProperties = {}
        let videoUrl: string | undefined

        if (bg.type === 'color' && bg.color) {
          style.backgroundColor = bg.color
        } else if (bg.type === 'gradient' && bg.gradient) {
          style.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
        } else if (bg.type === 'image' && bg.image) {
          style.backgroundImage = `url(${bg.image})`
          style.backgroundSize = 'cover'
          style.backgroundPosition = 'center'
        } else if (bg.type === 'video' && bg.video) {
          videoUrl = bg.video
        }

        setLoginBgStyle(style)
        setLoginBgVideo(videoUrl)
      } else {
        // Default light grey background
        setLoginBgStyle({
          background: 'linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%)',
          backgroundColor: '#f3f4f6'
        })
      }
    })
  }, [])

  useEffect(() => {
    // Fetch enabled SSO providers
    fetch('/api/auth/sso-providers')
      .then(res => res.json())
      .then(data => setSsoProviders(data))
      .catch(err => console.error('Error fetching SSO providers:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Sign in with NextAuth.js
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

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
        // Platform login - redirect to overview page
        router.push('/')
      }
    } catch (error) {
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
             router.push('/')
        }
      } catch (error) {
          setError('An error occurred. Please try again.')
      } finally {
          setIsLoading(false)
      }
  }

  const handleGoogleSignIn = async () => {
    try {
      // Platform login - redirect to overview page
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      setError('An error occurred with Google sign-in.')
    }
  }

  const handleAzureSignIn = async () => {
    try {
      // Platform login - redirect to overview page
      await signIn('azure-ad', { callbackUrl: '/' })
    } catch (error) {
      setError('An error occurred with Azure sign-in.')
    }
  }

  const hasAnySSO = ssoProviders.google || ssoProviders.azure
  const hasCustomBg = Object.keys(loginBgStyle).length > 0 && !loginBgStyle.background?.toString().includes('radial-gradient')

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden text-foreground md:h-screen md:flex-row" style={loginBgStyle}>

      {/* Helper for video background */}
      {loginBgVideo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            src={loginBgVideo}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: 'brightness(0.6)' }}
          />
        </div>
      )}

      {/* Left Column - App Name & Description */}
      <div className="relative z-10 flex flex-col justify-start px-6 pb-6 pt-12 md:flex-1 md:justify-center md:p-12 lg:p-20">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          <div className="mb-2 flex items-center space-x-4">
            <div className="rounded-2xl border border-border bg-card/60 p-3 shadow-sm backdrop-blur-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain md:h-10 md:w-10" />
              ) : (
                <Layers className="h-10 w-10 text-primary fill-primary/10" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 drop-shadow-sm md:text-5xl lg:text-6xl">
              {appName}
            </h1>
          </div>
          <p className="ml-1 max-w-lg text-base font-light leading-relaxed text-gray-600 md:text-2xl">
            Experience the future of data management. Secure, scalable, and simple.
          </p>
        </div>
      </div>

      {/* Right Column - Login Panel (40% width on Desktop) */}
      <div className="relative z-10 mt-auto flex h-auto w-full min-w-[320px] flex-col justify-end px-0 pt-2 md:h-full md:w-[40%] md:p-6 md:justify-center">
        <Card
          className="relative flex min-h-[68vh] w-full flex-col justify-center rounded-t-[32px] border-x-0 border-b-0 border-t border-gray-200 shadow-[0_-24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl md:h-full md:min-h-0 md:rounded-2xl md:border md:shadow-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            color: '#1f2937',
            borderColor: 'rgba(229, 231, 235, 0.5)',
          }}
        >
          <CardHeader className="flex flex-col items-center space-y-1 px-6 pb-2 pt-8 md:px-6 md:pt-6">
            <CardTitle className="text-3xl font-bold tracking-tight text-center">
              Sign in
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground/90 text-lg">
              {appName === 'Unified Data Platform' ? 'Access your account' : `Welcome to ${appName}`}
            </CardDescription>
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
                                // Only allow numbers and max 6 chars
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

                    <Button type="submit" className="w-full" disabled={isLoading}>
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
                <Label htmlFor="email" className="font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-card/50 border-border/30 focus:bg-card/90 transition-all hover:bg-card/70"
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-card/50 border-border/30 focus:bg-card/90 transition-all hover:bg-card/70"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
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

            {hasAnySSO && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground backdrop-blur-sm rounded-full">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {ssoProviders.google && (
                    <Button
                      variant="outline"
                      className="w-full bg-card/50 hover:bg-card/80 border-border/40"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  )}

                  {ssoProviders.azure && (
                    <Button
                      variant="outline"
                      className="w-full bg-card/50 hover:bg-card/80 border-border/40"
                      onClick={handleAzureSignIn}
                      disabled={isLoading}
                    >
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
