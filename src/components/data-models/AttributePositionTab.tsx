'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { TabsContent } from '@/components/ui/tabs'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

interface AttributePositionTabProps {
  attribute: any
  allAttributes: any[]
  canMoveUp: boolean
  canMoveDown: boolean
  moveAttribute: (direction: 'up' | 'down') => void
}

export function AttributePositionTab({ attribute, allAttributes, canMoveUp, canMoveDown, moveAttribute }: AttributePositionTabProps) {
  return (          <TabsContent value="position" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attribute Position</CardTitle>
                  <CardDescription>
                    Reorder attributes to change their display order in forms and tables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{attribute.display_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Current position: {attribute.order}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveAttribute('up')}
                          disabled={!canMoveUp}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveAttribute('down')}
                          disabled={!canMoveDown}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">All Attributes Order</h4>
                      <ScrollableList maxHeight="MEDIUM">
                        {allAttributes
                          .sort((a, b) => a.order - b.order)
                          .map((attr, index) => (
                            <div
                              key={attr.id}
                              className={`flex items-center gap-3 p-3 border border-border rounded-lg ${attr.id === attribute.id ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                                }`}
                            >
                              <div className="text-sm text-muted-foreground w-8">
                                {index + 1}
                              </div>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{attr.display_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {attr.name} • {attr.type}
                                </div>
                              </div>
                              {attr.id === attribute.id && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                          ))}
                      </ScrollableList>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

  )
}

