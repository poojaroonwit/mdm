import { PopoverContent } from '@/components/ui/popover'
import { Z_INDEX } from '@/lib/z-index'
import { Attribute } from './chartDataSourceTypes'
import { getAttributeIcon } from './chartDataSourceUtils'

interface AttributeDropZoneListProps {
  attributes: Attribute[]
  excludedValues?: string[]
  loading: boolean
  searchQuery: string
  selectedModelId?: string
  onSearchChange: (query: string) => void
  onSelect: (attribute: Attribute) => void
}

export function AttributeDropZoneList({
  attributes,
  excludedValues = [],
  loading,
  searchQuery,
  selectedModelId,
  onSearchChange,
  onSelect,
}: AttributeDropZoneListProps) {
  const query = searchQuery.toLowerCase().trim()
  const filteredAttributes = attributes.filter(attr => {
    if (excludedValues.includes(attr.name)) return false
    if (!query) return true
    return (
      attr.name.toLowerCase().includes(query) ||
      attr.display_name?.toLowerCase().includes(query) ||
      attr.type.toLowerCase().includes(query)
    )
  })

  return (
    <PopoverContent className="w-[300px] p-0" align="start" style={{ zIndex: Z_INDEX.popover }}>
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Search attributes..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {loading ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
        ) : filteredAttributes.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
            {attributes.length === 0
              ? (selectedModelId ? 'No attributes available for this data model' : 'Please select a data model first')
              : 'No attributes match your search'}
          </div>
        ) : (
          <div className="p-1">
            {filteredAttributes.map(attr => {
              const Icon = getAttributeIcon(attr.type)
              return (
                <button
                  key={attr.id}
                  type="button"
                  onClick={() => onSelect(attr)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground">
                      {attr.display_name || attr.name}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PopoverContent>
  )
}
