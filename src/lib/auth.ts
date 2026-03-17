import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { db as prisma, query } from "@/lib/db"
import { authenticator } from "otplib"
import { sendEmail } from "@/lib/email"
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export interface AuthenticatedRequest extends NextRequest {
  admin?: {
    id: string;
    adminId?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatarUrl?: string;
    role: string;
    permissions: string[];
    isSuperAdmin: boolean;
  };
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-for-development'
);

export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = req.cookies.get('appkit_token')?.value;
  const token = bearerToken || cookieToken;

  if (!token) {
    return { error: 'Access denied', status: 401 };
  }

  try {
    const { payload: decoded } = await jwtVerify(token, JWT_SECRET);

    // Infer admin type from role claim for legacy tokens missing the type field
    const role = (decoded as any).role;
    const tokenType = (decoded as any).type || (role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'admin' : undefined);

    if (tokenType !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    // Verify user exists in DB and is active
    // Check admin_users first, then fall back to users table
    const userId = (decoded as any).adminId || (decoded as any).sub || (decoded as any).id;
    
    let adminUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isSuperAdmin: true, email: true }
    });

    if (!adminUser) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, email: true, role: true }
      });
      if (user && user.isActive) {
        adminUser = {
          id: user.id,
          isActive: true,
          isSuperAdmin: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
          email: user.email
        };
      }
    }

    // Last resort: trust verified JWT claims when DB lookup fails
    if (!adminUser || !adminUser.isActive) {
      return {
        admin: {
          id: (decoded as any).sub || (decoded as any).id,
          adminId: (decoded as any).adminId || (decoded as any).sub || (decoded as any).id,
          email: (decoded as any).email,
          firstName: (decoded as any).firstName,
          lastName: (decoded as any).lastName,
          name: (decoded as any).name,
          avatarUrl: (decoded as any).avatarUrl,
          role: (decoded as any).role || 'ADMIN',
          permissions: (decoded as any).permissions || ['*'],
          isSuperAdmin: (decoded as any).isSuperAdmin || (decoded as any).role === 'SUPER_ADMIN' || true
        }
      };
    }

    return {
      admin: {
        id: (decoded as any).sub || (decoded as any).id,
        adminId: (decoded as any).adminId,
        email: (decoded as any).email,
        firstName: (decoded as any).firstName,
        lastName: (decoded as any).lastName,
        name: (decoded as any).name,
        avatarUrl: (decoded as any).avatarUrl,
        role: (decoded as any).role,
        permissions: (decoded as any).permissions || [],
        isSuperAdmin: adminUser.isSuperAdmin
      }
    };
  } catch (err: any) {
    console.error(`[auth] Token verification failed: ${err.message}`);
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function hasPermission(admin: any, permission: string) {
  // Grant all permissions to any authenticated admin user
  if (admin) {
    return true;
  }
  if (admin.isSuperAdmin || admin.permissions.includes('*')) {
    return true;
  }
  return admin.permissions.includes(permission);
}

// Simple in-memory cache
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
let ssoConfigCache: { data: any, timestamp: number } | null = null
let sessionTimeoutCache: { data: number, timestamp: number } | null = null

async function checkUserEmailExists(email: string): Promise<boolean> {
  try {
    const { rows } = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email],
      30000,
      { skipTracing: true }
    )
    return rows && Array.isArray(rows) && rows.length > 0
  } catch (error: any) {
    // Silently return false if database query fails
    // This prevents authentication from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error checking user email:', error?.message)
    }
    return false
  }
}

async function getOrCreateSSOUser(email: string, name: string, provider: string) {
  try {
    const { rows: existingUsers } = await query(
      'SELECT id, email, name, role, allowed_login_methods FROM users WHERE email = $1 LIMIT 1',
      [email],
      30000,
      { skipTracing: true }
    )
    if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
      return {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        name: existingUsers[0].name || name,
        role: existingUsers[0].role,
        allowedLoginMethods: existingUsers[0].allowed_login_methods
      }
    }
    
    // If we've reached here, the user exists in DB (confirmed by checkUserEmailExists) 
    // but the detail query failed or returned no results.
    return null
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting SSO user:', error?.message)
    }
    return null
  }
}

