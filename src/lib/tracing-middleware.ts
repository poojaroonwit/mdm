/**
 * Tracing Middleware for API Routes
 * Automatically creates distributed traces for all API requests and sends them to SigNoz
 */

import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/shared/lib/performance/performance-monitor'
import { metricsCollector } from '@/shared/lib/monitoring/metrics'
import {
  clearTraceContext,
  extractTraceContext,
  generateSpanId,
  generateTraceId,
  getCurrentTraceContext,
  injectTraceContext,
  registerActiveSpan,
  setTraceContext,
  traceContext,
} from './tracing-context'

// Sampling configuration
interface SamplingConfig {
  // Sample rate (0.0 to 1.0) - percentage of requests to trace
  sampleRate: number
  // Always trace these paths (regardless of sample rate)
  alwaysTrace?: string[]
  // Never trace these paths (even if sample rate would include them)
  neverTrace?: string[]
  // Sample rate for error requests (usually higher)
  errorSampleRate?: number
}

const defaultSamplingConfig: SamplingConfig = {
  sampleRate: 1.0, // 100% by default
  alwaysTrace: [],
  neverTrace: [],
  errorSampleRate: 1.0 // Always trace errors
}

let samplingConfig: SamplingConfig = defaultSamplingConfig

/**
 * Configure trace sampling
 */
export function configureSampling(config: Partial<SamplingConfig>): void {
  samplingConfig = { ...defaultSamplingConfig, ...config }
}

/**
 * Determine if a request should be traced based on sampling configuration
 */
function shouldTrace(request: NextRequest, willBeError: boolean = false): boolean {
  const path = new URL(request.url).pathname
  
  // Always trace paths in alwaysTrace list
  if (samplingConfig.alwaysTrace?.some(pattern => path.includes(pattern))) {
    return true
  }
  
  // Never trace paths in neverTrace list
  if (samplingConfig.neverTrace?.some(pattern => path.includes(pattern))) {
    return false
  }
  
  // Use error sample rate for errors
  const rate = willBeError 
    ? (samplingConfig.errorSampleRate ?? samplingConfig.sampleRate)
    : samplingConfig.sampleRate
  
  // Random sampling
  return Math.random() < rate
}

/**
 * Send trace to SigNoz
 */
async function sendTrace(
  traceId: string,
  spanId: string,
  parentSpanId: string | undefined,
  name: string,
  startTime: number,
  endTime: number,
  statusCode: number,
  attributes: Record<string, any>
): Promise<void> {
  try {
    const { sendTraceToSigNoz, isSigNozEnabled } = await import('./signoz-client')
    const enabled = await isSigNozEnabled()
    
    if (!enabled) {
      return
    }

    await sendTraceToSigNoz({
      traceId,
      spanId,
      parentSpanId,
      name,
      kind: 'SERVER',
      startTime,
      endTime,
      attributes: {
        ...attributes,
        'http.status_code': statusCode,
        'http.method': attributes.method || 'UNKNOWN',
        'http.route': attributes.route || attributes.path || 'unknown',
      },
      status: {
        code: statusCode >= 500 ? 2 : statusCode >= 400 ? 1 : 0, // 0=OK, 1=ERROR, 2=UNSET
        message: statusCode >= 400 ? `HTTP ${statusCode}` : undefined
      }
    })
  } catch (error) {
    // Silently fail - don't break requests if tracing fails
    console.error('Failed to send trace to SigNoz:', error)
  }
}

/**
 * Tracing middleware wrapper for API handlers
 * Automatically creates traces for API requests
 */
export function withTracing<T = {}>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse> | NextResponse,
  options: {
    traceName?: string | ((request: NextRequest) => string)
    includeBody?: boolean
    includeHeaders?: boolean
    sampleRate?: number
    alwaysTrace?: string[]
    neverTrace?: string[]
  } = {}
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T) => {
    const startTime = Date.now()
    
    // Extract or generate trace context
    const { traceId, parentSpanId } = extractTraceContext(request)
    const spanId = generateSpanId()
    
    // Store trace context
    const requestId = generateTraceId()
    traceContext.set(requestId, {
      traceId,
      spanId,
      parentSpanId,
      startTime
    })
    
    // Set trace context for nested spans
    setTraceContext({ traceId, spanId, parentSpanId })
    
    // Check if we should trace this request (sampling)
    let shouldTraceRequest = true
    if (options.sampleRate !== undefined || options.alwaysTrace || options.neverTrace) {
      const customConfig: SamplingConfig = {
        sampleRate: options.sampleRate ?? samplingConfig.sampleRate,
        alwaysTrace: options.alwaysTrace ?? samplingConfig.alwaysTrace,
        neverTrace: options.neverTrace ?? samplingConfig.neverTrace,
        errorSampleRate: samplingConfig.errorSampleRate
      }
      const originalConfig = samplingConfig
      samplingConfig = customConfig
      shouldTraceRequest = shouldTrace(request, false)
      samplingConfig = originalConfig
    } else {
      shouldTraceRequest = shouldTrace(request, false)
    }

    // Determine trace name
    const traceName = typeof options.traceName === 'function'
      ? options.traceName(request)
      : options.traceName || `${request.method} ${new URL(request.url).pathname}`

    // Start performance monitoring
    performanceMonitor.start(traceName)

    // Extract request metadata
    const url = new URL(request.url)
    const metadata = getRequestMetadata(request)
    
    const attributes: Record<string, any> = {
      method: request.method,
      path: url.pathname,
      route: url.pathname,
      query: url.search,
      ...metadata
    }

    // Optionally include headers (excluding sensitive ones)
    if (options.includeHeaders) {
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase()
        // Exclude sensitive headers
        if (!['authorization', 'cookie', 'x-api-key'].includes(lowerKey)) {
          headers[`http.request.header.${lowerKey}`] = value
        }
      })
      Object.assign(attributes, headers)
    }

    let response: NextResponse
    let statusCode = 500

    try {
      // Execute the handler
      response = await handler(request, context)
      statusCode = response.status

      // Inject trace context into response
      injectTraceContext(response, traceId, spanId)

      return response
    } catch (error) {
      statusCode = 500
      attributes['error'] = true
      attributes['error.message'] = error instanceof Error ? error.message : String(error)
      attributes['error.type'] = error instanceof Error ? error.name : 'UnknownError'
      
      // Re-throw the error
      throw error
    } finally {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Record performance metrics
      performanceMonitor.end(traceName)
      metricsCollector.histogram(`api.request.duration`, duration, {
        method: request.method,
        path: url.pathname,
        status: String(statusCode)
      })
      metricsCollector.increment(`api.request.count`, 1, {
        method: request.method,
        path: url.pathname,
        status: statusCode.toString()
      })
      
      if (statusCode >= 500) {
        metricsCollector.increment(`api.request.errors`, 1, {
          method: request.method,
          path: url.pathname
        })
      }
      
      // Send trace to SigNoz (fire and forget) - only if sampling allows
      if (shouldTraceRequest || statusCode >= 400) {
        sendTrace(
          traceId,
          spanId,
          parentSpanId,
          traceName,
          startTime,
          endTime,
          statusCode,
          {
            ...attributes,
            'request.duration': duration,
            'sampled': shouldTraceRequest
          }
        ).catch(() => {
          // Silently fail
        })
      }

      // Clean up trace context
      traceContext.delete(requestId)
      clearTraceContext(traceId, spanId)
    }
  }
}

