import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ComponentDataSourceConfigProps {
  config: any
  handleConfigUpdate: (key: string, value: any) => void
}

export function ComponentDataSourceConfig({ config, handleConfigUpdate }: ComponentDataSourceConfigProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="data-source">Data Source</Label>
        <Select
          value={config.dataSource || 'none'}
          onValueChange={(value) => handleConfigUpdate('dataSource', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Data Source</SelectItem>
            <SelectItem value="api">API Endpoint</SelectItem>
            <SelectItem value="database">Database Query</SelectItem>
            <SelectItem value="file">File Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.dataSource === 'api' && (
        <div>
          <Label htmlFor="api-url">API URL</Label>
          <Input
            id="api-url"
            value={config.apiUrl || ''}
            onChange={(e) => handleConfigUpdate('apiUrl', e.target.value)}
            placeholder="https://api.example.com/data"
          />
        </div>
      )}

      {config.dataSource === 'database' && (
        <div>
          <Label htmlFor="db-query">Database Query</Label>
          <Textarea
            id="db-query"
            value={config.dbQuery || ''}
            onChange={(e) => handleConfigUpdate('dbQuery', e.target.value)}
            placeholder="SELECT * FROM table_name"
            rows={3}
          />
        </div>
      )}

      <div>
        <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
        <Input
          id="refresh-interval"
          type="number"
          value={config.refreshInterval || 0}
          onChange={(e) => handleConfigUpdate('refreshInterval', parseInt(e.target.value) || 0)}
          placeholder="0 for no auto-refresh"
        />
      </div>

      <div>
        <Label>Filters</Label>
        <div className="space-y-2">
          {config.filters?.map((filter: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={filter.field}
                onChange={(e) => {
                  const newFilters = [...(config.filters || [])]
                  newFilters[index] = { ...filter, field: e.target.value }
                  handleConfigUpdate('filters', newFilters)
                }}
                placeholder="Field name"
              />
              <Select
                value={filter.operator}
                onValueChange={(value) => {
                  const newFilters = [...(config.filters || [])]
                  newFilters[index] = { ...filter, operator: value }
                  handleConfigUpdate('filters', newFilters)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater">Greater</SelectItem>
                  <SelectItem value="less">Less</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={filter.value}
                onChange={(e) => {
                  const newFilters = [...(config.filters || [])]
                  newFilters[index] = { ...filter, value: e.target.value }
                  handleConfigUpdate('filters', newFilters)
                }}
                placeholder="Value"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newFilters = (config.filters || []).filter((_: any, i: number) => i !== index)
                  handleConfigUpdate('filters', newFilters)
                }}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newFilters = [...(config.filters || []), { field: '', operator: 'equals', value: '' }]
              handleConfigUpdate('filters', newFilters)
            }}
          >
            Add Filter
          </Button>
        </div>
      </div>
    </div>
  )
}
