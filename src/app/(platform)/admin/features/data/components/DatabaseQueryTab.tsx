import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Play, RefreshCw } from 'lucide-react'

interface DatabaseQueryTabProps {
  isExecuting: boolean
  query: string
  queryResult: any[]
  onClear: () => void
  onExecute: () => void
  onQueryChange: (query: string) => void
}

export function DatabaseQueryTab({
  isExecuting,
  query,
  queryResult,
  onClear,
  onExecute,
  onQueryChange
}: DatabaseQueryTabProps) {
  return (
    <>
      <h3 className="text-lg font-semibold">Query Editor</h3>
      <Card>
        <CardHeader>
          <CardTitle>Execute SQL Query</CardTitle>
          <CardDescription>Run custom SQL queries against your database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sql-query">SQL Query</Label>
            <Textarea
              id="sql-query"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="SELECT * FROM users WHERE created_at > '2024-01-01';"
              rows={6}
              className="font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onExecute} disabled={!query.trim() || isExecuting}>
              {isExecuting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {queryResult.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              {queryResult.length} rows returned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(queryResult[0] || {}).map((key) => (
                        <th key={key} className="text-left p-2 font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.slice(0, 100).map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  )
}
