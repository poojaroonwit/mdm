// @ts-nocheck
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TabsContent } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddAssetDialog, AddDataModelDialog, AddLinkDialog, AddMemberDialog } from '@/components/projects/project-detail-dialogs'
import { ASSET_TYPES, LINK_TYPES, PROJECT_ROLES } from '@/lib/project-types'
import { Box, BookOpen, Database, ExternalLink, GitBranch, HardDrive, Link as LinkIcon, MoreVertical, Plus, Server, Trash2, Users } from 'lucide-react'

export function ProjectResourcesTabs(props: any) {
  const {
    project,
    addMemberOpen,
    setAddMemberOpen,
    handleAddMember,
    handleUpdateMemberRole,
    handleRemoveMember,
    addLinkOpen,
    setAddLinkOpen,
    handleAddLink,
    handleRemoveLink,
    addAssetOpen,
    setAddAssetOpen,
    handleAddAsset,
    addDataModelOpen,
    setAddDataModelOpen,
    handleAddDataModel,
    handleRemoveDataModel,
    spaceId,
  } = props

  return (
    <>
            {/* Members Tab */}
            <TabsContent value="members" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage project team members and their roles</CardDescription>
                  </div>
                  <AddMemberDialog
                    open={addMemberOpen}
                    onOpenChange={setAddMemberOpen}
                    onAdd={handleAddMember}
                  />
                </CardHeader>
                <CardContent>
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-3">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.user?.avatar} />
                              <AvatarFallback>{member.user?.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {PROJECT_ROLES.find(r => r.value === member.role)?.label || member.role}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {PROJECT_ROLES.map((roleOption) => (
                                  <DropdownMenuItem
                                    key={roleOption.value}
                                    onClick={() => handleUpdateMemberRole(member.id, roleOption.value)}
                                  >
                                    Set as {roleOption.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No team members added yet</p>
                      <Button className="mt-4" onClick={() => setAddMemberOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Links & Repositories</CardTitle>
                    <CardDescription>Git repos, shared drives, documentation, and other links</CardDescription>
                  </div>
                  <AddLinkDialog
                    open={addLinkOpen}
                    onOpenChange={setAddLinkOpen}
                    onAdd={handleAddLink}
                  />
                </CardHeader>
                <CardContent>
                  {project.links && project.links.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {project.links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg group">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {link.type === 'git_repository' && <GitBranch className="h-5 w-5" />}
                              {link.type === 'shared_drive' && <HardDrive className="h-5 w-5" />}
                              {link.type === 'documentation' && <BookOpen className="h-5 w-5" />}
                              {!['git_repository', 'shared_drive', 'documentation'].includes(link.type) && <LinkIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{link.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {LINK_TYPES.find(t => t.value === link.type)?.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No links added yet</p>
                      <Button className="mt-4" onClick={() => setAddLinkOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Infrastructure Assets</CardTitle>
                    <CardDescription>VMs, containers, services, and other infrastructure</CardDescription>
                  </div>
                  <AddAssetDialog
                    open={addAssetOpen}
                    onOpenChange={setAddAssetOpen}
                    onAdd={handleAddAsset}
                  />
                </CardHeader>
                <CardContent>
                  {project.assets && project.assets.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {project.assets.map((asset) => (
                        <div key={asset.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {asset.assetType === 'vm' && <Server className="h-5 w-5" />}
                              {asset.assetType === 'container' && <Box className="h-5 w-5" />}
                              {asset.assetType === 'storage' && <HardDrive className="h-5 w-5" />}
                              {asset.assetType === 'database' && <Database className="h-5 w-5" />}
                              {!['vm', 'container', 'storage', 'database'].includes(asset.assetType) && <Server className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{asset.assetName}</p>
                              <Badge variant="outline" className="text-xs">
                                {ASSET_TYPES.find(t => t.value === asset.assetType)?.label}
                              </Badge>
                            </div>
                          </div>
                          {asset.assetDescription && (
                            <p className="text-sm text-muted-foreground">{asset.assetDescription}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assets linked yet</p>
                      <Button className="mt-4" onClick={() => setAddAssetOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Models Tab */}
            <TabsContent value="data" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Data Models & Tables</CardTitle>
                    <CardDescription>Associated data models and database tables</CardDescription>
                  </div>
                  <Button onClick={() => setAddDataModelOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Link Data Model
                  </Button>
                </CardHeader>
                <CardContent>
                  {project.dataModels && project.dataModels.length > 0 ? (
                    <div className="space-y-4">
                      {project.dataModels.map((dm) => (
                        <div key={dm.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Database className="h-5 w-5 text-purple-600" />
                            </div>
                          <div>
                              <p className="font-medium">{dm.dataModel?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {dm.dataModel?.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{dm.relationship}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDataModel(dm.dataModelId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No data models linked yet</p>
                      <Button className="mt-4" onClick={() => setAddDataModelOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Link Data Model
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <AddDataModelDialog
                open={addDataModelOpen}
                onOpenChange={setAddDataModelOpen}
                onAdd={handleAddDataModel}
                spaceId={spaceId || project.spaceId}
                linkedDataModelIds={(project.dataModels || []).map((item) => item.dataModelId)}
              />
            </TabsContent>


    </>
  )
}
