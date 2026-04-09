const DEFAULT_AUTH_SECRET = "fallback-secret-key-for-development"

export function getAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    DEFAULT_AUTH_SECRET
  )
}

export function hasExplicitAuthSecret(): boolean {
  return Boolean(
    process.env.NEXTAUTH_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      process.env.JWT_SECRET?.trim()
  )
}

