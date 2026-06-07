'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { Activity, Calendar } from 'lucide-react'

interface AttributeActivityTabProps {
  activityData: any[]
  loadingActivity: boolean
}

export function AttributeActivityTab({ activityData, loadingActivity }: AttributeActivityTabProps) {
  return (          <TabsContent value="activity" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attribute Activity</CardTitle>
                  <CardDescription>
                    Track changes and usage of this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      {loadingActivity ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-muted-foreground">Loading activity...</div>
                        </div>
                      ) : activityData.length > 0 ? (
                        <div className="space-y-1">
                          {activityData.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded">
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{activity.action}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.user}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {activity.details}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(activity.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No activity recorded for this attribute</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
  )
}

