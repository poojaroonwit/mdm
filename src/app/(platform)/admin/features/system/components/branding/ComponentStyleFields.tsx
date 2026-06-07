import type { LucideIcon } from 'lucide-react'
import {
    AlignJustify,
    AlignLeft,
    ArrowLeftRight,
    Bold,
    Box,
    CaseUpper,
    CornerUpRight,
    Eye,
    Filter,
    Focus,
    Grid3x3,
    Italic,
    Layers,
    Maximize2,
    Minus,
    MoreVertical,
    MousePointer,
    Move,
    Palette,
    RotateCw,
    Sparkles,
    Square,
    Type,
    Underline,
    Zap
} from 'lucide-react'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ComponentStyleMode = 'light' | 'dark'

interface ComponentStyleFieldsProps {
    activeComponent: string
    currentMode: ComponentStyleMode
    currentStyling: Record<string, string | undefined>
    updateComponentStyling: (id: string, mode: ComponentStyleMode, field: string, value: string) => void
}

interface ComponentStyleField {
    field: string
    label: string
    placeholder: string
    icon: LucideIcon
    type?: 'color' | 'text'
    iconClassName?: string
}

const STYLE_FIELDS: ComponentStyleField[] = [
    { field: 'backgroundColor', label: 'Background Color', placeholder: '#ffffff', icon: Palette, type: 'color' },
    { field: 'textColor', label: 'Text Color', placeholder: '#000000', icon: Type, type: 'color' },
    { field: 'borderColor', label: 'Border Color', placeholder: '#e2e8f0', icon: Square, type: 'color' },
    { field: 'borderRadius', label: 'Border Radius', placeholder: '4px', icon: CornerUpRight },
    { field: 'borderWidth', label: 'Border Width', placeholder: '1px', icon: Minus },
    { field: 'padding', label: 'Padding', placeholder: '0.5rem', icon: Move },
    { field: 'margin', label: 'Margin', placeholder: '0px', icon: ArrowLeftRight },
    { field: 'borderStyle', label: 'Border Style', placeholder: 'solid', icon: Layers },
    { field: 'opacity', label: 'Opacity', placeholder: '1', icon: Eye },
    { field: 'fontSize', label: 'Font Size', placeholder: '0.875rem', icon: Type },
    { field: 'fontWeight', label: 'Font Weight', placeholder: '400', icon: Bold },
    { field: 'letterSpacing', label: 'Letter Spacing', placeholder: '0', icon: AlignLeft },
    { field: 'lineHeight', label: 'Line Height', placeholder: '1.5', icon: AlignJustify },
    { field: 'fontStyle', label: 'Font Style', placeholder: 'normal', icon: Italic },
    { field: 'fontFamily', label: 'Font Family', placeholder: 'inherit', icon: Type },
    { field: 'textAlign', label: 'Text Align', placeholder: 'left', icon: AlignLeft },
    { field: 'textTransform', label: 'Text Transform', placeholder: 'none', icon: CaseUpper },
    { field: 'textDecoration', label: 'Text Decoration', placeholder: 'none', icon: Underline },
    { field: 'width', label: 'Width', placeholder: 'auto', icon: Maximize2 },
    { field: 'height', label: 'Height', placeholder: 'auto', icon: Maximize2, iconClassName: 'rotate-90' },
    { field: 'minWidth', label: 'Min Width', placeholder: '0', icon: Maximize2 },
    { field: 'maxWidth', label: 'Max Width', placeholder: 'none', icon: Maximize2 },
    { field: 'minHeight', label: 'Min Height', placeholder: '0', icon: Maximize2, iconClassName: 'rotate-90' },
    { field: 'maxHeight', label: 'Max Height', placeholder: 'none', icon: Maximize2, iconClassName: 'rotate-90' },
    { field: 'gap', label: 'Gap', placeholder: '0', icon: Grid3x3 },
    { field: 'zIndex', label: 'Z-Index', placeholder: 'auto', icon: Layers },
    { field: 'cursor', label: 'Cursor', placeholder: 'default', icon: MousePointer },
    { field: 'transform', label: 'Transform', placeholder: 'none', icon: RotateCw },
    { field: 'filter', label: 'Filter', placeholder: 'none', icon: Filter },
    { field: 'outline', label: 'Outline', placeholder: 'none', icon: Focus },
    { field: 'outlineColor', label: 'Outline Color', placeholder: 'transparent', icon: Palette, type: 'color' },
    { field: 'outlineWidth', label: 'Outline Width', placeholder: '0', icon: Minus },
    { field: 'overflow', label: 'Overflow', placeholder: 'visible', icon: MoreVertical },
    { field: 'overflowX', label: 'Overflow X', placeholder: 'visible', icon: ArrowLeftRight },
    { field: 'overflowY', label: 'Overflow Y', placeholder: 'visible', icon: ArrowLeftRight, iconClassName: 'rotate-90' },
    { field: 'whiteSpace', label: 'White Space', placeholder: 'normal', icon: AlignJustify },
    { field: 'wordBreak', label: 'Word Break', placeholder: 'normal', icon: Type },
    { field: 'textOverflow', label: 'Text Overflow', placeholder: 'clip', icon: MoreVertical },
    { field: 'visibility', label: 'Visibility', placeholder: 'visible', icon: Eye },
    { field: 'pointerEvents', label: 'Pointer Events', placeholder: 'auto', icon: MousePointer },
    { field: 'userSelect', label: 'User Select', placeholder: 'auto', icon: MousePointer },
    { field: 'backdropFilter', label: 'Backdrop Filter', placeholder: 'blur(20px) saturate(180%)', icon: Sparkles },
    { field: 'boxShadow', label: 'Box Shadow', placeholder: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', icon: Box },
    { field: 'transition', label: 'Transition', placeholder: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', icon: Zap },
]

export function ComponentStyleFields({
    activeComponent,
    currentMode,
    currentStyling,
    updateComponentStyling
}: ComponentStyleFieldsProps) {
    return (
        <div className="grid grid-cols-2 gap-6">
            {STYLE_FIELDS.map(({ field, label, placeholder, icon: Icon, iconClassName, type }) => (
                <div key={field} className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 text-muted-foreground ${iconClassName || ''}`} />
                        {label}
                    </Label>
                    {type === 'color' ? (
                        <ColorInput
                            value={currentStyling[field] || ''}
                            onChange={(color) => updateComponentStyling(activeComponent, currentMode, field, color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder={placeholder}
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    ) : (
                        <Input
                            value={currentStyling[field] || ''}
                            onChange={(event) => updateComponentStyling(activeComponent, currentMode, field, event.target.value)}
                            placeholder={placeholder}
                            className="w-full"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
