'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Blocks, BriefcaseBusiness, Building2, FolderKanban, Layers3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeProjectMetadata } from './project-config'

interface SidebarProject {
  id: string
  name: string
  metadata?: Record<string, any> | null
}

interface ProjectManagementSidebarProps {
  activeProjectId?: string
}

function ProjectVisual({ project }: { project: SidebarProject }) {
  const metadata = normalizeProjectMetadata(project.metadata)
  const iconMap = {
    'folder-kanban': FolderKanban,
    briefcase: BriefcaseBusiness,
    building: Building2,
    layers: Layers3,
    blocks: Blocks,
    sparkles: Sparkles,
  }
  const Icon = iconMap[metadata.icon as keyof typeof iconMap] || FolderKanban

  if (metadata.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={metadata.thumbnailUrl}
        alt={project.name}
        className="h-6 w-6 rounded-md object-cover"
      />
    )
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-3.5 w-3.5" />
    </div>
  )
}

export function ProjectManagementSidebar({
  activeProjectId,
}: ProjectManagementSidebarProps) {
  const [projects, setProjects] = useState<SidebarProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error('Failed to load projects')
        }

        const data = await response.json()
        if (!cancelled) {
          setProjects(data.projects || [])
        }
      } catch (error) {
        if (!cancelled) {
          setProjects([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="flex h-full w-full flex-col"
      data-sidebar="secondary"
      data-component="project-management-sidebar"
      style={{
        backgroundColor: 'var(--brand-secondary-sidebar-bg, hsl(var(--muted)))',
        color: 'var(--brand-secondary-sidebar-text, hsl(var(--muted-foreground)))',
      }}
    >
      <div className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <FolderKanban className="h-4 w-4" />
          Project Management
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2.5 py-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Projects
          </div>
          <div className="space-y-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-md px-3 py-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                No projects yet.
              </div>
            ) : (
              projects.map((project) => {
                const isActive = project.id === activeProjectId
                return (
                  <Button
                    key={project.id}
                    asChild
                    variant="ghost"
                    className={cn(
                      'h-auto w-full justify-start gap-3 rounded-md px-3 py-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Link href={`/tools/projects/${project.id}`}>
                      <ProjectVisual project={project} />
                      <span className="truncate text-[13px]">{project.name}</span>
                    </Link>
                  </Button>
                )
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
