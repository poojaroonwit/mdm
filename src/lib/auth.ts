import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import AzureADProvider from "next-auth/providers/azure-ad"
import bcrypt from "bcryptjs"
import { db as prisma, query } from "@/lib/db"
import { authenticator } from "otplib"
import { sendEmail } from "@/lib/email"
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isDomainAllowed, mapOAuthProfile, getOrCreateIdentityUser } from "@/lib/identity-utils"

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
    const userId = (decoded as any).adminId || (decoded as any).sub || (decoded as any).id;
    
    const adminUser = await (prisma as any).adminUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isSuperAdmin: true, email: true }
    });

    if (!adminUser || !adminUser.isActive) {
      return { error: 'Invalid or deactivated account', status: 401 };
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
  if (!admin) return false;
  if (admin.isSuperAdmin || admin.permissions.includes('*')) return true;
  return admin.permissions.includes(permission);
}

// Simple in-memory cache
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
let ssoProvidersCache: { data: any[], timestamp: number } | null = null
let sessionTimeoutCache: { data: number, timestamp: number } | null = null

async function getEnabledSSOProviders() {
  const now = Date.now()
  if (ssoProvidersCache && (now - ssoProvidersCache.timestamp < CACHE_TTL_MS)) {
    return ssoProvidersCache.data
  }

  try {
    const providers = await (prisma as any).oAuthProvider.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' }
    })
    ssoProvidersCache = { data: providers, timestamp: now }
    return providers
  } catch (error) {
    console.error('Error fetching SSO providers:', error)
    return []
  }
}

async function getSessionTimeoutSeconds(): Promise<number> {
  const now = Date.now()
  if (sessionTimeoutCache && (now - sessionTimeoutCache.timestamp < CACHE_TTL_MS)) {
    return sessionTimeoutCache.data
  }

  let timeout: number = 24 * 3600 // Default
  try {
    const setting = await (prisma as any).systemSetting.findUnique({ where: { key: 'sessionPolicy' } })
    if (setting?.value) {
      const policy = JSON.parse(setting.value)
      if (policy?.timeout) {
        timeout = Number(policy.timeout) * 3600
      }
    }
  } catch (err) {
    console.warn('Could not load session timeout from database, using fallback')
  }

  sessionTimeoutCache = { data: timeout, timestamp: now }
  return timeout
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await (prisma as any).user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password || !user.isActive) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        if (user.isTwoFactorEnabled) {
          if (!credentials.totpCode) throw new Error("2FA_REQUIRED")
          const isValid = authenticator.check(credentials.totpCode, user.twoFactorSecret!)
          if (!isValid) throw new Error("Invalid 2FA code")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }),
    // Google, GitHub, AzureAD providers will be added dynamically in callbacks or initialized if env set
    // For NextAuth to register them, we should at least check for them here
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })] : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      if (account?.provider !== 'credentials') {
        const providers = await getEnabledSSOProviders()
        const providerConfig = providers.find((p: any) => p.providerName === account?.provider)
        
        if (!providerConfig) return false
        if (!(isDomainAllowed as any)(user.email, providerConfig.allowedDomains)) return false

        const identityUser = await getOrCreateIdentityUser(user.email, user.name || '', account?.provider!)
        if (!identityUser) return false

        // Enrich user object for JWT callback
        (user as any).id = identityUser.id;
        (user as any).role = identityUser.role;
        (user as any).permissions = identityUser.permissions;
        (user as any).avatarUrl = identityUser.avatarUrl;
        (user as any).isSuperAdmin = identityUser.isSuperAdmin;
      }

      return true
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.permissions = (user as any).permissions || []
        token.avatarUrl = (user as any).avatarUrl
        token.isSuperAdmin = (user as any).isSuperAdmin
        
        const timeoutSeconds = await getSessionTimeoutSeconds()
        token.exp = Math.floor(Date.now() / 1000) + timeoutSeconds
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).isSuperAdmin = token.isSuperAdmin;
        (session as any).exp = token.exp;
      }
      return session
    },
  },
  pages: { signIn: "/auth/signin" },
}
