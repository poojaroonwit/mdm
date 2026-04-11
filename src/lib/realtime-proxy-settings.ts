import { prisma } from '@/lib/db'

export async function getRealtimeProxyUrl(
  fallbackHost?: string
): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'wsProxyUrl' },
      select: { value: true },
    })

    if (setting?.value?.trim()) {
      return setting.value.trim()
    }
  } catch (error) {
    console.warn('Could not load websocket proxy URL from system settings')
  }

  const port = process.env.WS_PROXY_PORT || '3002'
  const host = fallbackHost || 'localhost'
  return `ws://${host}:${port}/api/openai-realtime`
}
