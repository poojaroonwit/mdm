import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { 
    RefreshCw, 
    Sun, 
    Moon,
    Palette,
    Type,
    Square,
    CornerUpRight,
    Minus,
    Layers,
    Move,
    ArrowLeftRight,
    Maximize2,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    CaseUpper,
    Underline,
    Eye,
    Sparkles,
    Filter,
    RotateCw,
    MousePointer,
    Focus,
    MoreVertical,
    AlignJustify,
    Grid3x3,
    Zap,
    Box
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandingConfig } from '../../types'

interface ComponentStylingTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    isDarkMode: boolean
    setIsDarkMode: (isDark: boolean) => void
    activeComponent: string
    handleApplyBrandingColors: () => void
    getComponentStyling: (id: string) => any
    updateComponentStyling: (id: string, mode: 'light' | 'dark', field: string, value: string) => void
    componentLabel?: string
    componentDescription?: string
}

export function ComponentStylingTab({
    branding,
    setBranding,
    isDarkMode,
    setIsDarkMode,
    activeComponent,
    handleApplyBrandingColors,
    getComponentStyling,
    updateComponentStyling,
    componentLabel,
    componentDescription
}: ComponentStylingTabProps) {
    const styling = getComponentStyling(activeComponent)
    const currentMode = isDarkMode ? 'dark' : 'light'
    const currentStyling = styling[currentMode]

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center justify-end">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(false)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            !isDarkMode
                                ? "bg-background text-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Sun className={cn('h-4 w-4', !isDarkMode ? 'text-amber-500' : 'text-muted-foreground')} />
                        <span>Light</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(true)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            isDarkMode
                                ? "bg-background text-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Moon className={cn('h-4 w-4', isDarkMode ? 'text-blue-500' : 'text-muted-foreground')} />
                        <span>Dark</span>
                    </button>
                </div>
            </div>

            {/* Configuration Fields */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        Background Color
                    </Label>
                    <ColorInput
                        value={currentStyling.backgroundColor || ''}
                        onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'backgroundColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-7 text-xs pl-7 w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        Text Color
                    </Label>
                    <ColorInput
                        value={currentStyling.textColor || ''}
                        onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'textColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#000000"
                        inputClassName="h-7 text-xs pl-7 w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Square className="h-3.5 w-3.5 text-muted-foreground" />
                        Border Color
                    </Label>
                    <ColorInput
                        value={currentStyling.borderColor || ''}
                        onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'borderColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#e2e8f0"
                        inputClassName="h-7 text-xs pl-7 w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        Border Radius
                    </Label>
                    <Input
                        value={currentStyling.borderRadius || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'borderRadius', e.target.value)}
                        placeholder="4px"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        Border Width
                    </Label>
                    <Input
                        value={currentStyling.borderWidth || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'borderWidth', e.target.value)}
                        placeholder="1px"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Move className="h-3.5 w-3.5 text-muted-foreground" />
                        Padding
                    </Label>
                    <Input
                        value={currentStyling.padding || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'padding', e.target.value)}
                        placeholder="0.5rem"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        Margin
                    </Label>
                    <Input
                        value={currentStyling.margin || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'margin', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        Border Style
                    </Label>
                    <Input
                        value={currentStyling.borderStyle || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'borderStyle', e.target.value)}
                        placeholder="solid"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        Opacity
                    </Label>
                    <Input
                        value={currentStyling.opacity || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'opacity', e.target.value)}
                        placeholder="1"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        Font Size
                    </Label>
                    <Input
                        value={currentStyling.fontSize || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontSize', e.target.value)}
                        placeholder="0.875rem"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Bold className="h-3.5 w-3.5 text-muted-foreground" />
                        Font Weight
                    </Label>
                    <Input
                        value={currentStyling.fontWeight || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontWeight', e.target.value)}
                        placeholder="400"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        Letter Spacing
                    </Label>
                    <Input
                        value={currentStyling.letterSpacing || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'letterSpacing', e.target.value)}
                        placeholder="0"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <AlignJustify className="h-3.5 w-3.5 text-muted-foreground" />
                        Line Height
                    </Label>
                    <Input
                        value={currentStyling.lineHeight || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'lineHeight', e.target.value)}
                        placeholder="1.5"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Italic className="h-3.5 w-3.5 text-muted-foreground" />
                        Font Style
                    </Label>
                    <Input
                        value={currentStyling.fontStyle || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontStyle', e.target.value)}
                        placeholder="normal"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        Font Family
                    </Label>
                    <Input
                        value={currentStyling.fontFamily || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontFamily', e.target.value)}
                        placeholder="inherit"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        Text Align
                    </Label>
                    <Input
                        value={currentStyling.textAlign || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'textAlign', e.target.value)}
                        placeholder="left"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <CaseUpper className="h-3.5 w-3.5 text-muted-foreground" />
                        Text Transform
                    </Label>
                    <Input
                        value={currentStyling.textTransform || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'textTransform', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Underline className="h-3.5 w-3.5 text-muted-foreground" />
                        Text Decoration
                    </Label>
                    <Input
                        value={currentStyling.textDecoration || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'textDecoration', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Width
                    </Label>
                    <Input
                        value={currentStyling.width || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'width', e.target.value)}
                        placeholder="auto"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                        Height
                    </Label>
                    <Input
                        value={currentStyling.height || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'height', e.target.value)}
                        placeholder="auto"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Min Width
                    </Label>
                    <Input
                        value={currentStyling.minWidth || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'minWidth', e.target.value)}
                        placeholder="0"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Max Width
                    </Label>
                    <Input
                        value={currentStyling.maxWidth || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'maxWidth', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                        Min Height
                    </Label>
                    <Input
                        value={currentStyling.minHeight || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'minHeight', e.target.value)}
                        placeholder="0"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                        Max Height
                    </Label>
                    <Input
                        value={currentStyling.maxHeight || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'maxHeight', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
                        Gap
                    </Label>
                    <Input
                        value={currentStyling.gap || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'gap', e.target.value)}
                        placeholder="0"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        Z-Index
                    </Label>
                    <Input
                        value={currentStyling.zIndex || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'zIndex', e.target.value)}
                        placeholder="auto"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                        Cursor
                    </Label>
                    <Input
                        value={currentStyling.cursor || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'cursor', e.target.value)}
                        placeholder="default"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
                        Transform
                    </Label>
                    <Input
                        value={currentStyling.transform || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'transform', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        Filter
                    </Label>
                    <Input
                        value={currentStyling.filter || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'filter', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Focus className="h-3.5 w-3.5 text-muted-foreground" />
                        Outline
                    </Label>
                    <Input
                        value={currentStyling.outline || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'outline', e.target.value)}
                        placeholder="none"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        Outline Color
                    </Label>
                    <ColorInput
                        value={currentStyling.outlineColor || ''}
                        onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'outlineColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="transparent"
                        inputClassName="h-7 text-xs pl-7 w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        Outline Width
                    </Label>
                    <Input
                        value={currentStyling.outlineWidth || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'outlineWidth', e.target.value)}
                        placeholder="0"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        Overflow
                    </Label>
                    <Input
                        value={currentStyling.overflow || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'overflow', e.target.value)}
                        placeholder="visible"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        Overflow X
                    </Label>
                    <Input
                        value={currentStyling.overflowX || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'overflowX', e.target.value)}
                        placeholder="visible"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                        Overflow Y
                    </Label>
                    <Input
                        value={currentStyling.overflowY || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'overflowY', e.target.value)}
                        placeholder="visible"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <AlignJustify className="h-3.5 w-3.5 text-muted-foreground" />
                        White Space
                    </Label>
                    <Input
                        value={currentStyling.whiteSpace || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'whiteSpace', e.target.value)}
                        placeholder="normal"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        Word Break
                    </Label>
                    <Input
                        value={currentStyling.wordBreak || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'wordBreak', e.target.value)}
                        placeholder="normal"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        Text Overflow
                    </Label>
                    <Input
                        value={currentStyling.textOverflow || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'textOverflow', e.target.value)}
                        placeholder="clip"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        Visibility
                    </Label>
                    <Input
                        value={currentStyling.visibility || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'visibility', e.target.value)}
                        placeholder="visible"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                        Pointer Events
                    </Label>
                    <Input
                        value={currentStyling.pointerEvents || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'pointerEvents', e.target.value)}
                        placeholder="auto"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                        User Select
                    </Label>
                    <Input
                        value={currentStyling.userSelect || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'userSelect', e.target.value)}
                        placeholder="auto"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        Backdrop Filter
                    </Label>
                    <Input
                        value={currentStyling.backdropFilter || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'backdropFilter', e.target.value)}
                        placeholder="blur(20px) saturate(180%)"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />
                        Box Shadow
                    </Label>
                    <Input
                        value={currentStyling.boxShadow || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'boxShadow', e.target.value)}
                        placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        Transition
                    </Label>
                    <Input
                        value={currentStyling.transition || ''}
                        onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'transition', e.target.value)}
                        placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                        className="w-full"
                    />
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    Configure styling for <strong>{componentLabel}</strong> in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
                    {componentDescription && ` ${componentDescription}`}
                </p>
            </div>
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleApplyBrandingColors}
                    variant="default"
                    size="sm"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Apply Config
                </Button>
            </div>
        </div>
    )
}
