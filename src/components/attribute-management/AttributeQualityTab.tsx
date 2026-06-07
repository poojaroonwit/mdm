import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface AttributeQualityTabProps {
  loadingQuality: boolean
  qualityStats: any
}

export function AttributeQualityTab({ loadingQuality, qualityStats }: AttributeQualityTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Statistics</CardTitle>
          <CardDescription>
            Overview of data quality metrics for this attribute
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQuality ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading quality statistics...</div>
            </div>
          ) : qualityStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900">
                    {qualityStats.statistics.totalRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900">
                    {qualityStats.statistics.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900">
                    {qualityStats.statistics.uniqueCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Unique Values</div>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <div className="text-2xl font-semibold text-gray-900">
                    {qualityStats.statistics.recentChanges}
                  </div>
                  <div className="text-sm text-gray-600">Recent Changes</div>
                </div>
              </div>

              {qualityStats.qualityIssues && qualityStats.qualityIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Quality Issues</h4>
                  <div className="space-y-1">
                    {qualityStats.qualityIssues.map((issue: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-border rounded text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${issue.severity === 'error'
                            ? 'bg-red-500'
                            : issue.severity === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`} />
                          <span className="text-gray-700">{issue.message}</span>
                        </div>
                        <span className="text-gray-500">{issue.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Non-null values</div>
                    <div className="font-medium">{qualityStats.statistics.nonNullCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Missing values</div>
                    <div className="font-medium">{qualityStats.statistics.missingValues.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Data type</div>
                    <div className="font-medium">{qualityStats.attribute.type}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No quality data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
