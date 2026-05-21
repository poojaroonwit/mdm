'use client'

import { PluginDefinition } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface PluginCardProps {
  plugin: PluginDefinition
  onInstall: () => void
  onUninstall?: () => void
  onManageInstallation?: () => void
  onEditPlugin?: () => void
  onDeletePlugin?: () => void
  installing?: boolean
  installed?: boolean
  isAdmin?: boolean
}

export function PluginCard({
  plugin,
  onInstall,
  onUninstall,
  onManageInstallation,
  onEditPlugin,
  onDeletePlugin,
  installing = false,
  installed = false,
  isAdmin = false,
}: PluginCardProps) {
  const isCompliance = plugin.isCompliance || !!plugin.securityAudit
  return (
    <Card className={`hover:shadow-md transition-shadow ${isCompliance ? 'card-compliance' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{plugin.category}</Badge>
              {isCompliance && (
                <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-400 hover:bg-emerald-50">
                  Compliance
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              {plugin.verified && (
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription>{plugin.description}</CardDescription>
          </div>
        </div>
        {plugin.rating && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <span>{plugin.rating.toFixed(1)}</span>
            {plugin.reviewCount && plugin.reviewCount > 0 && (
              <span className="text-xs">({plugin.reviewCount})</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            {isAdmin && onEditPlugin && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditPlugin()
                }}
              >
                Edit
              </Button>
            )}
            {plugin.documentationUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(plugin.documentationUrl, '_blank')
                }}
              >
                Docs
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`http://localhost:3001/plugins/${plugin.slug}`, '_blank')
              }}
              title="View Details"
            >
              Details
            </Button>
            {installed ? (
              <>
                {onManageInstallation && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onManageInstallation()
                    }}
                    disabled={installing}
                  >
                    Manage
                  </Button>
                )}
                {onUninstall ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUninstall()
                    }}
                    disabled={installing}
                  >
                    {installing ? 'Uninstalling...' : 'Uninstall'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="cursor-default bg-muted text-muted-foreground"
                  >
                    Installed
                  </Button>
                )}
              </>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onInstall()
                }}
                disabled={installing}
              >
                {installing ? 'Installing...' : 'Install'}
              </Button>
            )}
            {isAdmin && onDeletePlugin && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePlugin()
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

