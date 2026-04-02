import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import type { Provider } from "next-auth/providers/index"
import { db as prisma, query } from "@/lib/db"
import { decryptApiKey } from "@/lib/encryption"
import { mapOAuthProfile } from "@/lib/identity-utils"

const CACHE_TTL_MS = 5 * 60 * 1000
const SUPPORTED_PROVIDER_NAMES = ["google", "github", "azure-ad"] as const

export const SSO_SECRET_MASK = "********"

export type SupportedSSOProviderName = (typeof SUPPORTED_PROVIDER_NAMES)[number]

export type AzureGroupRoleMapping = {
  groupId: string
  name?: string
  role: string
}

type OAuthProviderRecord = {
  providerName: string
  displayName?: string | null
  isEnabled?: boolean | null
  clientId?: string | null
  clientSecret?: string | null
  authorizationUrl?: string | null
  tokenUrl?: string | null
  userinfoUrl?: string | null
  scopes?: unknown
  allowedDomains?: string[] | null
  allowSignup?: boolean | null
  requireEmailVerified?: boolean | null
  autoLinkByEmail?: boolean | null
  defaultRole?: string | null
  displayOrder?: number | null
  platformConfig?: unknown
}

export type ResolvedSSOProvider = {
  providerName: SupportedSSOProviderName
  displayName: string
  isEnabled: boolean
  clientId: string
  clientSecret: string
  authorizationUrl: string | null
  tokenUrl: string | null
  userinfoUrl: string | null
  scopes: string[]
  allowedDomains: string[]
  allowSignup: boolean
  requireEmailVerified: boolean
  autoLinkByEmail: boolean
  defaultRole: string | null
  displayOrder: number
  tenantId: string | null
  groupRoleMappings: AzureGroupRoleMapping[]
}

let providersCache: { data: ResolvedSSOProvider[]; timestamp: number } | null = null

function isSupportedProviderName(value: string): value is SupportedSSOProviderName {
  return (SUPPORTED_PROVIDER_NAMES as readonly string[]).includes(value)
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  }

  return []
}

function toAzureGroupRoleMappings(value: unknown): AzureGroupRoleMapping[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const groupId = typeof item.groupId === "string" ? item.groupId.trim() : ""
      const role = typeof item.role === "string" ? item.role.trim().toUpperCase() : ""
      const name = typeof item.name === "string" ? item.name.trim() : ""
      if (!groupId || !role) {
        return null
      }

      return {
        groupId,
        role,
        ...(name ? { name } : {}),
      }
    })
    .filter((item): item is AzureGroupRoleMapping => Boolean(item))
}

