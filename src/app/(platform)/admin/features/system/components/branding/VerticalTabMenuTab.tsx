import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { ThemeToggleSegmented } from '@/components/ui/theme-toggle-segmented'
import { RefreshCw } from 'lucide-react'
import { BrandingConfig } from '../../types'

interface VerticalTabMenuTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    isDarkMode: boolean
    setIsDarkMode: (isDark: boolean) => void
    handleApplyBrandingColors: () => void
    getComponentStyling: (id: string) => any
    updateComponentStyling: (id: string, mode: 'light' | 'dark', field: string, value: string) => void
}

export function VerticalTabMenuTab({
    branding,
    setBranding,
    isDarkMode,
    setIsDarkMode,
    handleApplyBrandingColors,
    getComponentStyling,
    updateComponentStyling
}: VerticalTabMenuTabProps) {
    const currentMode = isDarkMode ? 'dark' : 'light'
    const normalStyling = getComponentStyling('vertical-tab-menu-normal')
    const activeStyling = getComponentStyling('vertical-tab-menu-active')
    const hoverStyling = getComponentStyling('vertical-tab-menu-hover')

    const currentNormal = normalStyling[currentMode]
    const currentActive = activeStyling[currentMode]
    const currentHover = hoverStyling[currentMode]

    return (
        <div className="space-y-6">
            <ThemeToggleSegmented
                isDarkMode={isDarkMode}
                onLightMode={() => setIsDarkMode(false)}
                onDarkMode={() => setIsDarkMode(true)}
                align="right"
            />

            {/* Normal Tab State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Normal Tab</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <ColorInput
                            value={currentNormal.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="transparent"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Color</Label>
                        <ColorInput
                            value={currentNormal.textColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'textColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#6b7280"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Input
                            value={currentNormal.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Padding</Label>
                        <Input
                            value={currentNormal.padding || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'padding', e.target.value)}
                            placeholder="0.75rem 1rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                            value={currentNormal.fontSize || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Input
                            value={currentNormal.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'fontWeight', e.target.value)}
                            placeholder="500"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Color</Label>
                        <ColorInput
                            value={currentNormal.borderColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="transparent"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Width</Label>
                        <Input
                            value={currentNormal.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Backdrop Filter</Label>
                        <Input
                            value={currentNormal.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(20px) saturate(180%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Box Shadow</Label>
                        <Input
                            value={currentNormal.boxShadow || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'boxShadow', e.target.value)}
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentNormal.transition || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Hover Tab State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Hover Tab</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <ColorInput
                            value={currentHover.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="hsl(var(--muted))"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Color</Label>
                        <ColorInput
                            value={currentHover.textColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'textColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="hsl(var(--foreground))"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Input
                            value={currentHover.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Padding</Label>
                        <Input
                            value={currentHover.padding || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'padding', e.target.value)}
                            placeholder="0.75rem 1rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                            value={currentHover.fontSize || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Input
                            value={currentHover.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'fontWeight', e.target.value)}
                            placeholder="500"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Color</Label>
                        <ColorInput
                            value={currentHover.borderColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="transparent"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Width</Label>
                        <Input
                            value={currentHover.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Backdrop Filter</Label>
                        <Input
                            value={currentHover.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(20px) saturate(180%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Box Shadow</Label>
                        <Input
                            value={currentHover.boxShadow || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'boxShadow', e.target.value)}
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentHover.transition || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Active Tab State */}
            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold">Active Tab</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <ColorInput
                            value={currentActive.backgroundColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'backgroundColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="hsl(var(--primary))"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Color</Label>
                        <ColorInput
                            value={currentActive.textColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'textColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="hsl(var(--primary-foreground))"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Radius</Label>
                        <Input
                            value={currentActive.borderRadius || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderRadius', e.target.value)}
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Color (for border indicator)</Label>
                        <ColorInput
                            value={currentActive.borderColor || ''}
                            onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderColor', color)}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="hsl(var(--primary))"
                            inputClassName="h-7 text-xs pl-7 w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Padding</Label>
                        <Input
                            value={currentActive.padding || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'padding', e.target.value)}
                            placeholder="0.75rem 1rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                            value={currentActive.fontSize || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'fontSize', e.target.value)}
                            placeholder="0.875rem"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Weight</Label>
                        <Input
                            value={currentActive.fontWeight || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'fontWeight', e.target.value)}
                            placeholder="500"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Border Width</Label>
                        <Input
                            value={currentActive.borderWidth || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderWidth', e.target.value)}
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Backdrop Filter</Label>
                        <Input
                            value={currentActive.backdropFilter || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'backdropFilter', e.target.value)}
                            placeholder="blur(20px) saturate(180%)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Box Shadow</Label>
                        <Input
                            value={currentActive.boxShadow || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'boxShadow', e.target.value)}
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transition</Label>
                        <Input
                            value={currentActive.transition || ''}
                            onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'transition', e.target.value)}
                            placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    Configure styling for Vertical Tab Menu items in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
                    Normal state applies to default tabs, hover state applies on mouse hover, and active state applies to selected tabs.
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
