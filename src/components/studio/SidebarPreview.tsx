import type { SidebarConfig, SidebarItem } from './sidebar-builder'

interface SidebarPreviewProps {
  items: SidebarItem[]
  config: SidebarConfig
}

export function SidebarPreview({ items, config }: SidebarPreviewProps) {
  return (
    <div
      className="w-full h-64 bg-background border rounded-lg p-4 space-y-2 overflow-auto"
      style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
    >
      {items.filter(item => item.isVisible !== false).map(item => (
        <div key={item.id} className="flex items-center gap-2 p-2 rounded hover:bg-black/5">
          {config.showIcons && item.icon && (
            <div
              className="flex-shrink-0"
              style={{
                width: config.iconSize === 'small' ? '16px' : config.iconSize === 'medium' ? '20px' : '24px',
                height: config.iconSize === 'small' ? '16px' : config.iconSize === 'medium' ? '20px' : '24px'
              }}
            >
              <div
                className="w-full h-full rounded"
                style={{ backgroundColor: item.color }}
              />
            </div>
          )}
          <span className="text-sm font-medium truncate">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