function inferAzureTenantId(record: OAuthProviderRecord): string | null {
  const platformConfig = isRecord(record.platformConfig) ? record.platformConfig : {}
  const tenantId = typeof platformConfig.tenantId === "string" ? platformConfig.tenantId.trim() : ""
  if (tenantId) {
    return tenantId
  }

  const loginUrl = record.authorizationUrl || record.tokenUrl || ""
  const match = loginUrl.match(/login\.microsoftonline\.com\/([^/]+)\//i)
  return match?.[1]?.trim() || null
}

function resolveAzureGroupRoleMappings(record: OAuthProviderRecord): AzureGroupRoleMapping[] {
  const platformConfig = isRecord(record.platformConfig) ? record.platformConfig : {}
  return toAzureGroupRoleMappings(platformConfig.groupRoleMappings)
}

function resolveDbProvider(record: OAuthProviderRecord): ResolvedSSOProvider | null {
  const providerName = normalizeSSOProviderName(record.providerName)
  if (!providerName || !record.isEnabled || !record.clientId || !record.clientSecret) {
    return null
  }

  const clientSecret = decryptApiKey(record.clientSecret) || record.clientSecret
  const tenantId = providerName === "azure-ad" ? inferAzureTenantId(record) : null
  if (providerName === "azure-ad" && !tenantId) {
    return null
  }

  return {
    providerName,
    displayName: record.displayName || providerName,
    isEnabled: true,
    clientId: record.clientId,
    clientSecret,
    authorizationUrl: record.authorizationUrl || null,
    tokenUrl: record.tokenUrl || null,
    userinfoUrl: record.userinfoUrl || null,
    scopes: toStringArray(record.scopes),
    allowedDomains: Array.isArray(record.allowedDomains) ? record.allowedDomains : [],
    allowSignup: Boolean(record.allowSignup),
    requireEmailVerified: record.requireEmailVerified ?? true,
    autoLinkByEmail: record.autoLinkByEmail ?? false,
    defaultRole: record.defaultRole || null,
    displayOrder: record.displayOrder ?? 0,
    tenantId,
    groupRoleMappings: providerName === "azure-ad" ? resolveAzureGroupRoleMappings(record) : [],
  }
}

function getEnvProvider(providerName: SupportedSSOProviderName): ResolvedSSOProvider | null {
  if (providerName === "google" && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      providerName,
      displayName: "Google",
      isEnabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: null,
      tokenUrl: null,
      userinfoUrl: null,
      scopes: ["openid", "email", "profile"],
      allowedDomains: [],
      allowSignup: false,
      requireEmailVerified: true,
      autoLinkByEmail: false,
      defaultRole: null,
      displayOrder: 1,
      tenantId: null,
      groupRoleMappings: [],
    }
  }

  if (providerName === "github" && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    return {
      providerName,
      displayName: "GitHub",
      isEnabled: true,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorizationUrl: null,
      tokenUrl: null,
      userinfoUrl: null,
      scopes: ["read:user", "user:email"],
      allowedDomains: [],
      allowSignup: false,
      requireEmailVerified: true,
      autoLinkByEmail: false,
      defaultRole: null,
      displayOrder: 2,
      tenantId: null,
      groupRoleMappings: [],
    }
  }

  if (
    providerName === "azure-ad" &&
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    const tenantId = process.env.AZURE_AD_TENANT_ID
    return {
      providerName,
      displayName: "Microsoft Azure",
      isEnabled: true,
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      authorizationUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      userinfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      scopes: ["openid", "email", "profile", "offline_access", "User.Read"],
      allowedDomains: [],
      allowSignup: false,
      requireEmailVerified: true,
      autoLinkByEmail: false,
      defaultRole: null,
      displayOrder: 3,
      tenantId,
      groupRoleMappings: [],
    }
  }

  return null
}

export function normalizeSSOProviderName(providerName: string | null | undefined): SupportedSSOProviderName | null {
  if (!providerName) {
    return null
  }

  const normalized = providerName.trim().toLowerCase()
  if (normalized === "microsoft") {
    return "azure-ad"
  }

  return isSupportedProviderName(normalized) ? normalized : null
}

export function clearSSOProviderCache() {
  providersCache = null
}

export async function getResolvedSSOProviders(): Promise<ResolvedSSOProvider[]> {
  const now = Date.now()
  if (providersCache && now - providersCache.timestamp < CACHE_TTL_MS) {
    return providersCache.data
  }

  const merged = new Map<SupportedSSOProviderName, ResolvedSSOProvider>()

  try {
    const records = await (prisma as any).oAuthProvider.findMany({
      where: {
        providerName: {
          in: [...SUPPORTED_PROVIDER_NAMES, "microsoft"],
        },
        isEnabled: true,
      },
      orderBy: { displayOrder: "asc" },
    })

    for (const record of records as OAuthProviderRecord[]) {
      const resolved = resolveDbProvider(record)
      if (resolved) {
        merged.set(resolved.providerName, resolved)
      }
    }
  } catch (error) {
    console.warn("[SSO] Failed to load oauth_providers from database:", error)
  }

  for (const providerName of SUPPORTED_PROVIDER_NAMES) {
    if (!merged.has(providerName)) {
      const envProvider = getEnvProvider(providerName)
      if (envProvider) {
        merged.set(providerName, envProvider)
      }
    }
  }

  const data = Array.from(merged.values()).sort((a, b) => a.displayOrder - b.displayOrder)
  providersCache = { data, timestamp: now }
  return data
}