/**
 * Create a child span for nested operations
 * Enhanced with performance monitoring integration
 */
export async function createChildSpan<T>(
  name: string,
  operation: () => Promise<T>,
  options: {
    attributes?: Record<string, any>
    kind?: 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER'
  } = {}
): Promise<T> {
  const context = getCurrentTraceContext()
  const spanId = generateSpanId()
  const startTime = Date.now()
  
  // Start performance monitoring
  performanceMonitor.start(name)
  
  // Track span
  if (context) {
    registerActiveSpan({
      traceId: context.traceId,
      spanId,
      parentSpanId: context.spanId,
      startTime,
      name
    })
  }

  try {
    const result = await operation()
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // End performance monitoring
    const perfMetric = performanceMonitor.end(name)
    
    // Record metric
    metricsCollector.histogram(`span.${name}.duration`, duration, {
      unit: 'ms',
      ...options.attributes
    })

    // Send child span trace
    if (context) {
      const { sendTraceToSigNoz, isSigNozEnabled } = await import('./signoz-client')
      const enabled = await isSigNozEnabled()
      
      if (enabled) {
        sendTraceToSigNoz({
          traceId: context.traceId,
          spanId,
          parentSpanId: context.spanId,
          name,
          kind: options.kind || 'INTERNAL',
          startTime,
          endTime,
          attributes: {
            ...options.attributes,
            'span.duration': duration,
            'span.performance.duration': perfMetric?.duration || duration
          },
          status: { code: 0 }
        }).catch(() => {})
      }
    }

    // Clean up
    if (context) {
      clearTraceContext(context.traceId, spanId)
    }

    return result
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // End performance monitoring
    performanceMonitor.end(name)
    
    // Record error metric
    metricsCollector.increment(`span.${name}.errors`, 1, options.attributes)

    // Send error span
    if (context) {
      const { sendTraceToSigNoz, isSigNozEnabled } = await import('./signoz-client')
      const enabled = await isSigNozEnabled()
      
      if (enabled) {
        sendTraceToSigNoz({
          traceId: context.traceId,
          spanId,
          parentSpanId: context.spanId,
          name,
          kind: options.kind || 'INTERNAL',
          startTime,
          endTime,
          attributes: {
            ...options.attributes,
            'error': true,
            'error.message': error instanceof Error ? error.message : String(error),
            'error.type': error instanceof Error ? error.name : 'UnknownError',
            'span.duration': duration
          },
          status: {
            code: 1,
            message: error instanceof Error ? error.message : undefined
          }
        }).catch(() => {})
      }
    }

    // Clean up
    if (context) {
      clearTraceContext(context.traceId, spanId)
    }

    throw error
  }
}

/**
 * Create a custom span manually (for advanced use cases)
 */
export async function startSpan<T>(
  name: string,
  operation: (span: Span) => Promise<T>,
  options: {
    attributes?: Record<string, any>
    kind?: 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER'
  } = {}
): Promise<T> {
  return createChildSpan(name, async () => {
    const span: Span = {
      setAttribute(key: string, value: any) {
        if (options.attributes) {
          options.attributes[key] = value
        }
      },
      setAttributes(attrs: Record<string, any>) {
        if (options.attributes) {
          Object.assign(options.attributes, attrs)
        }
      },
      addEvent(name: string, attributes?: Record<string, any>) {
        // Events can be added as attributes
        if (options.attributes) {
          options.attributes[`event.${name}`] = JSON.stringify(attributes || {})
        }
      }
    }
    return await operation(span)
  }, options)
}

/**
 * Span interface for custom span operations
 */
export interface Span {
  setAttribute(key: string, value: any): void
  setAttributes(attributes: Record<string, any>): void
  addEvent(name: string, attributes?: Record<string, any>): void
}

/**
 * Helper to get request metadata
 */
function getRequestMetadata(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    host: request.headers.get('host') || 'unknown',
  }
}

