import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const traceContext = new Map<string, {
  traceId: string
  spanId: string
  parentSpanId?: string
  startTime: number
}>()

const activeSpans = new Map<string, {
  traceId: string
  spanId: string
  parentSpanId?: string
  startTime: number
  name: string
}>()

const SPAN_TTL_MS = 300000
const CLEANUP_INTERVAL_MS = 60000

if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()

    for (const [key, context] of traceContext.entries()) {
      if (now - context.startTime > SPAN_TTL_MS) {
        traceContext.delete(key)
      }
    }

    for (const [key, span] of activeSpans.entries()) {
      if (now - span.startTime > SPAN_TTL_MS) {
        activeSpans.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}

export function generateTraceId(): string {
  return randomUUID().replace(/-/g, '').substring(0, 32)
}

export function generateSpanId(): string {
  return randomUUID().replace(/-/g, '').substring(0, 16)
}

export function extractTraceContext(request: NextRequest): {
  traceId: string
  parentSpanId?: string
} {
  const traceParent = request.headers.get('traceparent')
  if (traceParent) {
    const parts = traceParent.split('-')
    if (parts.length >= 3) {
      return {
        traceId: parts[1] || generateTraceId(),
        parentSpanId: parts[2] || undefined,
      }
    }
  }

  const traceId = request.headers.get('x-trace-id')
  const parentSpanId = request.headers.get('x-parent-span-id')

  return {
    traceId: traceId || generateTraceId(),
    parentSpanId: parentSpanId || undefined,
  }
}

export function injectTraceContext(response: NextResponse, traceId: string, spanId: string): void {
  response.headers.set('traceparent', `00-${traceId}-${spanId}-01`)
  response.headers.set('x-trace-id', traceId)
  response.headers.set('x-span-id', spanId)
}

export function getCurrentTraceContext(): {
  traceId: string
  spanId: string
  parentSpanId?: string
} | null {
  const spans = Array.from(activeSpans.values())
  if (spans.length === 0) {
    return null
  }

  const latestSpan = spans[spans.length - 1]
  return {
    traceId: latestSpan.traceId,
    spanId: latestSpan.spanId,
    parentSpanId: latestSpan.parentSpanId,
  }
}

export function setTraceContext(context: {
  traceId: string
  spanId: string
  parentSpanId?: string
}): void {
  registerActiveSpan({ ...context, name: 'root' })
}

export function registerActiveSpan(context: {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  startTime?: number
}): void {
  const spanKey = `${context.traceId}-${context.spanId}`
  activeSpans.set(spanKey, {
    ...context,
    startTime: context.startTime ?? Date.now(),
  })
}

export function clearTraceContext(traceId: string, spanId: string): void {
  const spanKey = `${traceId}-${spanId}`
  activeSpans.delete(spanKey)
}
