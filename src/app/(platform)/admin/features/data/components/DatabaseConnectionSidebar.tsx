// @ts-nocheck
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Database, Filter, Lock, Plus, RefreshCw, Server } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DatabaseConnectionSidebar(props: any) {
  const { connections, selectedDatabase, setSelectedDatabase, isLoadingDatabases, spaces, selectedSpaceFilter, setSelectedSpaceFilter, loadConnections, setShowAddConnection, primaryColor, bodyText, uiBorder, panelBg, panelBackdrop, borderRadius, borderColor, borderWidth, getDatabaseIcon, getStatusIcon } = props

  return (
    <>
        {/* Left Panel - Database List */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          {/* Precise Panel */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius,
              borderColor,
              borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: bodyText }}
                >
                  Databases
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConnections}
                    disabled={isLoadingDatabases}
                    className="h-7 w-7 p-0 rounded-lg transition-all"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isLoadingDatabases && "animate-spin")} />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddConnection(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Space Filter */}
              <Select value={selectedSpaceFilter || 'all'} onValueChange={(v) => setSelectedSpaceFilter(v === 'all' ? null : v)}>
                <SelectTrigger className="w-full h-8 text-xs border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <SelectValue placeholder="All Spaces" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>All Spaces</span>
                    </div>
                  </SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p
                className="text-xs mt-2"
                style={{ color: bodyText, opacity: 0.6 }}
              >
                {connections.length + 1} connection{connections.length !== 0 ? 's' : ''} (1 built-in)
              </p>
            </div>

            {/* Database List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {/* Built-in Database - Always first */}
                {(selectedSpaceFilter === null || selectedSpaceFilter === '__system__') && (
                  <button
                    onClick={() => setSelectedDatabase('__builtin__')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 text-left mb-2",
                      selectedDatabase === '__builtin__' && "shadow-lg"
                    )}
                    style={{
                      backgroundColor: selectedDatabase === '__builtin__'
                        ? `color-mix(in srgb, ${primaryColor} 6%, transparent)`
                        : 'transparent',
                      border: selectedDatabase === '__builtin__'
                        ? `${borderWidth} solid color-mix(in srgb, ${primaryColor} 15%, transparent)`
                        : `${borderWidth} solid color-mix(in srgb, ${primaryColor} 8%, transparent)`,
                      borderRadius,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDatabase !== '__builtin__') {
                        e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDatabase !== '__builtin__') {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <div className="flex-shrink-0 relative">
                      <Server className="h-4 w-4" style={{ color: primaryColor }} />
                      <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: selectedDatabase === '__builtin__' ? primaryColor : bodyText
                          }}
                        >
                          Built-in Database
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          System
                        </Badge>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        PostgreSQL • localhost:5432
                      </div>
                    </div>
                  </button>
                )}

                {/* Separator */}
                {(selectedSpaceFilter === null || selectedSpaceFilter === '__system__') && connections.length > 0 && (
                  <div className="flex items-center gap-2 py-2 px-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">External</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {isLoadingDatabases ? (
                  <div
                    className="flex flex-col items-center justify-center py-12"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                    <p className="text-sm">Loading databases...</p>
                  </div>
                ) : (
                  connections
                    .filter(conn => selectedSpaceFilter === null || conn.spaceId === selectedSpaceFilter)
                    .map(connection => {
                      const isSelected = selectedDatabase === connection.id
                      return (
                        <button
                          key={connection.id}
                          onClick={() => setSelectedDatabase(connection.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 text-left",
                            isSelected && "shadow-lg"
                          )}
                          style={{
                            backgroundColor: isSelected
                              ? `color-mix(in srgb, ${primaryColor} 6%, transparent)`
                              : 'transparent',
                            border: isSelected
                              ? `${borderWidth} solid color-mix(in srgb, ${primaryColor} 15%, transparent)`
                              : 'none',
                            borderRadius,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div className="flex-shrink-0">
                            {getDatabaseIcon(connection.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-sm font-medium truncate"
                                style={{
                                  color: isSelected ? primaryColor : bodyText
                                }}
                              >
                                {connection.name}
                              </span>
                              {connection.spaceName && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                  {connection.spaceName}
                                </Badge>
                              )}
                              {getStatusIcon(connection.status)}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: bodyText, opacity: 0.6 }}
                            >
                              {connection.host}:{connection.port}
                            </div>
                          </div>
                        </button>
                      )
                    })
                )}

                {/* Empty state for external connections */}
                {!isLoadingDatabases && connections.filter(conn => selectedSpaceFilter === null || conn.spaceId === selectedSpaceFilter).length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-8"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <Database className="h-8 w-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No external databases</p>
                    <p className="text-xs mt-1">Click "Add" to connect one</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
    </>
  )
}
