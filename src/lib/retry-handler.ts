interface RetryConfig {
  enabled: boolean
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableStatusCodes: string[]
  jitter: boolean
}

/**
 * Record retry attempt metric (called from retry logic)
 */
export async function recordRetryAttempt(
  chatbotId: string,
  attempt: number,
  success: boolean
): Promise<void> {
  try {
    const { recordMetric } = await import('@/lib/performance-metrics')
    await recordMetric({
      chatbotId,
      metricType: success ? 'retry_success' : 'retry_attempt',
      value: attempt,
    })
  } catch (error) {
    // Don't throw - metrics shouldn't break the main flow
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig & { chatbotId?: string },
  isRetryableError?: (error: any) => boolean
): Promise<T> {
  if (!config.enabled) {
    return fn()
  }

  let lastError: any
  const lastResult: T | null = null
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn()
      
      // For fetch responses, check if response is ok
      // Note: fetch() doesn't throw on HTTP errors, it returns a Response with ok=false
      // So we need to check the result after it resolves
      if (result && typeof result === 'object' && 'ok' in result && 'status' in result) {
        const response = result as any as Response
        if (!response.ok) {
          // Check if status is retryable
          const statusStr = String(response.status)
          const shouldRetry = isRetryableError
            ? isRetryableError({ status: response.status, response })
            : config.retryableStatusCodes.includes(statusStr)

          if (!shouldRetry || attempt === config.maxRetries) {
            return result // Return the error response
          }

          // Retry
          delay = calculateRetryDelay(attempt, config)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }

      // Record successful retry if this was a retry attempt
      if (attempt > 0 && config.chatbotId) {
        await recordRetryAttempt(config.chatbotId, attempt, true).catch(() => {})
      }
      return result
    } catch (error: any) {
      lastError = error

      // Check if error is retryable
      const shouldRetry = isRetryableError
        ? isRetryableError(error)
        : checkIfRetryable(error, config.retryableStatusCodes)

      if (!shouldRetry || attempt === config.maxRetries) {
        // Record failed retry attempt
        if (config.chatbotId && attempt > 0) {
          await recordRetryAttempt(config.chatbotId, attempt, false).catch(() => {})
        }
        throw error
      }
      
      // Record retry attempt
      if (config.chatbotId && attempt < config.maxRetries) {
        await recordRetryAttempt(config.chatbotId, attempt + 1, false).catch(() => {})
      }

      // Calculate delay with exponential backoff
      delay = calculateRetryDelay(attempt, config)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  if (lastResult !== null) return lastResult
  throw lastError
}

function checkIfRetryable(error: any, retryableStatusCodes: string[]): boolean {
  // Check HTTP status code
  if (error.status) {
    return retryableStatusCodes.includes(String(error.status))
  }

  // Check response status
  if (error.response?.status) {
    return retryableStatusCodes.includes(String(error.response.status))
  }

  // Check for network errors (retryable)
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true
  }

  // Default: don't retry
  return false
}

export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  let delay = config.initialDelay

  for (let i = 0; i < attempt; i++) {
    delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
  }

  if (config.jitter) {
    const jitterAmount = delay * 0.2 * (Math.random() * 2 - 1)
    delay = delay + jitterAmount
  }

  return Math.min(delay, config.maxDelay)
}

export type { RetryConfig }

