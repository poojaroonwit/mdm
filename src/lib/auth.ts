import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db as prisma } from "@/lib/db"
import { authenticator } from "otplib"
import { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import {
  resolveAzureGroupIds,
  resolveMappedRoleFromGroups,
  getOrCreateIdentityUser,
  isDomainAllowed,
  isLoginMethodAllowed,
  mapOAuthProfile,
} from "@/lib/identity-utils"
import { createNextAuthSSOProviders, getResolvedSSOProvider } from "@/lib/sso"
import { getAuthSecret } from "@/lib/auth-secret"

export interface AuthenticatedRequest extends NextRequest {
  admin?: {
    id: string
    adminId?: string
    email: string
    firstName?: string
    lastName?: string
    name?: string
    avatarUrl?: string
    role: string
    permissions: string[]
    isSuperAdmin: boolean
  }
}

const JWT_SECRET = new TextEncoder().encode(
  getAuthSecret()
)

const CACHE_TTL_MS = 10 * 60 * 1000
let sessionTimeoutCache: { data: number; timestamp: number } | null = null
const nextAuthUrl = process.env.NEXTAUTH_URL?.trim()
const isSecureAuthUrl = nextAuthUrl?.startsWith("https://") ?? false

import { getToken } from "next-auth/jwt"

export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
  const cookieToken = req.cookies.get("appkit_token")?.value
  let token = bearerToken || cookieToken

  // Fallback to NextAuth token if appkit_token is missing
  if (!token) {
    const nextAuthToken = await getToken({ 
      req, 
      secret: getAuthSecret(),
    })
    
    if (nextAuthToken) {
      console.log(`[auth] Authenticate: Found NextAuth token for user ${nextAuthToken.email}`)
      return {
        admin: {
          id: (nextAuthToken as any).id,
          adminId: (nextAuthToken as any).adminId,
          email: (nextAuthToken as any).email,
          firstName: (nextAuthToken as any).firstName,
          lastName: (nextAuthToken as any).lastName,
          name: (nextAuthToken as any).name,
          avatarUrl: (nextAuthToken as any).avatarUrl,
          role: (nextAuthToken as any).role,
          permissions: (nextAuthToken as any).permissions || [],
          isSuperAdmin: (nextAuthToken as any).isSuperAdmin || false,
        },
      }
    }
  }

  if (!token) {
    return { error: "Access denied", status: 401 }
  }

  try {
    const { payload: decoded } = await jwtVerify(token, JWT_SECRET)
    const role = (decoded as any).role
    const tokenType =
      (decoded as any).type || (role === "ADMIN" || role === "SUPER_ADMIN" ? "admin" : undefined)

    if (tokenType !== "admin") {
      return { error: "Admin access required", status: 403 }
    }

    const userId = (decoded as any).adminId || (decoded as any).sub || (decoded as any).id
    const adminUser = await (prisma as any).adminUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, isSuperAdmin: true, email: true },
    })

    if (!adminUser || !adminUser.isActive) {
      return { error: "Invalid or deactivated account", status: 401 }
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
        isSuperAdmin: adminUser.isSuperAdmin,
      },
    }
  } catch (err: any) {
    console.error(`[auth] Token verification failed: ${err.message}`)
    return { error: "Invalid or expired token", status: 401 }
  }
}

export function hasPermission(admin: any, permission: string) {
  if (!admin) return false
  if (admin.isSuperAdmin || admin.permissions.includes("*")) return true
  return admin.permissions.includes(permission)
}

async function getSessionTimeoutSeconds(): Promise<number> {
  const now = Date.now()
  if (sessionTimeoutCache && now - sessionTimeoutCache.timestamp < CACHE_TTL_MS) {
    return sessionTimeoutCache.data
  }

  let timeout = 24 * 3600
  try {
    const setting = await (prisma as any).systemSetting.findUnique({ where: { key: "sessionPolicy" } })
    if (setting?.value) {
      const policy = JSON.parse(setting.value)
      if (policy?.timeout) {
        timeout = Number(policy.timeout) * 3600
      }
    }
  } catch (error) {
    console.warn("Could not load session timeout from database, using fallback")
  }

  sessionTimeoutCache = { data: timeout, timestamp: now }
  return timeout
}

function createBaseAuthOptions(providers: NonNullable<NextAuthOptions["providers"]>): NextAuthOptions {
  return {
    secret: getAuthSecret(),
    trustHost: true,
    useSecureCookies: isSecureAuthUrl,
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          totpCode: { label: "2FA Code", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null

          const user = await (prisma as any).user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.password || !user.isActive) return null
          if (!isLoginMethodAllowed(user.allowedLoginMethods, "email")) return null

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
        },
      }),
      ...providers,
    ],
    session: { strategy: "jwt" },
    cookies: {
      sessionToken: {
        name: isSecureAuthUrl ? "__Secure-next-auth.session-token" : "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isSecureAuthUrl,
        },
      },
      callbackUrl: {
        name: isSecureAuthUrl ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
        options: {
          sameSite: "lax",
          path: "/",
          secure: isSecureAuthUrl,
        },
      },
      csrfToken: {
        name: isSecureAuthUrl ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isSecureAuthUrl,
        },
      },
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "credentials") {
          return true
        }

        const providerConfig = await getResolvedSSOProvider(account?.provider)
        if (!providerConfig) return false

        const mappedProfile = mapOAuthProfile(profile, providerConfig.providerName)
        const resolvedEmail = mappedProfile.email || user.email
        if (!resolvedEmail) return false
        if (!isDomainAllowed(resolvedEmail, providerConfig.allowedDomains)) return false
        if (providerConfig.requireEmailVerified && mappedProfile.emailVerified === false) return false

        const mappedRole =
          providerConfig.providerName === "azure-ad"
            ? resolveMappedRoleFromGroups(
                await resolveAzureGroupIds(profile, (account as any)?.access_token),
                providerConfig.groupRoleMappings
              )
            : null

        const identityUser = await getOrCreateIdentityUser(
          resolvedEmail,
          mappedProfile.name || user.name || "",
          providerConfig.providerName,
          {
            allowSignup: providerConfig.allowSignup,
            defaultRole: providerConfig.defaultRole,
            avatarUrl: mappedProfile.avatarUrl || null,
            mappedRole,
          }
        )

        if (!identityUser) return false
        if (!isLoginMethodAllowed(identityUser.loginMethods, providerConfig.providerName)) return false

        ;(user as any).id = identityUser.id
        user.email = identityUser.email
        user.name = identityUser.name
        ;(user as any).role = identityUser.role
        ;(user as any).permissions = identityUser.permissions
        ;(user as any).avatarUrl = identityUser.avatarUrl
        ;(user as any).isSuperAdmin = identityUser.isSuperAdmin

        return true
      },
      async jwt({ token, user }) {
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
          ;(session.user as any).id = token.id
          ;(session.user as any).role = token.role
          ;(session.user as any).permissions = token.permissions
          ;(session.user as any).avatarUrl = token.avatarUrl
          ;(session.user as any).isSuperAdmin = token.isSuperAdmin
          ;(session as any).exp = token.exp
        }

        return session
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`
        }

        try {
          const redirectUrl = new URL(url)
          if (redirectUrl.origin === baseUrl) {
            return url
          }
        } catch {
          return baseUrl
        }

        return baseUrl
      },
    },
    pages: { signIn: "/auth/signin" },
  }
}

export const authOptions: NextAuthOptions = createBaseAuthOptions([])

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const providers = await createNextAuthSSOProviders()
  return createBaseAuthOptions(providers)
}
