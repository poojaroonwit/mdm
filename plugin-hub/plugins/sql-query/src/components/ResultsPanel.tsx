'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, History, BarChart3, Download, AlertCircle, ChevronDown, FileText, BarChart } from 'lucide-react'
import { QueryHistory } from './QueryHistory'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { EnhancedResultsTable } from './EnhancedResultsTable'
import { ValidationPanel } from './ValidationPanel'
import { ChartControls } from './ChartControls'
import { ResultStatisticsPanel } from './ResultStatisticsPanel'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface ResultsPanelProps {
  showFooter: boolean
  footerHeight: number
  isResizing: boolean
  footerTab: 'results' | 'history' | 'visualization' | 'validation' | 'statistics'
  onFooterTabChange: (tab: 'results' | 'history' | 'visualization' | 'validation' | 'statistics') => void
  currentResult: QueryResult | null
  queryHistory: QueryResult[]
  onLoadQuery: (query: string) => void
  onToggleBookmark: (queryId: string) => void
  isBookmarked: (queryId: string) => boolean
  getStatusIcon: (status: string) => React.ReactNode
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
  onMouseDown: (e: React.MouseEvent) => void
  setFooterHeight: (height: number) => void
  validation?: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  onJumpToLine?: (line: number, column?: number) => void
}