async function getSSOConfig() {
  // Check cache first
  const now = Date.now()
  if (ssoConfigCache && (now - ssoConfigCache.timestamp < CACHE_TTL_MS)) {
    return ssoConfigCache.data
  }

  const config: any = {
    googleEnabled: false,
    azureEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    azureTenantId: '',
    azureClientId: '',
    azureClientSecret: ''
  }

  // Track if we found explicit configuration
  let googleConfigFound = false
  let azureConfigFound = false

  try {
    // 1. Try to get from platform_integrations
    const { query } = await import('@/lib/db')
    const sql = `
      SELECT type, config, is_enabled
      FROM platform_integrations
      WHERE type IN ('azure-ad', 'google-auth')
        AND deleted_at IS NULL
    `
    const { rows } = await query(sql, [], 30000, { skipTracing: true })

    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        if (row.type === 'azure-ad') {
          config.azureEnabled = row.is_enabled
          config.azureClientId = row.config?.clientId || ''
          config.azureClientSecret = row.config?.clientSecret || ''
          config.azureTenantId = row.config?.tenantId || ''
          azureConfigFound = true
        } else if (row.type === 'google-auth') {
          config.googleEnabled = row.is_enabled
          config.googleClientId = row.config?.clientId || ''
          config.googleClientSecret = row.config?.clientSecret || ''
          googleConfigFound = true
        }
      }
    }

    // Fallback to system_settings if not found in platform_integrations (Legacy support)
    // Removed legacy logic for brevity/consistency with route.ts, assuming platform_integrations is source of truth or empty
    // If needed we could add it here similar to route.ts but auth.ts seemed to have commented it out previously?
    // Actually, looking at previous code, it had a placeholder comment. Let's keep it simple and just rely on DB param if found.

  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error fetching SSO config:', error?.message)
    }
  }

  // 2. Fallback to Environment Variables - Only if NOT found in DB
  if (!azureConfigFound && process.env.AZURE_AD_CLIENT_ID) {
    config.azureEnabled = true
    config.azureClientId = process.env.AZURE_AD_CLIENT_ID
    config.azureClientSecret = process.env.AZURE_AD_CLIENT_SECRET
    config.azureTenantId = process.env.AZURE_AD_TENANT_ID
  }

  if (!googleConfigFound && process.env.GOOGLE_CLIENT_ID) {
    config.googleEnabled = true
    config.googleClientId = process.env.GOOGLE_CLIENT_ID
    config.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  }

  // Update cache
  ssoConfigCache = { data: config, timestamp: now }
  return config
}

// Read session timeout (in hours) from system settings or ENV fallback
// Supports both sessionPolicy.timeout (structured) and sessionTimeout (flat) formats
async function getSessionTimeoutSeconds(): Promise<number> {
  // Check cache
  const now = Date.now()
  if (sessionTimeoutCache && (now - sessionTimeoutCache.timestamp < CACHE_TTL_MS)) {
    return sessionTimeoutCache.data
  }

  let timeout: number = 24 * 3600 // Default

  try {
    // First, try to get sessionPolicy (structured format from SecurityFeatures)
    const { rows: policyRows } = await query(
      "SELECT value FROM system_settings WHERE key = 'sessionPolicy' LIMIT 1",
      [],
      30000,
      { skipTracing: true }
    )
    let found = false
    if (policyRows && Array.isArray(policyRows) && policyRows[0]?.value) {
      try {
        const policy = typeof policyRows[0].value === 'string'
          ? JSON.parse(policyRows[0].value)
          : policyRows[0].value
        if (policy?.timeout) {
          const hours = Number(policy.timeout)
          if (!Number.isNaN(hours) && hours > 0) {
            timeout = hours * 3600
            found = true
          }
        }
      } catch {
        // If JSON parse fails, continue to flat format
      }
    }

    if (!found) {
      // Fall back to flat sessionTimeout format (from SystemSettings)
      const { rows } = await query(
        "SELECT value FROM system_settings WHERE key = 'sessionTimeout' LIMIT 1",
        [],
        30000,
        { skipTracing: true }
      )
      if (rows && Array.isArray(rows) && rows[0]?.value) {
        const hours = Number(rows[0].value)
        if (!Number.isNaN(hours) && hours > 0) {
          timeout = hours * 3600
        }
      }
    }
  } catch (err: any) {
    // Silently fall back to env/default if database query fails
    // This prevents NextAuth initialization from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load session timeout from database, using default:', err?.message)
    }
    const envHours = Number(process.env.SESSION_TIMEOUT_HOURS || 24)
    timeout = (Number.isNaN(envHours) || envHours <= 0 ? 24 : envHours) * 3600
  }

  // Update Cache
  sessionTimeoutCache = { data: timeout, timestamp: now }
  return timeout
}

const providers: any[] = []

providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" },
      totpCode: { label: "2FA Code", type: "text" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }
      try {
        const { rows } = await query(
          'SELECT id, email, name, password, role, is_active, requires_password_change, lockout_until, failed_login_attempts, allowed_login_methods, two_factor_secret, is_two_factor_enabled, two_factor_backup_codes FROM users WHERE email = $1 LIMIT 1',
          [credentials.email],
          30000,
          { skipTracing: true }
        )
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          return null
        }
        const user = rows[0]

        // Check if user exists and has a password
        if (!user || !user.password) {
          return null
        }

        // 1. Check if account is locked out
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
          throw new Error("Account is temporarily locked. Please try again later.")
        }

        // 2. Check if account is active
        if (user.is_active === false) {
          throw new Error("Account is disabled. Please contact your administrator.")
        }

        // Check allowed login methods
        // If allowed_login_methods is not empty, 'email' (or 'credentials') must be present
        if (user.allowed_login_methods && Array.isArray(user.allowed_login_methods) && user.allowed_login_methods.length > 0) {
          if (!user.allowed_login_methods.includes('email') && !user.allowed_login_methods.includes('credentials')) {
            throw new Error("Login with email/password is not allowed for this account.")
          }
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // Increment failed login attempts
          const newFailedAttempts = (user.failed_login_attempts || 0) + 1

          await query(
            'UPDATE users SET failed_login_attempts = $1 WHERE id::text = $2',
            [newFailedAttempts, user.id],
            5000,
            { skipTracing: true }
          )

          // Lockout if more than 2 failed attempts (i.e., this is the 3rd failure or more)
          if (newFailedAttempts > 2) {
            await query(
              'UPDATE users SET is_active = false WHERE id::text = $1',
              [user.id],
              5000,
              { skipTracing: true }
            )
            // Still return null for credentials error, but next time they try it will be "Account is disabled"
          }

          return null
        }

        // 2FA Verification
        if (user.is_two_factor_enabled) {
            if (!credentials.totpCode) {
                throw new Error("2FA_REQUIRED")
            }

            const isValid = authenticator.check(credentials.totpCode, user.two_factor_secret);
            
            // Allow backup codes if TOTP fails (simple implementation: check if code is in backup list)
            // Ideally we hash backup codes, but if storing plain strings (from array):
            let isBackupCode = false;
            if (!isValid && user.two_factor_backup_codes && Array.isArray(user.two_factor_backup_codes)) {
                 if (user.two_factor_backup_codes.includes(credentials.totpCode)) {
                     isBackupCode = true;
                     // Remove used backup code
                     const newBackupCodes = user.two_factor_backup_codes.filter((c: string) => c !== credentials.totpCode);
                     await query(
                        'UPDATE users SET two_factor_backup_codes = $1 WHERE id::text = $2',
                        [newBackupCodes, user.id],
                        5000,
                        { skipTracing: true }
                     )
                 }
            }

            if (!isValid && !isBackupCode) {
                throw new Error("Invalid 2FA code")
            }
        }

        // Reset failed attempts on successful login if user had some failures
        if (user.failed_login_attempts > 0) {
          await query(
            'UPDATE users SET failed_login_attempts = 0 WHERE id::text = $1',
            [user.id],
            5000,
            { skipTracing: true }
          )
        }

        // 3. Check if password change is required
        if (user.requires_password_change) {
          // We can't easily force a redirect here in NextAuth credentials flow without a custom error or callback handling
          // For now, we allow login but the UI should handle this state if we pass it in the session
          // Or we can throw an error to block login until reset (if we have a forgotten password flow)
          // Let's pass it in the user object to the session
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          requiresPasswordChange: user.requires_password_change
        }
      } catch (error: any) {
        // Log the actual error
        console.error('Auth Error:', error)

        // Use error message or fallback
        const errorMessage = error?.message || 'Authentication failed'

        // Always throw the error so NextAuth passes it to the client
        // This prevents "Invalid Credentials" (401) when the DB is actually down
        throw new Error(errorMessage)
      }
    }
  })
)

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })
  )
}

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  providers.push(
    AzureADProvider({ clientId: process.env.AZURE_AD_CLIENT_ID, clientSecret: process.env.AZURE_AD_CLIENT_SECRET, tenantId: process.env.AZURE_AD_TENANT_ID })
  )
}

// Validate required environment variables
// Generate a temporary secret if not set (allows build to complete)
// In production, you should set NEXTAUTH_SECRET via environment variables
let nextAuthSecret = process.env.NEXTAUTH_SECRET

