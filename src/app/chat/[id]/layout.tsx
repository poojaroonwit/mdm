import { Metadata } from 'next'

interface ChatLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/**
 * Generate viewport configuration for the chat page.
 */
export async function generateViewport({ params }: { params: Promise<{ id: string }> }): Promise<any> {
  const { id: chatbotId } = await params

  try {
    const { db } = await import('@/lib/db')
    const { mergeVersionConfig } = await import('@/lib/chatbot-helper')

    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!chatbot) {
      return { themeColor: '#3b82f6' }
    }

    const cb = mergeVersionConfig(chatbot)
    const themeColor = cb.pwaThemeColor || cb.primaryColor || '#3b82f6'

    return {
      themeColor: themeColor,
    }
  } catch (error) {
    return { themeColor: '#3b82f6' }
  }
}

/**
 * Generate dynamic metadata for the chat page based on chatbot configuration.
 * This enables PWA installation with chatbot-specific branding.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: chatbotId } = await params

  // Default metadata values
  const defaultMetadata: Metadata = {
    title: 'Chat Assistant',
    description: 'AI Chat Assistant',
    manifest: `/api/chat/${chatbotId}/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Chat',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }

  try {
    // Fetch chatbot configuration for PWA metadata
    // Use direct DB access to avoid network roundtrips and timeouts
    const { db } = await import('@/lib/db')
    const { mergeVersionConfig } = await import('@/lib/chatbot-helper')

    // Fetch chatbot with versions to get the config
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!chatbot) {
      return defaultMetadata
    }

    // Merge version config to get all PWA properties
    const cb = mergeVersionConfig(chatbot)
    const appName = cb.pwaAppName || cb.name || 'Chat Assistant'
    const description = cb.pwaDescription || cb.description || 'AI Chat Assistant'
    const themeColor = cb.pwaThemeColor || cb.primaryColor || '#3b82f6'
    const iconUrl = cb.pwaIconUrl || cb.logo

    return {
      title: appName,
      description: description,
      manifest: `/api/chat/${chatbotId}/manifest.json`,
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: (chatbot as any).pwaShortName || appName.split(' ')[0] || 'Chat',
      },
      icons: iconUrl ? [
        { url: iconUrl, sizes: '192x192', type: 'image/png' },
        { url: iconUrl, sizes: '512x512', type: 'image/png' },
      ] : undefined,
      other: {
        'mobile-web-app-capable': 'yes',
      },
      openGraph: {
        title: appName,
        description: description,
        type: 'website',
        images: iconUrl ? [{ url: iconUrl }] : undefined,
      },
    }
  } catch (error) {
    console.error('Error generating chat page metadata:', error)
    return defaultMetadata
  }
}

// Helper to extract loading config from chatbot
const getLoadingConfig = (chatbot: any) => {
  const versionConfig = (chatbot.versions && chatbot.versions[0]?.config) || {}
  const manifestParams = chatbot.manifestParams || {} as any
  const loadingConfig = manifestParams.loadingConfig || {}

  return {
    backgroundColor: loadingConfig.backgroundColor || chatbot.pageBackgroundColor || '#ffffff',
    spinnerColor: loadingConfig.spinnerColor || chatbot.primaryColor || '#000000',
    text: loadingConfig.text || ''
  }
}

export default async function ChatLayout({ children, params }: ChatLayoutProps) {
  const { id: chatbotId } = await params

  // Fetch chatbot config for loading styles
  let loadingStyles = { backgroundColor: '#ffffff', spinnerColor: '#000000', text: '' }

  try {
    const { db } = await import('@/lib/db')
    const { mergeVersionConfig } = await import('@/lib/chatbot-helper')

    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (chatbot) {
      // We're manually extracting because mergeVersionConfig might not handle nested manifestParams deep merge perfectly in all cases, 
      // but let's try to trust the data structure we just saved.
      // Actually mergeVersionConfig returns a flat config.
      const cb = mergeVersionConfig(chatbot)
      // Check manifestParams in the merged object
      const manifestParams = (cb as any).manifestParams || {}
      const loadingConfig = manifestParams.loadingConfig || {}

      loadingStyles = {
        backgroundColor: loadingConfig.backgroundColor || cb.bgColor || '#ffffff', // Fallback to Splash bgColor
        spinnerColor: loadingConfig.spinnerColor || cb.themeColor || '#000000', // Fallback to Theme Color
        text: loadingConfig.text || ''
      }
    }
  } catch (e) {
    console.error('Error fetching chatbot for layout styles:', e)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        #pwa-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99999;
          background-color: ${loadingStyles.backgroundColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s ease-out;
        }
        .pwa-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${loadingStyles.spinnerColor}20; /* 20% opacity */
          border-top-color: ${loadingStyles.spinnerColor};
          border-radius: 50%;
          animation: pwa-spin 1s linear infinite;
        }
        @keyframes pwa-spin {
          to { transform: rotate(360deg); }
        }
        .pwa-loading-text {
           margin-top: 16px;
           font-family: system-ui, -apple-system, sans-serif;
           font-size: 16px;
           font-weight: 500;
           color: ${loadingStyles.spinnerColor};
        }
      `}} />
      <div id="pwa-loading-overlay">
        <div className="pwa-spinner"></div>
        {loadingStyles.text && <div className="pwa-loading-text">{loadingStyles.text}</div>}
      </div>
      {children}
    </>
  )
}
