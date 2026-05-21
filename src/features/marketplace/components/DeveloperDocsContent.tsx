import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import type { ProjectDeveloperSnapshot } from '@/lib/project-developer'

interface DeveloperDocsContentProps {
  snapshot: ProjectDeveloperSnapshot
}

export function DeveloperDocsContent({ snapshot }: DeveloperDocsContentProps) {
  const featureModules = snapshot.modules.filter((module) => module.type === 'feature').slice(0, 8)
  const platformPages = snapshot.modules.filter((module) => module.type === 'platform-page').slice(0, 8)
  const plugins = snapshot.modules.filter((module) => module.type === 'plugin').slice(0, 8)
  const docs = snapshot.modules.filter((module) => module.type === 'doc').slice(0, 8)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit">Developer Portal</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Project developer docs</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              This page reflects the current MDM repository structure, the marketplace plugin workflow,
              the downloadable starter bundle, and the single HTTP MCP endpoint for project-aware tooling.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={snapshot.endpoints.pluginStarterDownload}
            className={buttonVariants({ variant: 'default', size: 'default' })}
          >
            Download starter
          </Link>
          <Link
            href={snapshot.endpoints.swagger}
            className={buttonVariants({ variant: 'outline', size: 'default' })}
          >
            Open Swagger
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Feature Modules" value={snapshot.counts.features} />
        <SummaryCard title="Platform Pages" value={snapshot.counts.platformPages} />
        <SummaryCard title="Hub Plugins" value={snapshot.counts.plugins} />
        <SummaryCard title="Docs Files" value={snapshot.counts.docs} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MCP and marketplace workflow</CardTitle>
            <CardDescription>
              One HTTP endpoint exposes read/update/delete marketplace tooling, while the starter bundle seeds new plugin work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="font-medium">HTTP MCP endpoint</p>
              <code className="mt-2 block overflow-x-auto text-xs">{snapshot.endpoints.mcp}</code>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="font-medium">Developer docs route</p>
              <code className="mt-2 block overflow-x-auto text-xs">{snapshot.endpoints.developerDocs}</code>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="font-medium">Starter bundle download</p>
              <code className="mt-2 block overflow-x-auto text-xs">{snapshot.endpoints.pluginStarterDownload}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Useful project scripts</CardTitle>
            <CardDescription>
              Pulled from the current repository package scripts so this page stays aligned with the real workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.scripts.slice(0, 10).map((script) => (
              <div key={script.name} className="rounded-xl border bg-muted/30 p-3">
                <div className="text-sm font-medium">{script.name}</div>
                <code className="mt-1 block overflow-x-auto text-xs text-muted-foreground">{script.command}</code>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ModuleList title="Feature modules" items={featureModules} />
        <ModuleList title="Platform pages" items={platformPages} />
        <ModuleList title="Plugin hub modules" items={plugins} />
        <ModuleList title="Project docs" items={docs} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture notes</CardTitle>
          <CardDescription>
            These notes are curated from the repository conventions and the current developer snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {snapshot.architecture.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ModuleList({
  title,
  items,
}: {
  title: string
  items: ProjectDeveloperSnapshot['modules']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <code className="text-xs text-muted-foreground">{item.path}</code>
                </div>
                {item.fileCount !== undefined && (
                  <Badge variant="secondary">{item.fileCount} files</Badge>
                )}
              </div>
              {item.notes && <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
