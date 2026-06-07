// @ts-nocheck
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, ChevronRight, Flag, GitBranch, HardDrive, Link as LinkIcon } from 'lucide-react'
import { PROJECT_STATUSES, ProjectStatus } from '@/lib/project-types'

export function ProjectOverviewTab(props: any) {
  const { project, editMode, formData, setFormData, setActiveTab } = props

  return (
    <>
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 h-full">
              <div className="grid grid-cols-3 gap-4">
                {/* Main Info */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      {editMode ? (
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description || 'No description'}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        {editMode ? (
                          <Select
                            value={formData.status}
                            onValueChange={(v) => setFormData({ ...formData, status: v as ProjectStatus })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="mt-1">
                            {PROJECT_STATUSES.find(s => s.value === project.status)?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <Label>Created By</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.creator?.avatar} />
                            <AvatarFallback>{project.creator?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{project.creator?.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>End Date</Label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Team Members</span>
                          <Badge variant="secondary">{project.members?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tickets</span>
                          <Badge variant="secondary">{project._count?.tickets || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Milestones</span>
                          <Badge variant="secondary">{project._count?.milestones || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Assets</span>
                          <Badge variant="secondary">{project.assets?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Data Models</span>
                          <Badge variant="secondary">{project.dataModels?.length || 0}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.tickets && project.tickets.length > 0 ? (
                        <div className="space-y-2">
                          {project.tickets.slice(0, 5).map((ticket: any) => (
                            <div key={ticket.id} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1">{ticket.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {ticket.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tickets yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Links Preview */}
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Quick Links</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('links')}>
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {(project.links || []).slice(0, 4).map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          {link.type === 'git_repository' && <GitBranch className="h-4 w-4" />}
                          {link.type === 'shared_drive' && <HardDrive className="h-4 w-4" />}
                          {link.type === 'documentation' && <BookOpen className="h-4 w-4" />}
                          {!['git_repository', 'shared_drive', 'documentation'].includes(link.type) && <LinkIcon className="h-4 w-4" />}
                          <span className="text-sm truncate">{link.name}</span>
                        </a>
                      ))}
                      {(!project.links || project.links.length === 0) && (
                        <p className="text-sm text-muted-foreground col-span-4">No links added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.milestones && project.milestones.length > 0 ? (
                      <div className="space-y-2">
                        {project.milestones.slice(0, 3).map((milestone: any) => (
                          <div key={milestone.id} className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm flex-1 truncate">{milestone.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {milestone.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No milestones</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
    </>
  )
}
