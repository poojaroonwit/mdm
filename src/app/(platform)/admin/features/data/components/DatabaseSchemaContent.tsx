// @ts-nocheck
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, LayoutGrid, LayoutList, Rows3, Table } from 'lucide-react'

export function DatabaseSchemaContent(props: any) {
  const { selectedDatabase, isLoadingSchema, databaseSchema, bodyText, schemaDisplayMode, setSchemaDisplayMode, primaryColor, uiBg, borderColor, borderWidth, borderRadius, openDetailDrawer } = props

  return (
                // Database Schema View
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {!selectedDatabase ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Select a database</p>
                        <p className="text-xs mt-1">Choose a database from the left panel to view its schema</p>
                      </div>
                    ) : isLoadingSchema ? (
                      <div className="w-full space-y-3 p-4">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    ) : !databaseSchema ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No schema data</p>
                      </div>
                    ) : databaseSchema.tables.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No tables found</p>
                      </div>
                    ) : (
                      <>
                        {/* Schema View Header with Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: bodyText }}>
                              {databaseSchema.tables.length} Tables
                            </span>
                          </div>
                          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                            <Button
                              variant={schemaDisplayMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('grid')}
                              title="Grid View"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={schemaDisplayMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('list')}
                              title="List View"
                            >
                              <LayoutList className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={schemaDisplayMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSchemaDisplayMode('table')}
                              title="Table View"
                            >
                              <Rows3 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Grid View */}
                        {schemaDisplayMode === 'grid' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {databaseSchema.tables.map(table => (
                              <div
                                key={table.name}
                                className="p-4 transition-all border cursor-pointer hover:shadow-md group"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                                  borderColor,
                                  borderWidth,
                                  borderRadius,
                                  borderStyle: 'solid',
                                }}
                                onClick={() => openDetailDrawer({
                                  type: 'table',
                                  id: table.name,
                                  name: table.name,
                                  description: `${table.columns.length} columns`
                                })}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div
                                    className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                                    style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
                                  >
                                    <Table className="h-5 w-5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3
                                      className="font-semibold text-sm font-mono truncate"
                                      style={{ color: bodyText }}
                                    >
                                      {table.name}
                                    </h3>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: primaryColor }}>
                                      {table.columns.length}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      Columns
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: bodyText }}>~</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Records</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <div className="text-lg font-semibold" style={{ color: bodyText }}>~</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Size</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* List View */}
                        {schemaDisplayMode === 'list' && (
                          <div className="space-y-2">
                            {databaseSchema.tables.map(table => (
                              <div
                                key={table.name}
                                className="flex items-center gap-4 p-3 transition-all border cursor-pointer hover:shadow-lg group"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                                  borderColor,
                                  borderWidth,
                                  borderRadius,
                                  borderStyle: 'solid',
                                }}
                                onClick={() => openDetailDrawer({
                                  type: 'table',
                                  id: table.name,
                                  name: table.name,
                                  description: `${table.columns.length} columns`
                                })}
                              >
                                <div
                                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                                  style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
                                >
                                  <Table className="h-4 w-4" style={{ color: primaryColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono font-medium text-sm" style={{ color: bodyText }}>
                                    {table.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">{table.columns.length} cols</Badge>
                                <Badge variant="secondary" className="text-xs">~ rows</Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Table View */}
                        {schemaDisplayMode === 'table' && (
                          <div className="border rounded-lg overflow-hidden" style={{ borderColor }}>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b" style={{ borderColor }}>
                                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Table Name</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Columns</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Records</th>
                                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Size</th>
                                </tr>
                              </thead>
                              <tbody>
                                {databaseSchema.tables.map(table => (
                                  <tr
                                    key={table.name}
                                    className="border-b last:border-0 cursor-pointer hover:bg-primary/5 transition-colors"
                                    style={{ borderColor }}
                                    onClick={() => openDetailDrawer({
                                      type: 'table',
                                      id: table.name,
                                      name: table.name,
                                      description: `${table.columns.length} columns`
                                    })}
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <Table className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                                        <span className="font-mono font-medium" style={{ color: bodyText }}>{table.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <Badge variant="outline">{table.columns.length}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-center text-muted-foreground">~</td>
                                    <td className="py-3 px-4 text-center text-muted-foreground">~</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>

  )
}
