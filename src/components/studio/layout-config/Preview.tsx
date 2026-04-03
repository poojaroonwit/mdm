'use client'

import React, { RefObject, useMemo } from 'react'
import { File as FileIcon, LayoutDashboard, ClipboardList, Workflow, Layers, Settings } from 'lucide-react'
import { ComponentConfig, UnifiedPage } from './types'
import { Canvas } from './Canvas'
import { Z_INDEX } from '@/lib/z-index'

interface PreviewProps {
  isMobileViewport: boolean
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  previewScale: number
  componentConfigs: Record<string, ComponentConfig>
  selectedComponent: string | null
  allPages: UnifiedPage[]
  selectedPageId: string | null
  canvasRef: RefObject<HTMLDivElement>
  isDraggingWidget: boolean
  selectedWidgetId: string | null
  selectedWidgetIds?: Set<string>
  placedWidgets: any[]
  dragOffset: { x: number; y: number }
  canvasMode: 'freeform' | 'grid'
  showGrid: boolean
  gridSize: number
  setSelectedComponent: (component: string | null) => void
  setSelectedPageId: (pageId: string | null) => void
  setPlacedWidgets: React.Dispatch<React.SetStateAction<any[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedWidgetIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  clipboardWidget?: any
  clipboardWidgets?: any[]
  spaceId?: string
}

export function Preview({
  isMobileViewport,
  deviceMode,
  previewScale,
  componentConfigs,
  selectedComponent,
  allPages,
  selectedPageId,
  canvasRef,
  isDraggingWidget,
  selectedWidgetId,
  selectedWidgetIds,
  placedWidgets,
  dragOffset,
  canvasMode,
  showGrid,
  gridSize,
  setSelectedComponent,
  setSelectedPageId,
  setPlacedWidgets,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  setIsDraggingWidget,
  setDragOffset,
  clipboardWidget,
  clipboardWidgets,
  spaceId,
}: PreviewProps) {
  
  // Resolve icon for custom pages
  const resolvePageIcon = useMemo(() => {
    const iconCache = new Map<string, React.ComponentType<{ className?: string }> | null>()
    
    return (page: UnifiedPage): React.ComponentType<{ className?: string }> | null => {
      if (iconCache.has(page.id)) {
        return iconCache.get(page.id)!
      }
      
      const isBuiltIn = page.type === 'built-in'
      let Icon: React.ComponentType<{ className?: string }> | null = null
      
      if (isBuiltIn) {
        Icon = page.icon || FileIcon
      } else if (page.page?.icon) {
        const customPage = page.page
        // Check if it's a letter, number, roman, or color
        if (customPage.icon && (customPage.icon.startsWith('letter-') || 
            customPage.icon.startsWith('number-') || 
            customPage.icon.startsWith('roman-') || 
            customPage.icon.startsWith('color-'))) {
          // These are rendered as text/color, not icons
          Icon = null
        } else if (customPage.icon && customPage.icon.startsWith('lucide-')) {
          // Lucide icon with prefix
          const iconName = customPage.icon.replace('lucide-', '')
          const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
            'LayoutDashboard': LayoutDashboard,
            'ClipboardList': ClipboardList,
            'Workflow': Workflow,
            'Layers': Layers,
            'File': FileIcon,
            'Settings': Settings,
            'FileText': FileIcon,
          }
          Icon = iconMap[iconName] || null
          
          // Try to load from lucide-react dynamically
          if (!Icon) {
            import('lucide-react').then((icons) => {
              const LucideIcon = (icons as any)[iconName]
              if (LucideIcon) {
                iconCache.set(page.id, LucideIcon)
              }
            }).catch(() => {})
          }
        } else if (customPage.icon && (customPage.icon.startsWith('ho-') || customPage.icon.startsWith('hs-'))) {
          // Heroicons with ho- or hs- prefix
          const [prefix, ...rest] = customPage.icon.split('-')
          const iconName = rest.join('-')
          const path = prefix === 'ho' ? '@heroicons/react/24/outline' : '@heroicons/react/24/solid'
          
          try {
            const createDynamicImport = (path: string) => {
              return new Function('return import("' + path + '")')()
            }
            createDynamicImport(path).then((icons: any) => {
              const IconComp = icons?.[iconName]
              if (IconComp) {
                iconCache.set(page.id, IconComp)
              }
            }).catch(() => {})
          } catch (e) {}
        } else if (customPage.icon && customPage.icon.includes('-')) {
          // React Icon (format: fa-*, md-*, etc.)
          const [prefix, ...rest] = customPage.icon.split('-')
          const iconName = rest.join('-')
          
          // Try to load from react-icons dynamically
          // Use Function constructor to prevent Next.js build-time analysis
          try {
            const createDynamicImport = (path: string) => {
              // Use eval-style dynamic import that Next.js can't analyze
              return new Function('return import("' + path + '")')()
            }
            
            // Only load the specific library needed
            // @ts-ignore - react-icons may not be installed, errors are handled gracefully
            createDynamicImport(`react-icons/${prefix}`).then((icons: any) => {
              const IconComp = icons?.[iconName]
              if (IconComp) {
                iconCache.set(page.id, IconComp)
              }
            }).catch(() => {
              // react-icons not available
            })
          } catch (e) {
            // react-icons not available
          }
        } else {
          // Legacy lucide icon name (without prefix)
          const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
            'LayoutDashboard': LayoutDashboard,
            'ClipboardList': ClipboardList,
            'Workflow': Workflow,
            'Layers': Layers,
            'File': FileIcon,
            'Settings': Settings,
            'FileText': FileIcon,
          }
          Icon = customPage.icon ? (iconMap[customPage.icon] || null) : null
        }
      }
      
      if (!Icon) {
        Icon = FileIcon
      }
      
      iconCache.set(page.id, Icon)
      return Icon
    }
  }, [allPages])
  const deviceDimensions = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
  const dims = deviceDimensions[deviceMode]
  const isMobile = deviceMode === 'mobile'
  const isTablet = deviceMode === 'tablet'

  // Sidebar, top, and footer removed - pages now use secondary platform sidebar
  const canvasHeight = dims.height

  return (
    <div className="flex-1 bg-muted/30 relative overflow-hidden min-h-0 h-full" style={{ zIndex: Z_INDEX.content }}>
      <div className={`w-full h-full overflow-auto ${isMobileViewport ? 'p-2' : 'p-4'}`} style={{ position: 'relative', zIndex: Z_INDEX.content }}>
        <div
          className="bg-background border relative shrink-0"
          style={{
            width: `${dims.width}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${previewScale})`,
            transformOrigin: 'top center',
            margin: '0 auto',
          }}
        >
          <div className="absolute inset-0">
            {/* Main Content Area - Sidebar, top, and footer removed - pages now use secondary platform sidebar */}
            <div className="w-full h-full relative overflow-auto bg-muted/30">
              <Canvas
                canvasRef={canvasRef}
                isMobile={isMobile}
                isDraggingWidget={isDraggingWidget}
                selectedComponent={selectedComponent}
                selectedWidgetId={selectedWidgetId}
                selectedWidgetIds={selectedWidgetIds}
                selectedPageId={selectedPageId}
                placedWidgets={placedWidgets.filter(w => w.pageId === selectedPageId || (!selectedPageId && placedWidgets.length > 0 && w.pageId === placedWidgets[0].pageId))}
                dragOffset={dragOffset}
                canvasMode={canvasMode}
                showGrid={showGrid}
                gridSize={gridSize}
                setPlacedWidgets={setPlacedWidgets}
                setSelectedWidgetId={setSelectedWidgetId}
                setSelectedWidgetIds={setSelectedWidgetIds}
                setSelectedComponent={setSelectedComponent as React.Dispatch<React.SetStateAction<string | null>>}
                setIsDraggingWidget={setIsDraggingWidget}
                setDragOffset={setDragOffset}
                clipboardWidget={clipboardWidget}
                clipboardWidgets={clipboardWidgets}
                spaceId={spaceId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

