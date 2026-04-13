import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { ThemeToggleSegmented } from '@/components/ui/theme-toggle-segmented'
import { 
    RefreshCw,
    Palette,
    Type,
    Square,
    CornerUpRight,
    Minus,
    Sparkles,
    Box,
    Zap,
    Move,
    Bold
} from 'lucide-react'
import { BrandingConfig } from '../../types'

interface TopMenuBarTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    isDarkMode: boolean
    setIsDarkMode: (isDark: boolean) => void
    handleApplyBrandingColors: () => void
    getComponentStyling: (id: string) => any
    updateComponentStyling: (id: string, mode: 'light' | 'dark', field: string, value: string) => void
}

export function TopMenuBarTab({
    branding,
    setBranding,
    isDarkMode,
    setIsDarkMode,
    handleApplyBrandingColors,
    getComponentStyling,
    updateComponentStyling
}: TopMenuBarTabProps) {
    const currentMode = isDarkMode ? 'dark' : 'light'
    const styling = getComponentStyling('top-menu-bar')
    const currentStyling = styling[currentMode]

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <ThemeToggleSegmented
                isDarkMode={isDarkMode}
                onLightMode={() => setIsDarkMode(false)}
                onDarkMode={() => setIsDarkMode(true)}
                align="right"
            />

            {/* Top Menu Bar Configuration */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Top Menu Bar Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                            Background Color
                        </Label>
                        <ColorInput
                            value={branding.topMenuBackgroundColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    topMenuBackgroundColor: color,
                                })
                            }
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
                            value={branding.topMenuTextColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    topMenuTextColor: color,
                                })
                            }
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1f2937"
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
                            onChange={(color) => updateComponentStyling('top-menu-bar', currentMode, 'borderColor', color)}
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'borderRadius', e.target.value)}
                            placeholder="0px"
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'borderWidth', e.target.value)}
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'padding', e.target.value)}
                            placeholder="8px 16px"
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'fontSize', e.target.value)}
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'fontWeight', e.target.value)}
                            placeholder="400"
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(30px) saturate(200%)"
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'boxShadow', e.target.value)}
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
                            onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
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
