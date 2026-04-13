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
    Move
} from 'lucide-react'
import { BrandingConfig } from '@/app/admin/features/system/types'

interface PlatformSidebarTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    isDarkMode: boolean
    setIsDarkMode: (isDark: boolean) => void
    handleApplyBrandingColors: () => void
    getComponentStyling: (id: string) => any
    updateComponentStyling: (id: string, mode: 'light' | 'dark', field: string, value: string) => void
}

export function PlatformSidebarTab({
    branding,
    setBranding,
    isDarkMode,
    setIsDarkMode,
    handleApplyBrandingColors,
    getComponentStyling,
    updateComponentStyling
}: PlatformSidebarTabProps) {
    const currentMode = isDarkMode ? 'dark' : 'light'
    
    // Get styling for primary sidebar, secondary sidebar, and menu states
    const primarySidebarStyling = getComponentStyling('platform-sidebar-primary')
    const secondarySidebarStyling = getComponentStyling('platform-sidebar-secondary')
    const menuNormalStyling = getComponentStyling('platform-sidebar-menu-normal')
    const menuHoverStyling = getComponentStyling('platform-sidebar-menu-hover')
    const menuActiveStyling = getComponentStyling('platform-sidebar-menu-active')

    const currentPrimary = primarySidebarStyling[currentMode]
    const currentSecondary = secondarySidebarStyling[currentMode]
    const currentMenuNormal = menuNormalStyling[currentMode]
    const currentMenuHover = menuHoverStyling[currentMode]
    const currentMenuActive = menuActiveStyling[currentMode]

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <ThemeToggleSegmented
                isDarkMode={isDarkMode}
                onLightMode={() => setIsDarkMode(false)}
                onDarkMode={() => setIsDarkMode(true)}
                align="right"
            />

            {/* Primary Sidebar Configuration */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Primary Sidebar</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                            Background Color
                        </Label>
                        <ColorInput
                            value={branding.platformSidebarBackgroundColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    platformSidebarBackgroundColor: color,
                                })
                            }
                            allowImageVideo={false}
                            className="relative"
                            placeholder="rgba(242, 242, 247, 0.75)"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Text Color
                        </Label>
                        <ColorInput
                            value={branding.platformSidebarTextColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    platformSidebarTextColor: color,
                                })
                            }
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1D1D1F"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                            Backdrop Filter
                        </Label>
                        <Input
                            value={currentPrimary.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(30px) saturate(200%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Border Width
                        </Label>
                        <Input
                            value={currentPrimary.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Secondary Sidebar Configuration */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Secondary Sidebar</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                            Background Color
                        </Label>
                        <ColorInput
                            value={branding.secondarySidebarBackgroundColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    secondarySidebarBackgroundColor: color,
                                })
                            }
                            allowImageVideo={false}
                            className="relative"
                            placeholder="rgba(255, 255, 255, 0.6)"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Text Color
                        </Label>
                        <ColorInput
                            value={branding.secondarySidebarTextColor}
                            onChange={(color) =>
                                setBranding({
                                    ...branding,
                                    secondarySidebarTextColor: color,
                                })
                            }
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#3A3A3C"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                            Backdrop Filter
                        </Label>
                        <Input
                            value={currentSecondary.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(30px) saturate(200%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Border Width
                        </Label>
                        <Input
                            value={currentSecondary.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Normal State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Menu - Normal State</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                            Background Color
                        </Label>
                        <ColorInput
                            value={currentMenuNormal.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="transparent"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Border Radius
                        </Label>
                        <Input
                            value={currentMenuNormal.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Move className="h-3.5 w-3.5 text-muted-foreground" />
                            Padding
                        </Label>
                        <Input
                            value={currentMenuNormal.padding || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'padding', e.target.value)}
                            placeholder="0.5rem 0.75rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Font Size
                        </Label>
                        <Input
                            value={currentMenuNormal.fontSize || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Font Weight
                        </Label>
                        <Input
                            value={currentMenuNormal.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'fontWeight', e.target.value)}
                            placeholder="500"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                            Backdrop Filter (Blur)
                        </Label>
                        <Input
                            value={currentMenuNormal.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(10px) saturate(150%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-muted-foreground" />
                            Box Shadow
                        </Label>
                        <Input
                            value={currentMenuNormal.boxShadow || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'boxShadow', e.target.value)}
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentMenuNormal.transition || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Hover State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Menu - Hover State</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <ColorInput
                            value={currentMenuHover.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="rgba(0,0,0,0.06)"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Input
                            value={currentMenuHover.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Padding</Label>
                        <Input
                            value={currentMenuHover.padding || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'padding', e.target.value)}
                            placeholder="0.5rem 0.75rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                            value={currentMenuHover.fontSize || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Input
                            value={currentMenuHover.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'fontWeight', e.target.value)}
                            placeholder="500"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Backdrop Filter (Blur)</Label>
                        <Input
                            value={currentMenuHover.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(10px) saturate(150%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Box Shadow</Label>
                        <Input
                            value={currentMenuHover.boxShadow || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'boxShadow', e.target.value)}
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentMenuHover.transition || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Active State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Menu - Active State</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <ColorInput
                            value={currentMenuActive.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="rgba(0,122,255,0.12)"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Color</Label>
                        <ColorInput
                            value={currentMenuActive.textColor || ''}
                            onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'textColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#007AFF"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Width</Label>
                        <Input
                            value={currentMenuActive.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Color</Label>
                        <ColorInput
                            value={currentMenuActive.borderColor || ''}
                            onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="transparent"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Input
                            value={currentMenuActive.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Padding</Label>
                        <Input
                            value={currentMenuActive.padding || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'padding', e.target.value)}
                            placeholder="0.5rem 0.75rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                            value={currentMenuActive.fontSize || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Input
                            value={currentMenuActive.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'fontWeight', e.target.value)}
                            placeholder="600"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentMenuActive.transition || ''}
                            onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    Configure styling for Platform Sidebar in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
                    Primary sidebar is the main navigation, secondary sidebar shows submenu items.
                    Menu states control the appearance of navigation buttons (normal, hover, and active).
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