export async function getResolvedSSOProvider(
  providerName: string | null | undefined
): Promise<ResolvedSSOProvider | null> {
  const normalized = normalizeSSOProviderName(providerName)
  if (!normalized) {
    return null
  }

  const providers = await getResolvedSSOProviders()
  return providers.find((provider) => provider.providerName === normalized) || null
}

async function getLegacyAvailabilityFallback() {
  const availability = {
    google: false,
    azure: false,
  }

  try {
    const { rows } = await query(
      "SELECT type, is_enabled FROM platform_integrations WHERE type IN ('azure-ad', 'google-auth') AND deleted_at IS NULL",
      [],
      30000,
      { skipTracing: true, suppressErrorLog: true }
    )

    for (const row of rows || []) {
      if (row.type === "google-auth") {
        availability.google = Boolean(row.is_enabled)
      }

      if (row.type === "azure-ad") {
        availability.azure = Boolean(row.is_enabled)
      }
    }
  } catch (error) {
    console.warn("[SSO] Failed to load legacy platform integration availability:", error)
  }

  if (!availability.google || !availability.azure) {
    try {
      const { rows } = await query(
        "SELECT key, value FROM system_settings WHERE key IN ('sso_googleEnabled', 'sso_azureEnabled')",
        [],
        30000,
        { skipTracing: true, suppressErrorLog: true }
      )

      for (const row of rows || []) {
        const parsedValue =
          typeof row.value === "string"
            ? row.value === "true" || row.value === "1"
            : Boolean(row.value)

        if (row.key === "sso_googleEnabled" && !availability.google) {
          availability.google = parsedValue
        }

        if (row.key === "sso_azureEnabled" && !availability.azure) {
          availability.azure = parsedValue
        }
      }
    } catch (error) {
      console.warn("[SSO] Failed to load legacy system setting availability:", error)
    }
  }

  return availability
}

export async function getPublicSSOAvailability() {
  const providers = await getResolvedSSOProviders()
  const availability = {
    google: providers.some((provider) => provider.providerName === "google"),
    azure: providers.some((provider) => provider.providerName === "azure-ad"),
  }

  if (!availability.google || !availability.azure) {
    const legacyAvailability = await getLegacyAvailabilityFallback()
    availability.google = availability.google || legacyAvailability.google
    availability.azure = availability.azure || legacyAvailability.azure
  }

  return availability
}

export async function createNextAuthSSOProviders(): Promise<Provider[]> {
  const providers = await getResolvedSSOProviders()

  const resolvedProviders: Provider[] = []
  for (const provider of providers) {
    if (provider.providerName === "google") {
      resolvedProviders.push(
        GoogleProvider({
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
        })
      )
      continue
    }

    if (provider.providerName === "github") {
      resolvedProviders.push(
        GitHubProvider({
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
        })
      )
      continue
    }

    if (provider.providerName === "azure-ad" && provider.tenantId) {
      resolvedProviders.push(
        AzureADProvider({
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          tenantId: provider.tenantId,
          authorization: {
            params: {
              scope:
                provider.scopes.length > 0
                  ? provider.scopes.join(" ")
                  : "openid profile email offline_access User.Read",
            },
          },
          profile(profile) {
            const mapped = mapOAuthProfile(profile, "azure-ad")
            return {
              id: String(profile.sub || profile.oid || mapped.email || profile.preferred_username),
              name: mapped.name || mapped.email,
              email: mapped.email,
              image: null,
              role: "USER",
            }
          },
        })
      )
    }
  }

  return resolvedProviders
}
