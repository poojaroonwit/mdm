export interface Breakpoint {
  id: string
  name: string
  width: number
  height: number
  minWidth?: number
  maxWidth?: number
  icon: string
  color: string
}

export interface LayoutConfig {
  id: string
  name: string
  type: 'grid' | 'flexbox' | 'absolute' | 'flow'
  columns?: number
  rows?: number
  gap?: number
  padding?: number
  margin?: number
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  breakpoints: Record<string, Partial<LayoutConfig>>
}

export interface ResponsiveLayoutManagerProps {
  layouts: LayoutConfig[]
  currentBreakpoint: string
  onUpdateLayout: (id: string, updates: Partial<LayoutConfig>) => void
  onCreateLayout: (layout: Omit<LayoutConfig, 'id'>) => void
  onDeleteLayout: (id: string) => void
  onSelectBreakpoint: (breakpoint: string) => void
}

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  {
    id: 'desktop',
    name: 'Desktop',
    width: 1200,
    height: 800,
    minWidth: 1024,
    icon: 'Monitor',
    color: '#1e40af'
  },
  {
    id: 'tablet',
    name: 'Tablet',
    width: 768,
    height: 1024,
    minWidth: 768,
    maxWidth: 1023,
    icon: 'Tablet',
    color: '#10b981'
  },
  {
    id: 'mobile',
    name: 'Mobile',
    width: 375,
    height: 667,
    maxWidth: 767,
    icon: 'Smartphone',
    color: '#f59e0b'
  }
]
