/**
 * Encryption utility for sensitive data like API keys
 * Uses AES-256-GCM encryption with a key derived from environment variable
 * 
 * NOTE: This module uses Node.js crypto and should only be used on the server side
 */

// Only import crypto on server side
// Use lazy loading to avoid webpack analysis at module load time
const isServer = typeof window === 'undefined'

function getCrypto() {
  if (!isServer) {
    throw new Error('Encryption can only be used on the server side')
  }
  // Lazy require - only called at runtime, not at module load time
  // This prevents webpack from analyzing it during build
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('crypto')
  } catch (error) {
    console.error('Failed to load crypto module:', error)
    throw new Error('Crypto module not available')
  }
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for salt
const TAG_LENGTH = 16 // 16 bytes for GCM tag
const KEY_LENGTH = 32 // 32 bytes for AES-256
const ITERATIONS = 100000 // PBKDF2 iterations

// Cache the derived key to avoid expensive PBKDF2 re-computation
let cachedKey: Buffer | null = null

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey
  }

  const crypto = getCrypto()
  const envKey = process.env.ENCRYPTION_KEY

  if (!envKey) {
    // Strictly require the environment variable to avoid hardcoded secrets in codebase
    throw new Error('ENCRYPTION_KEY environment variable is not set. Please set it in your .env file.')
  }

  // If key is provided as hex string, convert it
  if (envKey.length === 64) {
    const key = Buffer.from(envKey, 'hex')
    cachedKey = key
    return key
  }

  // Otherwise derive key from the environment variable
  const salt = process.env.ENCRYPTION_SALT
  if (!salt) {
    throw new Error('ENCRYPTION_SALT environment variable is not set. Please set it in your .env file.')
  }

  const key = crypto.pbkdf2Sync(envKey, salt, ITERATIONS, KEY_LENGTH, 'sha256')
  cachedKey = key
  return key
}

/**
 * Encrypt a string value
 * Returns a hex-encoded string containing: salt + iv + tag + encrypted data
 */
export function encrypt(value: string): string {
  if (!value) {
    return value
  }

  if (!isServer) {
    throw new Error('Encryption can only be used on the server side')
  }

  try {
    const crypto = getCrypto()
    const key = getEncryptionKey()
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive a key from the master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Combine: salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])

    return combined.toString('hex')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt value')
  }
}

/**
 * Decrypt a hex-encoded encrypted string
 * Expects format: salt + iv + tag + encrypted data
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue) {
    return encryptedValue
  }

  if (!isServer) {
    throw new Error('Decryption can only be used on the server side')
  }

  // Check if the value appears to be encrypted before attempting decryption
  if (!isEncrypted(encryptedValue)) {
    // Not encrypted, return as-is (plain text for backward compatibility)
    return encryptedValue
  }

  try {
    const crypto = getCrypto()
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedValue, 'hex')

    // Validate buffer length
    const minLength = SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    if (combined.length < minLength) {
      // Too short to be encrypted, return as plain text
      return encryptedValue
    }

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Derive the same key using the salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    // If decryption fails, it might be plain text (for backward compatibility)
    // Return as-is without logging error (it's expected for plain text values)
    return encryptedValue
  }
}

/**
 * Check if a value appears to be encrypted (hex string of expected length)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false

  // Encrypted values are hex strings with minimum length
  // salt (64) + iv (16) + tag (16) + at least some encrypted data = ~96+ bytes = 192+ hex chars
  const minEncryptedLength = (SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2 // Convert bytes to hex chars

  return /^[0-9a-f]+$/i.test(value) && value.length >= minEncryptedLength
}

/**
 * Encrypt API key if not already encrypted
 */
export function encryptApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null

  // If already encrypted, return as-is
  if (isEncrypted(apiKey)) {
    return apiKey
  }

  return encrypt(apiKey)
}

/**
 * Decrypt API key, with fallback for plain text (backward compatibility)
 */
export function decryptApiKey(encryptedApiKey: string | null | undefined): string | null {
  if (!encryptedApiKey) return null

  // If it appears to be encrypted, try to decrypt
  if (isEncrypted(encryptedApiKey)) {
    try {
      return decrypt(encryptedApiKey)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return null
    }
  }

  // Otherwise, assume it's plain text (for backward compatibility)
  return encryptedApiKey
}


