'use client'

import { PluginDefinition } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Download, ExternalLink, CheckCircle2, Trash2, Info, ShieldCheck } from 'lucide-react'

export interface PluginCardProps {
  plugin: PluginDefinition
  onInstall: () => void
  onUninstall?: () => void
  installing?: boolean
  installed?: boolean
}

export function PluginCard({ plugin, onInstall, onUninstall, installing = false, installed = false }: PluginCardProps) {
  const isCompliance = plugin.isCompliance || !!plugin.securityAudit
  return (
    <Card
      className="hover:shadow-md transition-shadow"
      style={isCompliance ? { borderColor: '#10b981', borderWidth: '2px', boxShadow: '0 0 0 1px #10b98133' } : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{plugin.category}</Badge>
              {isCompliance && (
                <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-400 hover:bg-emerald-50">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Compliance
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              {plugin.verified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription>{plugin.description}</CardDescription>
          </div>
        </div>
        {plugin.rating && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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
            {plugin.documentationUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(plugin.documentationUrl, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4" />
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
              <Info className="h-4 w-4" />
            </Button>
            {installed ? (
              onUninstall ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUninstall()
                  }}
                  disabled={installing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {installing ? 'Uninstalling...' : 'Uninstall'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                  className="cursor-default bg-muted text-muted-foreground"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Installed
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onInstall()
                }}
                disabled={installing}
              >
                <Download className="mr-2 h-4 w-4" />
                {installing ? 'Installing...' : 'Install'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

