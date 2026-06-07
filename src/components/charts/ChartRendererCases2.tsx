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

export function renderChartCases2(ctx: any) {
  const { ct, commonProps, processedData, data, dimensions, measures, filters, config, chartType, type, handleDataPointClick, formatLabelWithType, formatNumber, getAttributeStyle } = ctx
  switch (ct) {
      case 'SCATTER':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              {(config?.xAxis?.showGrid ?? config?.showGrid ?? true) && (
                <CartesianGrid strokeDasharray={config?.grid?.dash ?? '3 3'} stroke={config?.grid?.color ?? '#f0f0f0'} />
              )}
              <XAxis
                dataKey={config?.xKey || dimensions[0] || 'x'}
                hide={config?.xAxis?.show === false}
                tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
                tickFormatter={(value) => formatLabelWithType(String(value), 'x')}
                label={config?.xAxis?.title ? { value: formatLabelWithType(config?.xAxis?.title || dimensions[0] || '', 'x'), position: 'insideBottom', offset: -5, style: { fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.xAxis?.titleFontSize ?? 12) + 'px', fill: config?.xAxis?.titleColor } } : undefined}
              />
              <YAxis
                dataKey={config?.yKey || measures[0] || 'y'}
                hide={config?.yAxis?.show === false}
                tick={{ fontSize: config?.yAxis?.tickFontSize ?? 12, fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.yAxis?.tickColor }}
                tickFormatter={(value) => formatNumber(value, measures[0], 'y')}
                label={config?.yAxis?.title ? { value: formatLabelWithType(config?.yAxis?.title || measures[0] || '', 'y'), angle: -90, position: 'insideLeft', style: { fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.yAxis?.titleFontSize ?? 12) + 'px', fill: config?.yAxis?.titleColor } } : undefined}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
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
              <Scatter name={title} data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'RADAR':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey={config?.angleKey || dimensions[0] || 'name'}
                tick={{ fontSize: config?.xAxis?.tickFontSize ?? 12, fontFamily: config?.xAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.xAxis?.tickColor }}
              />
              <PolarRadiusAxis
                tick={{ fontSize: config?.yAxis?.tickFontSize ?? 12, fontFamily: config?.yAxis?.fontFamily ?? 'Roboto, sans-serif', fill: config?.yAxis?.tickColor }}
                tickFormatter={(value) => formatNumber(value, measures[0], 'y')}
              />
              <Radar
                name={title}
                dataKey={config?.valueKey || measures[0] || 'value'}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              {(config?.legend?.show ?? config?.showLegend ?? true) && (
                <Legend
                  wrapperStyle={{ fontFamily: config?.legend?.fontFamily ?? 'Roboto, sans-serif', fontSize: (config?.legend?.fontSize ?? 12) + 'px', color: config?.legend?.color }}
                  formatter={(value) => formatLabelWithType(value, 'y')}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'YOUTUBE': {
        const url = config?.url || ''
        return url ? (
          <div className="w-full h-full"><iframe className="w-full h-full" src={url} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
        ) : <div className="text-sm text-muted-foreground">Set a YouTube embed URL in settings</div>
      }

      case 'VIDEO': {
        const src = config?.src || ''
        return src ? (
          <video className="w-full h-full" src={src} controls autoPlay={!!config?.autoplay} loop={!!config?.loop} muted={!!config?.muted} />
        ) : <div className="text-sm text-muted-foreground">Set a video source (mp4/webm) in settings</div>
      }

      case 'HTML': {
        const html = config?.html || ''
        const sanitizedHtml = typeof window !== 'undefined'
          ? DOMPurify.sanitize(html)
          : html
        return (
          <div className="w-full h-full overflow-auto" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        )
      }

      case 'RECTANGLE':
        return (
          <div style={{ width: '100%', height: '100%', background: config?.fill || '#e5e7eb', border: config?.stroke ? `1px solid ${config?.stroke}` : undefined }} />
        )

      case 'CIRCLE':
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '9999px', background: config?.fill || '#e5e7eb', border: config?.stroke ? `1px solid ${config?.stroke}` : undefined }} />
        )

      case 'DIVIDER':
        return (
          <div className="w-full h-full flex items-center"><div style={{ width: '100%', height: config?.thickness || 1, background: config?.color || '#e5e7eb' }} /></div>
        )

      // Shapes via SVG for better control
      case 'RECTANGLE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const rx = 0
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <rect x="5" y="5" width="90" height="90" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} rx={rx} ry={rx} />
            </g>
          </svg>
        )
      }
      case 'ROUNDED_RECT': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const r = Number(config?.cornerRadius || 12)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <rect x="5" y="5" width="90" height="90" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} rx={r} ry={r} />
            </g>
          </svg>
        )
      }
      case 'ELLIPSE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <ellipse cx="50" cy="50" rx="42" ry="32" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'LINE': {
        const color = config?.color || config?.stroke || '#94a3b8'
        const strokeWidth = Number(config?.strokeWidth || config?.thickness || 2)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <line x1="5" y1="50" x2="95" y2="50" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'ARROW': {
        const color = config?.color || config?.stroke || '#94a3b8'
        const strokeWidth = Number(config?.strokeWidth || 2)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const headSize = Number(config?.headSize || 6)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth={headSize} markerHeight={headSize} refX="0" refY="2" orient="auto">
                <polygon points={`0 0, 0 ${headSize}, ${headSize} ${headSize / 2}`} fill={color} />
              </marker>
            </defs>
            <g transform={`rotate(${rotation},50,50)`}>
              <line x1="5" y1="50" x2="95" y2="50" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} markerEnd="url(#arrowhead)" />
            </g>
          </svg>
        )
      }
      case 'TRIANGLE': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'STAR': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const pts = "50,5 61,38 95,38 67,58 76,91 50,72 24,91 33,58 5,38 39,38"
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }
      case 'HEXAGON': {
        const stroke = config?.stroke || '#cbd5e1'
        const fill = config?.fill || '#e5e7eb'
        const strokeWidth = Number(config?.strokeWidth || 1)
        const dash = config?.dashed ? (config?.dashPattern || '4 2') : undefined
        const rotation = Number(config?.rotation || 0)
        const pts = "25,5 75,5 95,50 75,95 25,95 5,50"
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform={`rotate(${rotation},50,50)`}>
              <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
          </svg>
        )
      }

      case 'ICON': {
        const sizePct = Number(config?.size || 80)
        const color = config?.color || '#1f2937'
        const style = (config?.style || 'outline').toLowerCase() // outline | fill | rounded
        // Custom SVG support
        if (config?.svgMarkup) {
          const px = Math.max(12, Math.round((sizePct / 100) * 96))
          let markup = String(config.svgMarkup)
          if (config?.recolorSvg) {
            try {
              // Replace non-'none' fill/stroke with currentColor to allow external color control
              markup = markup
                .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
                .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"')
              // Ensure root svg doesn't force its own color
              // (optional - keep as-is; most cases covered by replacements)
            } catch { }
          }
          const sanitizedMarkup = DOMPurify.sanitize(markup, {
            USE_PROFILES: { svg: true, svgFilters: true },
          })

          return (
            <div className="w-full h-full flex items-center justify-center">
              <div style={{ width: px, height: px, color }} dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />
            </div>
          )
        }
        const iconName: string = (config?.iconName || 'Star').toLowerCase()
        const map: Record<string, any> = {
          star: StarIcon,
          heart: Heart,
          home: Home,
          user: User,
          settings: SettingsIcon,
          bell: Bell,
          checkcircle: CheckCircle,
          alerttriangle: AlertTriangle,
          camera: Camera,
          cloud: Cloud,
          folder: Folder,
          mail: Mail,
          phone: Phone,
          play: PlayIcon,
          pause: PauseIcon,
          search: SearchIcon,
          plus: PlusIcon,
          minus: MinusIcon,
          x: XIcon,
          check: CheckIcon
        }
        const IconComp = map[iconName] || StarIcon
        const px = Math.max(12, Math.round((sizePct / 100) * 96))
        const roundedContainer = style === 'rounded'
        const outline = style === 'outline'
        const fill = style === 'fill'
        // Badge and shadow
        const showBadge = !!config?.showBadge
        const badgeColor = config?.badgeColor || (fill ? color + '22' : 'transparent')
        const badgePadding = Number(config?.badgePadding ?? 6)
        const badgeRounded = !!config?.badgeRounded || roundedContainer
        const shadowMap: Record<string, string> = {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
          md: '0 4px 6px -1px rgba(0,0,0,0.1)',
          lg: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }
        const boxShadow = shadowMap[(config?.shadow || 'none')] || 'none'
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div style={{ padding: badgePadding, borderRadius: badgeRounded ? '9999px' : undefined, background: showBadge ? badgeColor : (fill ? color + '22' : 'transparent'), border: outline ? `2px solid ${color}` : undefined, boxShadow }}>
              <IconComp width={px} height={px} color={color} fill={fill ? color : 'none'} />
            </div>
          </div>
        )
      }

  }
  return null
}