export function ResultsPanel({
  showFooter,
  footerHeight,
  isResizing,
  footerTab,
  onFooterTabChange,
  currentResult,
  queryHistory,
  onLoadQuery,
  onToggleBookmark,
  isBookmarked,
  getStatusIcon,
  formatDuration,
  formatBytes,
  onMouseDown,
  setFooterHeight,
  validation,
  onJumpToLine
}: ResultsPanelProps) {
  const [chartType, setChartType] = useState<string>('BAR')
  const [chartConfig, setChartConfig] = useState({
    dimensions: [] as string[],
    measures: [] as string[],
    title: 'Query Results Visualization'
  })
  
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportResults = (format: 'csv' | 'json' | 'excel' | 'pdf' = 'csv') => {
    if (!currentResult?.results.length) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `query-results-${timestamp}`

    switch (format) {
      case 'csv':
        const csv = [
          currentResult.columns.join(','),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `"${row[col] || ''}"`).join(',')
          )
        ].join('\n')
        downloadFile(csv, `${filename}.csv`, 'text/csv')
        break

      case 'json':
        const json = JSON.stringify({
          columns: currentResult.columns,
          data: currentResult.results,
          metadata: {
            totalRows: currentResult.results.length,
            exportedAt: new Date().toISOString(),
            query: currentResult.query
          }
        }, null, 2)
        downloadFile(json, `${filename}.json`, 'application/json')
        break

      case 'excel':
        const excelCsv = [
          currentResult.columns.join('\t'),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `${row[col] || ''}`).join('\t')
          )
        ].join('\n')
        downloadFile(excelCsv, `${filename}.xls`, 'application/vnd.ms-excel')
        break

      case 'pdf':
        const pdfContent = `Query Results\n\nQuery: ${currentResult.query}\n\nExported: ${new Date().toLocaleString()}\n\n${currentResult.columns.join('\t')}\n${currentResult.results.map(row => currentResult.columns.map(col => row[col] || '').join('\t')).join('\n')}`
        downloadFile(pdfContent, `${filename}.txt`, 'text/plain')
        break
    }
  }

  const prepareChartData = () => {
    if (!currentResult?.results.length) return []
    
    return currentResult.results.map((row, index) => ({
      ...row,
      index: index + 1
    }))
  }

  const getAvailableColumns = () => {
    if (!currentResult?.columns) return []
    return currentResult.columns
  }

  const getNumericColumns = () => {
    if (!currentResult?.results.length) return []
    
    const numericColumns: string[] = []
    const firstRow = currentResult.results[0]
    
    currentResult.columns.forEach(column => {
      const value = firstRow[column]
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        numericColumns.push(column)
      }
    })
    
    return numericColumns
  }

  if (!showFooter) return null

  return (
    <div 
      className={`bg-background border-t border-border text-foreground flex flex-col ${
        isResizing ? '' : 'transition-all duration-200 ease-in-out'
      }`}
      style={{ 
        height: `${footerHeight}px`,
        minHeight: '150px',
        maxHeight: '80vh',
        willChange: isResizing ? 'height' : 'auto',
        flexShrink: 0
      }}
      data-footer="true"
    >
      {/* Resize Handle */}
      <div 
        className={`h-3 cursor-ns-resize relative group border-t border-border z-10 ${
          isResizing 
            ? 'bg-blue-500' 
            : 'bg-muted hover:bg-blue-400 transition-colors'
        }`}
        onMouseDown={onMouseDown}
        title="Drag to resize footer height"
        style={{
          willChange: isResizing ? 'background-color' : 'auto'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-background' 
                : 'bg-muted-foreground/60 group-hover:bg-blue-600'
            }`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-background' 
                : 'bg-muted-foreground/60 group-hover:bg-blue-600'
            }`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-background' 
                : 'bg-muted-foreground/60 group-hover:bg-blue-600'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-4">
          <Tabs value={footerTab} onValueChange={(value) => onFooterTabChange(value as any)}>
            <TabsList className="flex gap-1">
              <TabsTrigger value="results" className="flex items-center gap-2 px-3 py-1 text-sm">
                <Table className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 px-3 py-1 text-sm">
                <History className="h-4 w-4" />
                Query history
              </TabsTrigger>
              <TabsTrigger value="visualization" className="flex items-center gap-2 px-3 py-1 text-sm">
                <BarChart3 className="h-4 w-4" />
                Visualization
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2 px-3 py-1 text-sm">
                <AlertCircle className="h-4 w-4" />
                Validation
                {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {validation.errors.length + validation.warnings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2 px-3 py-1 text-sm">
                <BarChart className="h-4 w-4" />
                Statistics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          {currentResult && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentResult.results.length} rows</span>
              {currentResult.executionTime && (
                <span>• {formatDuration(currentResult.executionTime)}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Height: {Math.round(footerHeight)}px</span>
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(200)}
                title="Small (200px)"
              >
                S
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(400)}
                title="Medium (400px)"
              >
                M
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(600)}
                title="Large (600px)"
              >
                L
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {footerTab === 'results' && (
          currentResult ? (
            <EnhancedResultsTable
              currentResult={currentResult}
              formatDuration={formatDuration}
              formatBytes={formatBytes}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <Table className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2 text-gray-700">No Results</h3>
                <p className="text-sm text-muted-foreground">Run a query to see results here</p>
              </div>
            </div>
          )
        )}
        {footerTab === 'history' && (
          <QueryHistory
            queryHistory={queryHistory}
            onLoadQuery={onLoadQuery}
            onToggleBookmark={onToggleBookmark}
            isBookmarked={isBookmarked}
            getStatusIcon={getStatusIcon}
            formatDuration={formatDuration}
            formatBytes={formatBytes}
          />
        )}
        {footerTab === 'visualization' && currentResult && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b">
              <ChartControls
                chartType={chartType}
                chartConfig={chartConfig}
                availableColumns={getAvailableColumns()}
                numericColumns={getNumericColumns()}
                onChartTypeChange={setChartType}
                onDimensionChange={(dim) => setChartConfig(prev => ({ ...prev, dimensions: [dim] }))}
                onMeasureChange={(meas) => setChartConfig(prev => ({ ...prev, measures: [...prev.measures, meas] }))}
              />
            </div>
            <div className="flex-1 p-4">
              <ChartRenderer
                data={prepareChartData()}
                chartType={chartType}
                config={chartConfig}
                type={chartType}
                dimensions={chartConfig.dimensions}
                measures={chartConfig.measures}
                filters={[]}
                title={chartConfig.title}
              />
            </div>
          </div>
        )}
        {footerTab === 'validation' && validation && (
          <div className="h-full p-4">
            <ValidationPanel
              validation={validation}
              onJumpToLine={onJumpToLine}
              isVisible={true}
              onClose={() => {}}
            />
          </div>
        )}
        {footerTab === 'statistics' && currentResult && (
          <div className="h-full p-4">
            <ResultStatisticsPanel
              currentResult={currentResult}
              isOpen={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
