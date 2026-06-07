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

export function renderChartCases1(ctx: any) {
  const { ct, commonProps, processedData, data, dimensions, measures, filters, config, chartType, type, handleDataPointClick, formatLabelWithType, formatNumber, getAttributeStyle } = ctx
  switch (ct) {

      case 'STACKED_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
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
                hide={config?.yAxis?.show === false}
                domain={config?.yAxis?.min !== undefined || config?.yAxis?.max !== undefined
                  ? [config?.yAxis?.min ?? 'dataMin', config?.yAxis?.max ?? 'dataMax']
                  : undefined}
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
              {measures.map((m, i) => {
                const style = getAttributeStyle(m, 'y')
                return (
                  <Bar key={m} dataKey={m} stackId="a" fill={style.valueColor || COLORS[i % COLORS.length]} />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'GROUPED_BAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
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
                hide={config?.yAxis?.show === false}
                domain={config?.yAxis?.min !== undefined || config?.yAxis?.max !== undefined
                  ? [config?.yAxis?.min ?? 'dataMin', config?.yAxis?.max ?? 'dataMax']
                  : undefined}
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
              {measures.map((m, i) => {
                const style = getAttributeStyle(m, 'y')
                return (
                  <Bar key={m} dataKey={m} fill={style.valueColor || COLORS[i % COLORS.length]} />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'COMPOSED':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart {...commonProps}>
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
                hide={config?.yAxis?.show === false}
                domain={config?.yAxis?.min !== undefined || config?.yAxis?.max !== undefined
                  ? [config?.yAxis?.min ?? 'dataMin', config?.yAxis?.max ?? 'dataMax']
                  : undefined}
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
              {measures[0] && (() => {
                const style = getAttributeStyle(measures[0], 'y')
                return <Bar dataKey={measures[0]} fill={(config?.series?.[measures[0]]?.color) || style.valueColor || COLORS[0]} barSize={config?.series?.[measures[0]]?.barSize} />
              })()}
              {measures[1] && (() => {
                const style = getAttributeStyle(measures[1], 'y')
                return <Line dataKey={measures[1]} stroke={(config?.series?.[measures[1]]?.color) || style.valueColor || COLORS[1]} strokeWidth={config?.series?.[measures[1]]?.strokeWidth || 2} dot={config?.series?.[measures[1]]?.showDots === false ? false : { r: config?.series?.[measures[1]]?.dotRadius || 4 }} />
              })()}
              {measures[2] && (() => {
                const style = getAttributeStyle(measures[2], 'y')
                return <Area dataKey={measures[2]} fill={(config?.series?.[measures[2]]?.color) || style.valueColor || COLORS[2]} stroke={(config?.series?.[measures[2]]?.color) || style.valueColor || COLORS[2]} fillOpacity={config?.series?.[measures[2]]?.fillOpacity || 0.5} />
              })()}
            </ComposedChart>
          </ResponsiveContainer>
        )

      case 'BAR':
        // Get colors from attribute style settings
        const getMeasureColor = (measure: string, index: number): string => {
          const style = getAttributeStyle(measure, 'y')
          return style.valueColor || COLORS[index % COLORS.length]
        }

        return (
          <div className="w-full h-full bg-background overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart {...commonProps} layout={config?.bar?.orientation === 'horizontal' ? 'horizontal' : undefined}>
                {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                  <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
                )}
                {config?.bar?.orientation === 'horizontal' ? (
                  <>
                    <XAxis
                      type="number"
                      hide={config?.xAxis?.show === false}
                      tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                      tickFormatter={(value) => formatNumber(value, measures[0], 'y')}
                      label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || measures[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
                    />
                    <YAxis
                      type="category"
                      dataKey={dimensions[0] || 'name'}
                      hide={config?.yAxis?.show === false}
                      tick={{ fontSize: config?.yAxis?.tickFontSize ?? 12, fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.yAxis?.tickColor }}
                      tickFormatter={(value) => formatLabelWithType(value, 'x')}
                      label={config?.yAxis?.title ? { value: formatLabelWithType(config?.yAxis?.title || dimensions[0] || '', 'x'), angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor, textAnchor: 'middle' } } : undefined}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey={dimensions[0] || 'name'}
                      hide={config?.xAxis?.show === false}
                      tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                      tickFormatter={(value) => formatLabelWithType(value, 'x')}
                      label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || dimensions[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
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
                      tickFormatter={(value) => formatNumber(value, measures[0], 'y')}
                      label={config?.yAxis?.title ? { value: formatLabelWithType(config?.yAxis?.title || measures[0] || '', 'y'), angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor } } : undefined}
                    />
                  </>
                )}
                <Tooltip
                  contentStyle={{ fontFamily: config?.tooltip?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.tooltip?.fontSize ?? 12) + 'px' }}
                  formatter={(value: any, name: string) => [formatNumber(value, name, 'y'), formatLabelWithType(name, 'y')]}
                  labelFormatter={(label) => formatLabelWithType(String(label), 'x')}
                />
                {(config?.legend?.show ?? config?.showLegend ?? true) && (
                  <Legend
                    wrapperStyle={{ fontFamily: config?.legend?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.legend?.fontSize ?? 12) + 'px', color: config?.legend?.color }}
                    formatter={(value) => formatLabelWithType(value, 'y')}
                    verticalAlign={(config?.legend?.position === 'top' || config?.legend?.position === 'bottom') ? config?.legend?.position : 'top'}
                    align={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? config?.legend?.position : 'center'}
                    layout={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? 'vertical' : 'horizontal'}
                  />
                )}
                {measures.map((measure, index) => {
                  const style = getAttributeStyle(measure, 'y')
                  return (
                    <Bar
                      key={measure}
                      dataKey={measure}
                      fill={(config?.series?.[measure]?.color) || style.valueColor || COLORS[index % COLORS.length]}
                      barSize={config?.series?.[measure]?.barSize}
                      stackId={config?.bar?.mode === 'stacked' ? 'a' : undefined}
                      onClick={handleDataPointClick}
                    />
                  )
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case 'LINE':
        return (
          <div className="w-full h-full bg-background overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart {...commonProps}>
                {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                  <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
                )}
                <XAxis
                  dataKey={dimensions[0] || 'name'}
                  hide={config?.xAxis?.show === false}
                  tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                  tickFormatter={(value) => formatLabelWithType(value, 'x')}
                  label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || dimensions[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
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
                    verticalAlign={(config?.legend?.position === 'top' || config?.legend?.position === 'bottom') ? config?.legend?.position : 'top'}
                    align={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? config?.legend?.position : 'center'}
                    layout={(config?.legend?.position === 'left' || config?.legend?.position === 'right') ? 'vertical' : 'horizontal'}
                  />
                )}
                {measures.map((measure, index) => {
                  const style = getAttributeStyle(measure, 'y')
                  return (
                    <Line
                      key={measure}
                      type={(config?.line?.curve === 'linear') ? 'linear' : 'monotone'}
                      dataKey={measure}
                      stroke={(config?.series?.[measure]?.color) || style.valueColor || COLORS[index % COLORS.length]}
                      strokeWidth={config?.series?.[measure]?.strokeWidth || 2}
                      dot={config?.series?.[measure]?.showDots === false ? false : { r: config?.series?.[measure]?.dotRadius || 4 }}
                      onClick={(e: any) => {/* noop or custom */ }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )

      case 'PIE':
      case 'DONUT':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={config?.dataLabels?.showLine ?? false}
                label={config?.dataLabels?.show !== false ? ({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%` : false}
                outerRadius={config?.pie?.outerRadius || 80}
                innerRadius={config?.pie?.innerRadius ?? (chartType === 'DONUT' ? 40 : 0)}
                fill="#8884d8"
                dataKey={measures[0] || 'value'}
                onClick={(e: any) => {/* noop or custom */ }}
              >
                {data.map((entry, index) => {
                  const measure = measures[0] || 'value'
                  const style = getAttributeStyle(measure, 'y')
                  const seriesColor = config?.series?.[measure]?.color
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={seriesColor || style.valueColor || (config?.series?.colors?.[index]) || COLORS[index % COLORS.length]}
                    />
                  )
                })}
              </Pie>
              <Tooltip formatter={(value: any) => formatNumber(value, measures[0], 'y')} />
              {config?.legend?.show !== false && (
                <Legend
                  formatter={(value) => formatLabelWithType(value, 'x')}
                  fontSize={config?.legend?.fontSize ?? 12}
                  fontFamily={config?.legend?.fontFamily ?? 'Roboto, sans-serif'}
                  wrapperStyle={{ color: config?.legend?.color || '#111827' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )

  }
  return null
}
