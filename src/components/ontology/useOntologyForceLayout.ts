'use client'

import { useEffect, useState } from 'react'

import type { OntologyEdge, OntologyNode, OntologyNodeType } from '@/lib/project-types'

export type OntologyPosition = { x: number; y: number }

export function useOntologyForceLayout(
  nodes: OntologyNode[],
  edges: OntologyEdge[],
  width: number,
  height: number
) {
  const [positions, setPositions] = useState<Map<string, OntologyPosition>>(new Map())

  useEffect(() => {
    if (nodes.length === 0) return

    const newPositions = new Map<string, OntologyPosition>()
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35

    const nodesByType = new Map<OntologyNodeType, OntologyNode[]>()
    nodes.forEach(node => {
      const list = nodesByType.get(node.type) || []
      list.push(node)
      nodesByType.set(node.type, list)
    })

    let angleOffset = 0
    const typeCount = nodesByType.size
    const anglePerType = (2 * Math.PI) / typeCount

    nodesByType.forEach(typeNodes => {
      const typeRadius = radius * 0.8
      const nodesInType = typeNodes.length
      const anglePerNode = anglePerType / Math.max(nodesInType, 1)

      typeNodes.forEach((node, idx) => {
        const angle = angleOffset + anglePerNode * idx
        const jitter = (Math.random() - 0.5) * 50
        newPositions.set(node.id, {
          x: centerX + Math.cos(angle) * typeRadius + jitter,
          y: centerY + Math.sin(angle) * typeRadius + jitter,
        })
      })

      angleOffset += anglePerType
    })

    const iterations = 50
    const k = Math.sqrt((width * height) / nodes.length) * 0.5

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>()

      nodes.forEach(node => {
        forces.set(node.id, { fx: 0, fy: 0 })
      })

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pos1 = newPositions.get(nodes[i].id)!
          const pos2 = newPositions.get(nodes[j].id)!

          const dx = pos1.x - pos2.x
          const dy = pos1.y - pos2.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1

          const force = (k * k) / dist
          const fx = (dx / dist) * force * 0.5
          const fy = (dy / dist) * force * 0.5

          const f1 = forces.get(nodes[i].id)!
          const f2 = forces.get(nodes[j].id)!
          f1.fx += fx
          f1.fy += fy
          f2.fx -= fx
          f2.fy -= fy
        }
      }

      edges.forEach(edge => {
        const pos1 = newPositions.get(edge.source)
        const pos2 = newPositions.get(edge.target)

        if (!pos1 || !pos2) return

        const dx = pos1.x - pos2.x
        const dy = pos1.y - pos2.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const force = dist / k
        const fx = (dx / dist) * force * 0.3
        const fy = (dy / dist) * force * 0.3

        const f1 = forces.get(edge.source)
        const f2 = forces.get(edge.target)

        if (f1 && f2) {
          f1.fx -= fx
          f1.fy -= fy
          f2.fx += fx
          f2.fy += fy
        }
      })

      const cooling = 1 - iter / iterations
      nodes.forEach(node => {
        const pos = newPositions.get(node.id)!
        const force = forces.get(node.id)!

        pos.x += force.fx * cooling * 0.1
        pos.y += force.fy * cooling * 0.1

        pos.x = Math.max(50, Math.min(width - 50, pos.x))
        pos.y = Math.max(50, Math.min(height - 50, pos.y))
      })
    }

    setPositions(newPositions)
  }, [nodes, edges, width, height])

  return positions
}
