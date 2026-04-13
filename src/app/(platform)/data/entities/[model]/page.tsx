'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import BasePage from '../page'

// This wrapper resolves slug to model id then renders the base page with query param compatibility
export default function DataEntitiesByModelPage() {
  const params = useParams()
  const modelParam = (params?.model as string) || ''
  const [modelId, setModelId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function resolveModel() {
      if (!modelParam) return
      // If looks like UUID, use directly
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(modelParam)) {
        if (!cancelled) setModelId(modelParam)
        return
      }
      try {
        const res = await fetch(`/api/data-models/by-slug/${encodeURIComponent(modelParam)}`)
        if (res.ok) {
          const json = await res.json()
          if (!cancelled) setModelId(json?.dataModel?.id || null)
        } else {
          if (!cancelled) setNotFound(true)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      }
    }
    resolveModel()
    return () => { cancelled = true }
  }, [modelParam])

  if (notFound) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-500">Data model not found.</div>
      </div>
    )
  }

  // Until resolved, show nothing to preserve layout
  if (!modelId) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Render the existing page which expects `model` in search params via history push
  // Instead of rewriting the entire page, navigate client-side to include query param
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('model', modelId)
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, '', url.toString())
    }
  }

  return <BasePage />
}


