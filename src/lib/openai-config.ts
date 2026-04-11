import { db } from '@/lib/db'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'

export async function getGlobalOpenAIApiKey(): Promise<string | null> {
  const providerConfig = await db.aIProviderConfig.findFirst({
    where: { provider: 'openai' },
    select: { apiKey: true },
  })

  if (!providerConfig?.apiKey) {
    return null
  }

  const secretsManager = getSecretsManager()
  if (providerConfig.apiKey.startsWith('vault://') && secretsManager.getBackend() === 'vault') {
    return await secretsManager.getApiKey('openai')
  }

  return decryptApiKey(providerConfig.apiKey) || providerConfig.apiKey
}
