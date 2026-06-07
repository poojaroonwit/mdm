// @ts-nocheck
'use client'

import React from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar, Treemap as ReTreemap, ComposedChart } from 'recharts'
import { Filter, BarChart3 as LBarChart3, LineChart as LLineChart, PieChart as LPieChart, Table as LTable, AreaChart as LAreaChart } from 'lucide-react'
import { Star as StarIcon, Heart, Home, User, Settings as SettingsIcon, Bell, CheckCircle, AlertTriangle, Camera, Cloud, Folder, Mail, Phone, Play as PlayIcon, Pause as PauseIcon, Search as SearchIcon, Plus as PlusIcon, Minus as MinusIcon, X as XIcon, Check as CheckIcon } from 'lucide-react'
import DOMPurify from 'dompurify'
import { getTableColumns, hasValidTableColumns } from './chartUtils'
import { DEFAULT_CHART_COLORS } from '@/lib/chart-utils'

const COLORS = DEFAULT_CHART_COLORS

export function renderChartCases4(ctx: any) {
  const { ct, commonProps, processedData, data, dimensions, measures, filters, config, chartType, type, handleDataPointClick, formatLabelWithType, formatNumber, getAttributeStyle } = ctx
  switch (ct) {
      case 'PIVOT_TABLE':
        {
          // Simple pivot by first dimension, sum first measure
          const dim = dimensions[0] || 'category'
          const meas = measures[0] || 'value'
          const source = (data && data.length ? data : [
            { [dim]: 'A', [meas]: 10 },
            { [dim]: 'B', [meas]: 20 },
            { [dim]: 'A', [meas]: 15 },
            { [dim]: 'B', [meas]: 5 },
            { [dim]: 'C', [meas]: 12 },
          ]) as any[]
          const groups: Record<string, number> = {}
          source.forEach(r => { groups[r[dim]] = (groups[r[dim]] || 0) + Number(r[meas] || 0) })
          const rows = Object.entries(groups).map(([k, v]) => ({ [dim]: k, [meas]: v }))
          return (
            <div className="w-full h-full bg-background overflow-hidden">
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>{dim}</th>
                      <th className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>{meas}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-sm text-foreground" style={{ fontFamily: 'Roboto, sans-serif' }}>{String(r[dim])}</td>
                        <td className="p-3 text-sm text-foreground" style={{ fontFamily: 'Roboto, sans-serif' }}>{String(r[meas])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

      case 'TABLE':
        // For table charts, use common function to get selected columns
        // measures contains the columns (from chartDimensions.columns) - required
        // dimensions contains the rows (from chartDimensions.rows) - optional, but should also be shown as columns
        const columns = getTableColumns(measures, dimensions)

        // If no columns selected, show empty state
        if (!hasValidTableColumns(columns)) {
          return (
            <div className="w-full h-full bg-background flex items-center justify-center p-4">
              <div className="text-center text-sm text-muted-foreground">
                No columns selected. Please configure columns in chart settings.
              </div>
            </div>
          )
        }

        return (
          <div className="w-full h-full bg-background overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted">
                    {columns.map((col, index) => (
                      <th key={index} className="text-left p-3 font-medium text-xs text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'Roboto, sans-serif' }}>
                        {col.charAt(0).toUpperCase() + col.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-muted/50 transition-colors">
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="p-3 text-sm text-foreground" style={{ fontFamily: 'Roboto, sans-serif' }}>
                          {col === 'growth' ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${(row as any)[col]?.startsWith('+') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              }`}>
                              {(row as any)[col]}
                            </span>
                          ) : (
                            (row as any)[col] !== undefined ? String((row as any)[col]) : '-'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {processedData.length > 100 && (
                <div className="text-xs text-muted-foreground p-3 text-center border-t border-border" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Showing first 100 rows of {processedData.length} total
                </div>
              )}
            </div>
          </div>
        )

      case 'AREA':
        return (
          <div className="w-full h-full bg-background overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart {...commonProps}>
                {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                  <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
                )}
                <XAxis
                  dataKey={dimensions[0] || 'name'}
                  hide={config?.xAxis?.show === false}
                  tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                  label={config?.xAxis?.title ? { value: config?.xAxis?.title, position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
                />
                <YAxis
                  hide={config?.yAxis?.show === false}
                  domain={config?.yAxis?.min !== undefined || config?.yAxis?.max !== undefined
                    ? [config?.yAxis?.min ?? 'dataMin', config?.yAxis?.max ?? 'dataMax']
                    : undefined}
                  tick={{
                    fontSize: config?.yAxis?.tickFontSize ?? 12,
                    fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif',
                    fill: config?.yAxis?.tickColor
                  }}
                  tickFormatter={(value) => formatNumber(value)}
                  label={config?.yAxis?.title ? { value: config?.yAxis?.title, angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor } } : undefined}
                />
                <Tooltip
                  contentStyle={{ fontFamily: config?.tooltip?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.tooltip?.fontSize ?? 12) + 'px' }}
                  formatter={(value: any) => formatNumber(value)}
                />
                {(config?.legend?.show ?? config?.showLegend ?? true) && (
                  <Legend
                    wrapperStyle={{ fontFamily: config?.legend?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.legend?.fontSize ?? 12) + 'px', color: config?.legend?.color }}
                    formatter={(value) => formatLabelWithType(value)}
                    verticalAlign={(config?.legend?.position === 'top' || config?.legend?.position === 'bottom') ? config?.legend?.position : 'top'}
                    align={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? config?.legend?.position : 'center'}
                    layout={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? 'vertical' : 'horizontal'}
                  />
                )}
                {measures.map((measure, index) => (
                  <Area
                    key={measure}
                    type={(config?.line?.curve === 'linear') ? 'linear' : 'monotone'}
                    dataKey={measure}
                    stackId="1"
                    stroke={(config?.series?.[measure]?.color) || COLORS[index % COLORS.length]}
                    fill={(config?.series?.[measure]?.color) || COLORS[index % COLORS.length]}
                    fillOpacity={config?.series?.[measure]?.fillOpacity || 0.6}
                    onClick={(e: any) => {/* noop or custom */ }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )

      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dimensions[0] || 'x'} />
              <YAxis dataKey={dimensions[1] || 'y'} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                dataKey={measures[0] || 'value'}
                fill={COLORS[0]}
                onClick={handleDataPointClick}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'RADAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={dimensions[0] || 'subject'} />
              <PolarRadiusAxis />
              {measures.map((measure, index) => (
                <Radar
                  key={measure}
                  name={measure}
                  dataKey={measure}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'GAUGE':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
              <RadialBar
                dataKey={measures[0] || 'value'}
                cornerRadius={10}
                fill={COLORS[0]}
              />
              <Tooltip
                contentStyle={{ fontFamily: config?.tooltip?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.tooltip?.fontSize ?? 12) + 'px' }}
                formatter={(value: any, name: string) => [formatNumber(value, name, 'y'), formatLabelWithType(name, 'y')]}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium">{chartType} Chart</div>
              <div className="text-sm">Chart type not implemented yet</div>
            </div>
          </div>
        )
    
  }
  return null
}
