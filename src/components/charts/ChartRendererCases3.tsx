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

export function renderChartCases3(ctx: any) {
  const { ct, commonProps, processedData, data, dimensions, measures, filters, config, chartType, type, handleDataPointClick, formatLabelWithType, formatNumber, getAttributeStyle } = ctx
  switch (ct) {
      case 'FUNNEL':
        {
          const funnelData = (data && data.length ? data : [
            { stage: 'Visitors', value: 1000 },
            { stage: 'Signups', value: 600 },
            { stage: 'Trials', value: 300 },
            { stage: 'Customers', value: 120 }
          ]) as any[]
          const max = Math.max(...funnelData.map(d => Number(d[measures[0] || 'value'])))
          return (
            <div className="w-full h-full p-6">
              <div className="flex flex-col gap-4">
                {funnelData.map((d, i) => {
                  const v = Number(d[measures[0] || 'value'])
                  const pct = max > 0 ? (v / max) : 0
                  return (
                    <div key={i} className="w-full">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1" style={{ fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.tickFontSize ?? 12) + 'px', color: config?.xAxis?.tickColor || '#6b7280' }}>
                        <span>{formatLabelWithType(String(d[dimensions[0] || 'stage']), 'x')}</span>
                        <span>{formatNumber(v, measures[0], 'y')}</span>
                      </div>
                      <div className="h-8 bg-muted rounded">
                        <div className="h-8 rounded bg-blue-500 transition-all" style={{ width: `${Math.max(8, Math.round(pct * 100))}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

      case 'WATERFALL':
        {
          const wData = (data && data.length ? data : [
            { name: 'Start', value: 1000 },
            { name: 'Revenue', value: 400 },
            { name: 'Costs', value: -300 },
            { name: 'Other', value: 200 },
            { name: 'End', value: 1300 }
          ]) as any[]
          let running = 0
          const transformed = wData.map((d: any, i: number) => {
            const v = Number(d[measures[0] || 'value'])
            const prev = running
            running += v
            const start = v >= 0 ? prev : prev + v
            const end = v >= 0 ? prev + v : prev
            return { ...d, start, end }
          })
          const minY = Math.min(0, ...transformed.map(d => d.start), ...transformed.map(d => d.end))
          const maxY = Math.max(...transformed.map(d => d.start), ...transformed.map(d => d.end))
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformed} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                  <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
                )}
                <XAxis
                  dataKey={dimensions[0] || 'name'}
                  hide={config?.xAxis?.show === false}
                  tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                  tickFormatter={(value) => formatLabelWithType(String(value), 'x')}
                  label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || dimensions[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
                />
                <YAxis
                  domain={[minY, maxY]}
                  hide={config?.yAxis?.show === false}
                  tick={{ fontSize: config?.yAxis?.tickFontSize ?? 12, fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.yAxis?.tickColor }}
                  tickFormatter={(value) => formatNumber(value, measures[0], 'y')}
                  label={config?.yAxis?.title ? { value: formatLabelWithType(config?.yAxis?.title || measures[0] || '', 'y'), angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor } } : undefined}
                />
                <Tooltip
                  contentStyle={{ fontFamily: config?.tooltip?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.tooltip?.fontSize ?? 12) + 'px' }}
                  formatter={(value: any, name: string) => [formatNumber(value, name, 'y'), formatLabelWithType(name, 'y')]}
                  labelFormatter={(label) => formatLabelWithType(String(label), 'x')}
                />
                {(config?.legend?.show ?? config?.showLegend ?? true) && (
                  <Legend
                    wrapperStyle={{ fontFamily: config?.legend?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.legend?.fontSize ?? 12) + 'px', color: config?.legend?.color }}
                    formatter={(value) => formatLabelWithType(value, 'y')}
                  />
                )}
                <Bar dataKey="start" stackId="a" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="diff" stackId="a" fill="#60a5fa">
                  {transformed.map((d: any, i: number) => (
                    <Cell key={i} fill={d.end >= d.start ? '#60a5fa' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }

      case 'BOX_PLOT':
        {
          // Expect data as array of { group, min, q1, median, q3, max }
          const bData = (data && data.length ? data : [
            { group: 'A', min: 10, q1: 20, median: 35, q3: 50, max: 70 },
            { group: 'B', min: 5, q1: 15, median: 25, q3: 45, max: 60 }
          ]) as any[]
          const groups = bData.map(d => d[dimensions[0] || 'group'])
          const minVal = Math.min(...bData.map(d => d.min))
          const maxVal = Math.max(...bData.map(d => d.max))
          return (
            <div className="w-full h-full p-4">
              <svg viewBox={`0 0 ${groups.length * 100} 100`} className="w-full h-full">
                {bData.map((d, i) => {
                  const x = i * 100 + 50
                  const scale = (v: number) => 90 - ((v - minVal) / Math.max(1, maxVal - minVal)) * 80
                  const yMin = scale(d.min)
                  const yQ1 = scale(d.q1)
                  const yMed = scale(d.median)
                  const yQ3 = scale(d.q3)
                  const yMax = scale(d.max)
                  return (
                    <g key={i}>
                      {/* Whiskers */}
                      <line x1={x} y1={yMax} x2={x} y2={yQ3} stroke="#94a3b8" strokeWidth={2} />
                      <line x1={x} y1={yMin} x2={x} y2={yQ1} stroke="#94a3b8" strokeWidth={2} />
                      {/* Box */}
                      <rect x={x - 20} y={yQ3} width={40} height={Math.max(2, yQ1 - yQ3)} fill="#93c5fd" stroke="#60a5fa" />
                      {/* Median */}
                      <line x1={x - 20} y1={yMed} x2={x + 20} y2={yMed} stroke="#1d4ed8" strokeWidth={2} />
                      {/* Caps */}
                      <line x1={x - 10} y1={yMax} x2={x + 10} y2={yMax} stroke="#94a3b8" strokeWidth={2} />
                      <line x1={x - 10} y1={yMin} x2={x + 10} y2={yMin} stroke="#94a3b8" strokeWidth={2} />
                      {/* Label */}
                      <text x={x} y={98} textAnchor="middle" fontSize={config?.xAxis?.tickFontSize ?? 8} fill={config?.xAxis?.tickColor || '#64748b'} style={{ fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif' }}>{formatLabelWithType(String(d[dimensions[0] || 'group']), 'x')}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )
        }

      case 'CHOROPLETH':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Choropleth Map</div>
              <div className="text-sm text-muted-foreground">Choropleth map visualization not yet implemented</div>
            </div>
          </div>
        )

      case 'BUBBLE_MAP':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Bubble Map</div>
              <div className="text-sm text-muted-foreground">Bubble map visualization not yet implemented</div>
            </div>
          </div>
        )

      case 'HORIZONTAL_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps} layout="horizontal">
              {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
              )}
              <XAxis
                type="number"
                hide={config?.xAxis?.show === false}
                tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                tickFormatter={(value) => formatNumber(value, measures[0], 'x')}
                label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || measures[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
              />
              <YAxis
                dataKey={dimensions[0] || 'name'}
                type="category"
                width={80}
                hide={config?.yAxis?.show === false}
                tick={{ fontSize: config?.yAxis?.tickFontSize ?? 12, fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.yAxis?.tickColor }}
                tickFormatter={(value) => formatLabelWithType(String(value), 'y')}
                label={config?.yAxis?.title ? { value: formatLabelWithType(config?.yAxis?.title || dimensions[0] || '', 'y'), angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor } } : undefined}
              />
              <Tooltip
                contentStyle={{ fontFamily: config?.tooltip?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.tooltip?.fontSize ?? 12) + 'px' }}
                formatter={(value: any, name: string) => [formatNumber(value, name, 'x'), formatLabelWithType(name, 'x')]}
                labelFormatter={(label) => formatLabelWithType(String(label), 'y')}
              />
              {(config?.legend?.show ?? config?.showLegend ?? true) && (
                <Legend
                  wrapperStyle={{ fontFamily: config?.legend?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.legend?.fontSize ?? 12) + 'px', color: config?.legend?.color }}
                  formatter={(value) => formatLabelWithType(value, 'x')}
                />
              )}
              {measures.map((measure, index) => {
                const style = getAttributeStyle(measure, 'x')
                return (
                  <Bar
                    key={measure}
                    dataKey={measure}
                    fill={style.valueColor || COLORS[index % COLORS.length]}
                    onClick={handleDataPointClick}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        )


      case 'HEATMAP': {
        // Expect grid-like data [{x: 'A', y: '1', value: 10}, ...]
        const src = (data && data.length ? data : [
          { x: 'A', y: '1', value: 10 }, { x: 'B', y: '1', value: 20 }, { x: 'C', y: '1', value: 5 },
          { x: 'A', y: '2', value: 12 }, { x: 'B', y: '2', value: 8 }, { x: 'C', y: '2', value: 18 },
          { x: 'A', y: '3', value: 3 }, { x: 'B', y: '3', value: 9 }, { x: 'C', y: '3', value: 22 }
        ]) as any[]
        const xs = Array.from(new Set(src.map(d => d[dimensions[0] || 'x'])))
        const ys = Array.from(new Set(src.map(d => d[dimensions[1] || 'y'])))
        const maxV = Math.max(...src.map(d => Number(d[measures[0] || 'value'])))
        const cellW = 100 / Math.max(1, xs.length)
        const cellH = 100 / Math.max(1, ys.length)
        const colorFor = (v: number) => {
          const t = maxV > 0 ? v / maxV : 0
          const r = Math.round(255 * t)
          const g = Math.round(140 * (1 - t))
          const b = 200 - Math.round(200 * t)
          return `rgb(${r},${g},${b})`
        }
        return (
          <div className="w-full h-full p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {ys.map((yVal, yi) => (
                xs.map((xVal, xi) => {
                  const rec = src.find(d => d[dimensions[0] || 'x'] === xVal && d[dimensions[1] || 'y'] === yVal)
                  const v = Number(rec ? rec[measures[0] || 'value'] : 0)
                  return (
                    <rect key={`${xi}-${yi}`} x={xi * cellW + 2} y={yi * cellH + 2} width={cellW - 4} height={cellH - 4} fill={colorFor(v)} rx={2} />
                  )
                })
              ))}
            </svg>
          </div>
        )
      }

      case 'TREEMAP': {
        const treeData = (data && data.length ? data : [
          { name: 'A', size: 400 }, { name: 'B', size: 300 }, { name: 'C', size: 200 }, { name: 'D', size: 100 }
        ]) as any[]
        const treemapData = [{ name: 'root', children: treeData.map(d => ({ name: d[dimensions[0] || 'name'] || d.name, size: Number(d[measures[0] || 'size'] || d.size) })) }]
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ReTreemap data={treemapData} dataKey="size" nameKey="name" stroke="#fff" fill="#60a5fa" />
          </ResponsiveContainer>
        )
      }

      case 'BUBBLE_MAP': {
        // Plot bubbles on a normalized 2D plane from -180..180 (lng) and -90..90 (lat)
        const src = (data && data.length ? data : [
          { name: 'A', lat: 37, lng: -122, value: 30 },
          { name: 'B', lat: 51.5, lng: 0, value: 20 },
          { name: 'C', lat: 13.7, lng: 100.5, value: 25 }
        ]) as any[]
        const latKey = dimensions[0] || 'lat'
        const lngKey = dimensions[1] || 'lng'
        const valKey = measures[0] || 'value'
        const maxV = Math.max(...src.map(d => Number(d[valKey])))
        const rFor = (v: number) => 4 + 16 * (maxV > 0 ? v / maxV : 0)
        const xFor = (lng: number) => ((lng + 180) / 360) * 100
        const yFor = (lat: number) => (100 - ((lat + 90) / 180) * 100)
        return (
          <div className="w-full h-full p-2">
            <div className="text-[10px] text-muted-foreground mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>Projected plane (not geo-accurate)</div>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="0" y="0" width="100" height="100" fill="#f8fafc" stroke="#e5e7eb" />
              {src.map((d, i) => {
                const cx = xFor(Number(d[lngKey]))
                const cy = yFor(Number(d[latKey]))
                const r = rFor(Number(d[valKey]))
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={r} fill="rgba(59,130,246,0.35)" stroke="#1e40af" />
                    <title>{`${d.name || ''}\n${valKey}: ${d[valKey]}`}</title>
                  </g>
                )
              })}
            </svg>
          </div>
        )
      }

      case 'CHOROPLETH': {
        // Simple region grid choropleth
        const src = (data && data.length ? data : [
          { region: 'North', value: 30 }, { region: 'South', value: 15 }, { region: 'East', value: 22 }, { region: 'West', value: 10 }
        ]) as any[]
        const regKey = dimensions[0] || 'region'
        const valKey = measures[0] || 'value'
        const regs = src.map(d => String(d[regKey]))
        const maxV = Math.max(...src.map(d => Number(d[valKey])))
        const colorFor = (v: number) => {
          const t = maxV > 0 ? v / maxV : 0
          const r = 240 - Math.round(120 * t)
          const g = 249 - Math.round(150 * t)
          const b = 255 - Math.round(200 * t)
          return `rgb(${r},${g},${b})`
        }
        const layout = [
          ['North', 'East'],
          ['West', 'South']
        ]
        const cellW = 50, cellH = 50
        return (
          <div className="w-full h-full p-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {layout.map((row, ri) => row.map((name, ci) => {
                const rec = src.find(d => String(d[regKey]).toLowerCase() === name.toLowerCase())
                const v = Number(rec ? rec[valKey] : 0)
                return (
                  <g key={`${ri}-${ci}`}>
                    <rect x={ci * cellW} y={ri * cellH} width={cellW} height={cellH} fill={colorFor(v)} stroke="#e5e7eb" />
                    <text x={ci * cellW + 25} y={ri * cellH + 28} textAnchor="middle" fontSize={8} fill="#334155" style={{ fontFamily: 'Roboto, sans-serif' }}>{name}</text>
                  </g>
                )
              }))}
            </svg>
          </div>
        )
      }

  }
  return null
}
