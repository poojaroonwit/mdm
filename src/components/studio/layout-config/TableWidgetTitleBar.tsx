import type React from 'react'
import {
  AreaChart,
  BarChart3 as BarChart3Icon,
  Home,
  LineChart,
  Settings as SettingsIcon,
  Star,
  Table as TableIcon,
} from 'lucide-react'

interface TableWidgetTitleBarProps {
  props: any
  style: React.CSSProperties
  showIcon?: boolean
}

export function TableWidgetTitleBar({ props, style, showIcon = false }: TableWidgetTitleBarProps) {
  if (!(props.showElementHeaderBar ?? false)) return null
  const iconSize = 14
  const iconColor = props.titleColor || style.color || '#111827'
  const iconMap: Record<string, React.ReactNode> = {
    star: <Star size={iconSize} style={{ color: iconColor }} />,
    home: <Home size={iconSize} style={{ color: iconColor }} />,
    settings: <SettingsIcon size={iconSize} style={{ color: iconColor }} />,
    table: <TableIcon size={iconSize} style={{ color: iconColor }} />,
    bar: <BarChart3Icon size={iconSize} style={{ color: iconColor }} />,
    line: <LineChart size={iconSize} style={{ color: iconColor }} />,
    area: <AreaChart size={iconSize} style={{ color: iconColor }} />,
  }

  return (
    <div
      className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
      style={{
        background: props.headerBackgroundColor || 'transparent',
        justifyContent: (props.titleAlign || 'left') === 'center'
          ? 'center'
          : (props.titleAlign || 'left') === 'right'
            ? 'flex-end'
            : 'flex-start',
      }}
    >
      {showIcon && props.headerIcon && props.headerIcon !== 'none'
        ? iconMap[String(props.headerIcon).toLowerCase()] || null
        : null}
      <div
        className="truncate"
        style={{
          fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
          color: props.titleColor || style.color,
          fontWeight: props.titleFontWeight || 600,
        }}
      >
        {props.title || ''}
      </div>
    </div>
  )
}
