const SIGN_IN_PATH_PATTERN = /(^|\/)auth\/signin(?:\/|$)/

export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback: string
): string {
  if (!callbackUrl) {
    return fallback
  }

  try {
    const parsedUrl = callbackUrl.startsWith('http')
      ? new URL(callbackUrl)
      : new URL(callbackUrl, 'http://localhost')

    if (!parsedUrl.pathname.startsWith('/')) {
      return fallback
    }

    if (SIGN_IN_PATH_PATTERN.test(parsedUrl.pathname)) {
      return fallback
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return fallback
  }
}
