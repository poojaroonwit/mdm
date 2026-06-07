// @ts-nocheck
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { TabsContent } from '@/components/ui/tabs'
import { BookOpen, Bot, Eye, Search, Ticket } from 'lucide-react'

export function ProjectToolsTabs(props: any) {
  const { project } = props

  return (
    <>
            {/* Tools & Agents Tab */}
            <TabsContent value="tools" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Notebooks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Notebooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.notebooks && project.notebooks.length > 0 ? (
                      <div className="space-y-2">
                        {project.notebooks.map((nb) => (
                          <div key={nb.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{nb.notebook?.name}</span>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No notebooks</p>
                    )}
                  </CardContent>
                </Card>

                {/* AI Agents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.chatbots && project.chatbots.length > 0 ? (
                      <div className="space-y-2">
                        {project.chatbots.map((cb) => (
                          <div key={cb.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{cb.chatbot?.name}</span>
                            <StatusBadge status={cb.chatbot?.isPublished ? 'published' : 'draft'} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No AI agents</p>
                    )}
                  </CardContent>
                </Card>

                {/* Queries */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Queries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.queries && project.queries.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {project.queries.map((q) => (
                          <div key={q.id} className="flex items-center gap-2 p-2 border rounded">
                            <Badge variant="outline">{q.queryType}</Badge>
                            <span className="text-sm truncate">{q.queryName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No queries</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Project Tickets</CardTitle>
                  <CardDescription>All tickets associated with this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.tickets && project.tickets.length > 0 ? (
                    <div className="space-y-2">
                      {project.tickets.map((ticket: any) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ticket.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{ticket.priority}</Badge>
                            <Badge>{ticket.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tickets yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

    </>
  )
}
