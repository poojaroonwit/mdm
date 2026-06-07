'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { PROJECT_DEVELOPER_DOCS_ROUTE, PROJECT_MCP_ENDPOINT, PROJECT_PLUGIN_TEMPLATE_ROUTE } from '@/lib/project-developer'
import type { PluginCategory, PluginDefinition } from '../types'

interface MarketplaceDeveloperToolkitProps {
  isAdmin: boolean
  onRefresh: () => void
}

export function MarketplaceDeveloperToolkit({ isAdmin, onRefresh }: MarketplaceDeveloperToolkitProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground">
            Discover and install plugins to extend functionality
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh}>
              Fetch Updates
            </Button>
          </div>
        )}
      </div>      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Plugin developer toolkit</CardTitle>
            <CardDescription>
              Build marketplace plugins with the new HTTP MCP endpoint, live project docs, and a downloadable starter bundle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">HTTP MCP</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_MCP_ENDPOINT}</code>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">Developer docs</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_DEVELOPER_DOCS_ROUTE}</code>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-medium">Starter bundle</p>
                <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">{PROJECT_PLUGIN_TEMPLATE_ROUTE}</code>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={PROJECT_PLUGIN_TEMPLATE_ROUTE}
                className={buttonVariants({ variant: 'default', size: 'default' })}
              >
                Download starter
              </Link>
              <Link
                href={PROJECT_DEVELOPER_DOCS_ROUTE}
                className={buttonVariants({ variant: 'outline', size: 'default' })}
              >
                Open developer docs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MCP tools</CardTitle>
            <CardDescription>
              One endpoint now handles project-module reads plus marketplace read, update, and delete actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>`list_project_modules` and `read_project_module` map the repo.</p>
            <p>`get_plugin`, `update_plugin`, and `delete_plugin` manage plugin records.</p>
            <p>`get_installation`, `update_installation`, and `delete_installation` manage installs.</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

interface MarketplaceFiltersProps {
  categories: Array<{ value: PluginCategory | 'all'; label: string; icon: any }>
  complianceFilter: boolean
  plugins: PluginDefinition[]
  searchQuery: string
  selectedCategory: PluginCategory | 'all'
  selectedSpaceId: string
  setComplianceFilter: React.Dispatch<React.SetStateAction<boolean>>
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: PluginCategory | 'all') => void
  setSelectedSpaceId: (spaceId: string) => void
  showSpaceSelector: boolean
}

export function MarketplaceFilters({
  categories,
  complianceFilter,
  plugins,
  searchQuery,
  selectedCategory,
  selectedSpaceId,
  setComplianceFilter,
  setSearchQuery,
  setSelectedCategory,
  setSelectedSpaceId,
  showSpaceSelector,
}: MarketplaceFiltersProps) {
  return (
    <>      {/* Categories Section */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          // Count plugins in this category
          const categoryCount = cat.value === 'all'
            ? plugins.length
            : plugins.filter(p => p.category === cat.value).length

          // Don't show categories with no plugins (except "All Categories")
          if (cat.value !== 'all' && categoryCount === 0) {
            return null
          }

          const isSelected = selectedCategory === cat.value
          return (
            <Badge
              key={cat.value}
              variant={isSelected ? 'default' : 'outline'}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.preventDefault()
                setSelectedCategory(cat.value as PluginCategory | 'all')
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedCategory(cat.value as PluginCategory | 'all')
                }
              }}
            >
              {cat.label}
              {categoryCount > 0 && (
                <Badge
                  variant={isSelected ? 'secondary' : 'default'}
                  className="ml-2 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    minWidth: categoryCount < 10 ? '20px' : '24px',
                    width: categoryCount < 10 ? '20px' : 'auto',
                    padding: categoryCount < 10 ? '0' : '0 6px'
                  }}
                >
                  {categoryCount}
                </Badge>
              )}
            </Badge>
          )
        })}
      </div>

      {/* Compliance Filter Tag */}
      <div className="flex items-center gap-2">
        <Badge
          variant={complianceFilter ? 'default' : 'outline'}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all ${
            complianceFilter
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'text-emerald-700 border-emerald-400 hover:bg-emerald-50'
          }`}
          onClick={() => setComplianceFilter((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setComplianceFilter((v) => !v)
            }
          }}
        >
          Is Compliance
        </Badge>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 flex-wrap">
        {showSpaceSelector && (
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[200px]"
            showAllOption={true}
          />
        )}

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  )
}