'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { FileText, GitBranch, Minus, Network, Plus, Search, Target } from 'lucide-react'
import type { KnowledgeDocument } from '../types'

interface KnowledgeGraphViewProps {
  documents: KnowledgeDocument[]
  selectedDocument: KnowledgeDocument | null
  onSelectDocument: (document: KnowledgeDocument) => void
}

interface GraphNode {
  id: string
  title: string
  radius: number
  x: number
  y: number
  links: number
  isRoot: boolean
  document: KnowledgeDocument
}

interface GraphEdge {
  id: string
  source: string
  target: string
  kind: 'hierarchy' | 'wiki'
}

const CANVAS_WIDTH = 1400
const CANVAS_HEIGHT = 900

function normalizeTitle(value: string) {
  return value.trim().toLowerCase()
}

function extractWikiLinks(content: string) {
  const links: string[] = []
  const pattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    links.push(match[1].trim())
  }

  return links
}

function buildGraph(documents: KnowledgeDocument[]) {
  const byId = new Map(documents.map((doc) => [doc.id, doc]))
  const byTitle = new Map(documents.map((doc) => [normalizeTitle(doc.title), doc]))
  const edges: GraphEdge[] = []
  const seenEdges = new Set<string>()

  const pushEdge = (source: string, target: string, kind: GraphEdge['kind']) => {
    const key = `${kind}:${source}:${target}`
    if (!seenEdges.has(key) && source !== target) {
      seenEdges.add(key)
      edges.push({ id: key, source, target, kind })
    }
  }

  documents.forEach((doc) => {
    if (doc.parentId && byId.has(doc.parentId)) {
      pushEdge(doc.parentId, doc.id, 'hierarchy')
    }

    extractWikiLinks(doc.content || '').forEach((linkTitle) => {
      const target = byTitle.get(normalizeTitle(linkTitle))
      if (target) {
        pushEdge(doc.id, target.id, 'wiki')
      }
    })
  })

  const degree = new Map<string, number>()
  documents.forEach((doc) => degree.set(doc.id, 0))
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1)
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1)
  })

  const sorted = [...documents].sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))
  const roots = sorted.filter((doc) => !doc.parentId)
  const rootIds = new Set(roots.map((doc) => doc.id))

  const nodes: GraphNode[] = sorted.map((doc, index) => {
    const links = degree.get(doc.id) || 0
    const ring = Math.floor(index / 10)
    const ringIndex = index % 10
    const ringRadius = 110 + ring * 95
    const angle = ((Math.PI * 2) / Math.max(10, Math.min(sorted.length, 10))) * ringIndex + ring * 0.2
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * ringRadius
    const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * ringRadius

    return {
      id: doc.id,
      title: doc.title,
      radius: Math.max(22, Math.min(42, 22 + links * 3)),
      x,
      y,
      links,
      isRoot: rootIds.has(doc.id),
      document: doc,
    }
  })

  return {
    nodes,
    edges,
    degree,
  }
}

export function KnowledgeGraphView({
  documents,
  selectedDocument,
  onSelectDocument,
}: KnowledgeGraphViewProps) {
  const [zoom, setZoom] = useState(1)
  const [query, setQuery] = useState('')

  const graph = useMemo(() => buildGraph(documents), [documents])

  const filteredNodeIds = useMemo(() => {
    if (!query.trim()) {
      return new Set(graph.nodes.map((node) => node.id))
    }

    const normalized = normalizeTitle(query)
    return new Set(
      graph.nodes
        .filter((node) => normalizeTitle(node.title).includes(normalized))
        .map((node) => node.id)
    )
  }, [graph.nodes, query])

  const visibleNodes = graph.nodes.filter((node) => filteredNodeIds.has(node.id))
  const visibleEdges = graph.edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  )

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <div className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Knowledge Graph</h3>
            <p className="text-xs text-muted-foreground">
              Obsidian-style map built from document hierarchy and `[[wiki links]]`
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter graph nodes..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="min-w-14 justify-center">
              {Math.round(zoom * 100)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px]">
          <div
            className="origin-top-left"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoom})`,
            }}
          >
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="h-full w-full">
              {visibleEdges.map((edge) => {
                const source = graph.nodes.find((node) => node.id === edge.source)
                const target = graph.nodes.find((node) => node.id === edge.target)
                if (!source || !target) return null

                return (
                  <line
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edge.kind === 'wiki' ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--muted-foreground) / 0.25)'}
                    strokeWidth={edge.kind === 'wiki' ? 2.2 : 1.4}
                    strokeDasharray={edge.kind === 'wiki' ? '0' : '6 6'}
                  />
                )
              })}

              {visibleNodes.map((node) => {
                const isSelected = selectedDocument?.id === node.id
                const isMatch = query.trim() && filteredNodeIds.has(node.id)

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => onSelectDocument(node.document)}
                  >
                    <circle
                      r={node.radius + (isSelected ? 6 : 0)}
                      fill={isSelected ? 'hsl(var(--primary) / 0.18)' : 'transparent'}
                    />
                    <circle
                      r={node.radius}
                      fill={
                        isSelected
                          ? 'hsl(var(--primary))'
                          : node.isRoot
                            ? 'hsl(var(--accent))'
                            : 'hsl(var(--card))'
                      }
                      stroke={
                        isSelected
                          ? 'hsl(var(--primary))'
                          : isMatch
                            ? 'hsl(var(--primary) / 0.7)'
                            : 'hsl(var(--border))'
                      }
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      y={4}
                      textAnchor="middle"
                      className={cn(
                        'select-none text-[11px] font-medium',
                        isSelected ? 'fill-primary-foreground' : 'fill-foreground'
                      )}
                    >
                      {node.title.length > 18 ? `${node.title.slice(0, 18)}...` : node.title}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="flex w-80 flex-col bg-card">
        <div className="border-b border-border px-5 py-4">
          <h4 className="text-sm font-semibold">Graph Overview</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Notes</span>
              </div>
              <div className="mt-2 text-xl font-semibold">{graph.nodes.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Links</span>
              </div>
              <div className="mt-2 text-xl font-semibold">{graph.edges.length}</div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-5">
            {selectedDocument ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focused Note</div>
                    <h5 className="mt-2 text-base font-semibold">{selectedDocument.title}</h5>
                  </div>
                  <Badge variant="secondary">
                    {(graph.degree.get(selectedDocument.id) || 0).toString()} links
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-6 text-sm text-muted-foreground">
                  {(selectedDocument.content || '').replace(/[#*_>\[\]`]/g, ' ').replace(/\s+/g, ' ').trim() || 'No preview available.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Select a node to inspect the document and jump back into editing.
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4" />
                Most Connected
              </div>
              <div className="space-y-2">
                {[...graph.nodes]
                  .sort((a, b) => b.links - a.links)
                  .slice(0, 8)
                  .map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectDocument(node.document)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="truncate text-sm">{node.title}</span>
                      <Badge variant="outline">{node.links}</Badge>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Network className="h-4 w-4" />
                How Links Work
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Use `[[Document Title]]` inside note content to create graph links.</p>
                <p>Parent and child documents are also connected automatically.</p>
                <p>Click any node to open that note back in the editor.</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