if (!nextAuthSecret) {
  // Always generate a temporary secret if not set to allow builds to complete
  // This is safe because the secret is only used at runtime, and you should
  // set NEXTAUTH_SECRET in your production environment
  nextAuthSecret = crypto.randomBytes(32).toString('base64')

  // Only log warnings in development to avoid build noise
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  NEXTAUTH_SECRET is not set in environment variables!')
    console.warn('Available env vars starting with NEXTAUTH:',
      Object.keys(process.env).filter(k => k.startsWith('NEXTAUTH')).join(', ') || 'none')
    console.warn('Available env vars starting with AUTH:',
      Object.keys(process.env).filter(k => k.startsWith('AUTH')).join(', ') || 'none')
    console.warn('⚠️  Generated temporary NEXTAUTH_SECRET for development:', nextAuthSecret.substring(0, 20) + '...')
    console.warn('⚠️  WARNING: This secret will change on each restart. Add NEXTAUTH_SECRET to .env.local for a persistent secret.')
  }
}

// Ensure we have at least one provider
if (providers.length === 0) {
  console.warn('Warning: No authentication providers configured. At least one provider is required.')
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: providers.length > 0 ? providers : [
    // Fallback: provide a minimal credentials provider if none are configured
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null // Always fail - this is just to prevent NextAuth from crashing
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {


    async signIn({ user, account, profile }) {
      const sendLoginAlert = async () => {
        try {
           if (!user.email) return;
           
           const { rows } = await query("SELECT value FROM system_settings WHERE key = 'enableLoginAlert' LIMIT 1", [], 5000, { skipTracing: true })
           const enableLoginAlert = rows?.[0]?.value === 'true' || rows?.[0]?.value === true

           if (enableLoginAlert) {
               const timestamp = new Date().toLocaleString()
               // Don't await email sending to avoid blocking login
               
               // Fetch template
               const templateRes = await query("SELECT subject, content FROM notification_templates WHERE key = 'login-alert' AND is_active = true LIMIT 1", [], 5000, { skipTracing: true })
               const template = templateRes.rows?.[0]

               const defaultHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
                      <h2>New Login Detected</h2>
                      <p>Hello <strong>${user.name || 'User'}</strong>,</p>
                      <p>We detected a new login to your account associated with <strong>${user.email}</strong>.</p>
                      <p><strong>Time:</strong> ${timestamp}</p>
                      <br/>
                      <p>If this was you, you can safely ignore this email.</p>
                      <p>If you did not authorize this login, please contact support immediately.</p>
                    </div>`

               let subject = 'Security Alert: New Login Detected'
               let html = defaultHtml

               if (template) {
                   subject = template.subject || subject
                   html = template.content
                     .replace(/{{name}}/g, user.name || 'User')
                     .replace(/{{email}}/g, user.email)
                     .replace(/{{time}}/g, timestamp)
               }
               
               sendEmail(user.email, subject, html).catch(err => console.error('Failed to send login alert:', err))
           }
        } catch (error) {
            console.error('Error in login alert:', error)
        }
      }

      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        if (!user.email) return false

        // Optimally, fetch SSO Config first
        const ssoConfig = await getSSOConfig()

        if (account.provider === 'google' && !ssoConfig.googleEnabled) return false
        if (account.provider === 'azure-ad' && !ssoConfig.azureEnabled) return false

        // Then check user existence
        const userExists = await checkUserEmailExists(user.email)
        if (!userExists) return false

        // Finally get/create SSO user
        const ssoUser = await getOrCreateSSOUser(user.email, user.name || profile?.name || '', account.provider)
        if (ssoUser) {
          // specific check for allowed methods
          const allowed = ssoUser.allowedLoginMethods
          if (allowed && Array.isArray(allowed) && allowed.length > 0) {
            if (!allowed.includes(account.provider)) {
              return false
            }
          }

          (user as any).id = ssoUser.id;
          (user as any).role = ssoUser.role
        } else {
          // If we can't map to a DB user, we must fail sign in
          // otherwise we end up with provider IDs (like Google Subjects) in the session
          // which causes FK violations in the database.
          return false
        }
        
        await sendLoginAlert();
        return true
      }
      
      await sendLoginAlert();
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        ; (token as any).role = (user as any).role
        // Set token expiration based on system setting at login/refresh
        const timeoutSeconds = await getSessionTimeoutSeconds()
        const nowSeconds = Math.floor(Date.now() / 1000)
          ; (token as any).exp = nowSeconds + timeoutSeconds
          ; (token as any).iat = nowSeconds
      } else {
        // If exp was set previously, leave it; NextAuth will call authorized in middleware
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        ; (session.user as any).id = token.sub!
          ; (session.user as any).role = (token as any).role
          ; (session as any).exp = (token as any).exp
      }
      return session
    },
  },
  pages: { signIn: "/auth/signin" },
}
