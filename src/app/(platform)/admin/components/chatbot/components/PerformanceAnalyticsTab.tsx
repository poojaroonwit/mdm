'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Download, Loader2, RefreshCw, TrendingDown, TrendingUp as TrendingUpIcon } from 'lucide-react'

interface PerformanceAnalyticsTabProps {
  costForecast: any
  costStats: any
  forecastLoading: boolean
  statsLoading: boolean
  exportCostData: (format: 'json' | 'csv') => void
  loadCostForecast: () => void
  loadCostStats: () => void
}

export function PerformanceAnalyticsTab({
  costForecast,
  costStats,
  forecastLoading,
  statsLoading,
  exportCostData,
  loadCostForecast,
  loadCostStats
}: PerformanceAnalyticsTabProps) {
  return (
    <>
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analytics</CardTitle>
                <CardDescription>
                  View spending statistics and trends for this chatbot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : costStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="text-2xl font-bold">${costStats.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                        <div className="text-2xl font-bold">{costStats.totalRequests}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Average Cost</div>
                        <div className="text-2xl font-bold">${costStats.averageCost.toFixed(4)}</div>
                      </div>
                    </div>

                    {Object.keys(costStats.costByModel || {}).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by Model</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByModel).map(([model, cost]: [string, any]) => (
                            <div key={model} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{model}</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {costStats.costByUser && Object.keys(costStats.costByUser).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by User</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByUser).map(([userId, cost]: [string, any]) => (
                            <div key={userId} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{userId.substring(0, 8)}...</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {costStats.costByThread && Object.keys(costStats.costByThread).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by Thread</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByThread).map(([threadId, cost]: [string, any]) => (
                            <div key={threadId} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{threadId.substring(0, 12)}...</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={loadCostStats} variant="outline" disabled={statsLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Stats
                      </Button>
                      <Button onClick={() => exportCostData('csv')} variant="outline" disabled={statsLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={() => exportCostData('json')} variant="outline" disabled={statsLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>

                    {/* Cost Forecast Section */}
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg font-semibold">Cost Forecast (Next 30 Days)</Label>
                        <Button onClick={loadCostForecast} variant="outline" size="sm" disabled={forecastLoading}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${forecastLoading ? 'animate-spin' : ''}`} />
                          Refresh Forecast
                        </Button>
                      </div>
                      {forecastLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : costForecast ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                              <div className="text-sm text-muted-foreground">Forecasted Cost</div>
                              <div className="text-2xl font-bold">${costForecast.forecastedCost.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ${costForecast.forecastedDailyAverage.toFixed(2)}/day average
                              </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="text-sm text-muted-foreground">Trend</div>
                              <div className="flex items-center gap-2 mt-1">
                                {costForecast.trend === 'increasing' && <TrendingUpIcon className="h-5 w-5 text-red-500" />}
                                {costForecast.trend === 'decreasing' && <TrendingDown className="h-5 w-5 text-green-500" />}
                                {costForecast.trend === 'stable' && <BarChart3 className="h-5 w-5 text-muted-foreground" />}
                                <span className="text-lg font-semibold capitalize">{costForecast.trend}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Confidence: {(costForecast.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          {costForecast.historicalData && costForecast.historicalData.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Based on {costForecast.historicalData.length} days of historical data
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>No forecast data available. Need at least 2 days of cost data.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No cost data available yet. Start using the chatbot to see statistics.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observability Tab */}
    </>
  )
}
