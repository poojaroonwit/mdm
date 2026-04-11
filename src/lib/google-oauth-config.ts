import { db as prisma } from '@/lib/db'
import { decryptApiKey } from '@/lib/encryption'

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig | null> {
  try {
    const provider = await (prisma as any).oAuthProvider.findFirst({
      where: { providerName: 'google', isEnabled: true },
    })

    if (!provider?.clientId || !provider?.clientSecret) {
      return null
    }

    return {
      clientId: provider.clientId,
      clientSecret: decryptApiKey(provider.clientSecret) || provider.clientSecret,
    }
  } catch (error) {
    console.warn('[Google OAuth] Failed to load config from database:', error)
    return null
  }
}
