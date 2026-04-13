"use client"

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Maximize2, BoxSelect } from 'lucide-react'
import { Chatbot } from '../types'

interface PWATabProps {
    formData: Partial<Chatbot>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function PWATab({
    formData,
    setFormData,
}: PWATabProps) {
    return (
        <div className="w-full pt-4">
            {/* Enable/Disable PWA Toggle */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icons.Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-0.5">
                            <Label htmlFor="pwa-enabled" className="text-base font-medium">Enable PWA Install Banner</Label>
                            <p className="text-xs text-muted-foreground">
                                Show an install prompt inside the chat widget for users to install the chat as a standalone app
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="pwa-enabled"
                        checked={formData.pwaEnabled || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, pwaEnabled: checked, pwaInstallScope: 'chat' })}
                    />
                </div>
            </div>

            {formData.pwaEnabled && (
                <Tabs defaultValue="general" className="flex w-full gap-6">
                    <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg">
                        <TabsTrigger value="general" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.Settings className="h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="metadata" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.FileText className="h-4 w-4" />
                            App Metadata
                        </TabsTrigger>
                        <TabsTrigger value="banner-styling" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.Palette className="h-4 w-4" />
                            Banner Styling
                        </TabsTrigger>
                        <TabsTrigger value="button-styling" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.MousePointer className="h-4 w-4" />
                            Button Styling
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 w-full max-w-[800px]">
                        {/* General Section */}
                        <TabsContent value="general" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <Icons.Settings className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">General Settings</Label>
                                </div>



                                <div className="space-y-2">
                                    <Label>Banner Text</Label>
                                    <Input
                                        placeholder="Install app for quick access"
                                        value={formData.pwaBannerText || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaBannerText: e.target.value })}
                                    />
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Banner Position</Label>
                                        <Select
                                            value={formData.pwaBannerPosition || (formData.pwaInstallScope === 'website' ? 'floating-top' : 'under-header')}
                                            onValueChange={(v) => setFormData({ ...formData, pwaBannerPosition: v as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="under-header">Under Header (Inline)</SelectItem>
                                                <SelectItem value="top-of-header">Top of Header (Inline)</SelectItem>
                                                <SelectItem value="floating-top">Floating Top (Overlay)</SelectItem>
                                                <SelectItem value="floating-bottom">Floating Bottom (Overlay)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Display Mode</Label>
                                        <Select
                                            value={formData.pwaDisplayMode || 'standalone'}
                                            onValueChange={(v) => setFormData({ ...formData, pwaDisplayMode: v as 'standalone' | 'fullscreen' | 'minimal-ui' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standalone">Standalone (App-like)</SelectItem>
                                                <SelectItem value="fullscreen">Fullscreen</SelectItem>
                                                <SelectItem value="minimal-ui">Minimal UI (with back button)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Title Text</Label>
                                        <Input
                                            placeholder="Install Application"
                                            value={formData.pwaBannerTitleText || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerTitleText: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description Text</Label>
                                        <Input
                                            placeholder="Add to home screen"
                                            value={formData.pwaBannerDescriptionText || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerDescriptionText: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* App Metadata Section */}
                        <TabsContent value="metadata" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <Icons.FileText className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">App Metadata</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>App Name</Label>
                                        <Input
                                            placeholder={formData.name || 'Chat Assistant'}
                                            value={formData.pwaAppName || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaAppName: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Name shown in app drawer</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Short Name</Label>
                                        <Input
                                            placeholder={formData.name?.split(' ')[0] || 'Chat'}
                                            value={formData.pwaShortName || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaShortName: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Name on home screen</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>App Description</Label>
                                    <Input
                                        placeholder={formData.description || 'AI Chat Assistant'}
                                        value={formData.pwaDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaDescription: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Theme Color</Label>
                                        <ColorInput
                                            value={formData.pwaThemeColor || formData.primaryColor || '#1e40af'}
                                            onChange={(color) => setFormData({ ...formData, pwaThemeColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#1e40af"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">Status bar color</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <ColorInput
                                            value={formData.pwaBackgroundColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBackgroundColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">Splash screen background</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>App Icon</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    const reader = new FileReader()
                                                    reader.onload = (ev) => {
                                                        setFormData({ ...formData, pwaIconUrl: ev.target?.result as string })
                                                    }
                                                    reader.readAsDataURL(file)
                                                }}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Or paste URL..."
                                                value={formData.pwaIconUrl || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaIconUrl: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">512x512 PNG recommended</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Icon Size (px)</Label>
                                        <Input
                                            type="number"
                                            placeholder="512"
                                            value={formData.pwaIconSize || 512}
                                            onChange={(e) => setFormData({ ...formData, pwaIconSize: parseInt(e.target.value) || 512 })}
                                        />
                                        <p className="text-xs text-muted-foreground">Size in pixels (default: 512)</p>
                                    </div>
                                </div>

                                {formData.pwaIconUrl && (
                                    <div className="mt-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
                                        <div className="border rounded-lg p-2 inline-block bg-muted/50">
                                            <img
                                                src={formData.pwaIconUrl}
                                                alt="App Icon"
                                                className="object-contain"
                                                style={{
                                                    width: '128px',
                                                    height: '128px'
                                                }}
                                            />
                                            <p className="text-xs text-center mt-1 text-muted-foreground">
                                                Actual size: {formData.pwaIconSize || 512}px
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Banner Styling Section */}
                        <TabsContent value="banner-styling" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <Icons.Palette className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">Banner Styling</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Banner Background</Label>
                                        <ColorInput
                                            value={formData.pwaBannerBgColor || formData.primaryColor || '#1e40af'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerBgColor: color })}
                                            allowImageVideo={true}
                                            className="relative"
                                            placeholder={formData.primaryColor || '#1e40af'}
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerFontColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerFontColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Font Family</Label>
                                        <Input
                                            placeholder="Inter, sans-serif"
                                            value={formData.pwaBannerFontFamily || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerFontFamily: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Font Size</Label>
                                        <Input
                                            placeholder="13px"
                                            value={formData.pwaBannerFontSize || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerFontSize: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Border Width</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full hover:bg-muted">
                                                        <BoxSelect className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-4">
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium leading-none">Individual Border Widths</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Top</Label>
                                                                <Input
                                                                    placeholder="1px"
                                                                    value={(formData as any).pwaBannerBorderWidthTop || ''}
                                                                    onChange={(e) => setFormData({ ...formData, pwaBannerBorderWidthTop: e.target.value } as any)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Right</Label>
                                                                <Input
                                                                    placeholder="1px"
                                                                    value={(formData as any).pwaBannerBorderWidthRight || ''}
                                                                    onChange={(e) => setFormData({ ...formData, pwaBannerBorderWidthRight: e.target.value } as any)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Bottom</Label>
                                                                <Input
                                                                    placeholder="1px"
                                                                    value={(formData as any).pwaBannerBorderWidthBottom || ''}
                                                                    onChange={(e) => setFormData({ ...formData, pwaBannerBorderWidthBottom: e.target.value } as any)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Left</Label>
                                                                <Input
                                                                    placeholder="1px"
                                                                    value={(formData as any).pwaBannerBorderWidthLeft || ''}
                                                                    onChange={(e) => setFormData({ ...formData, pwaBannerBorderWidthLeft: e.target.value } as any)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="1px"
                                                value={formData.pwaBannerBorderWidth || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaBannerBorderWidth: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Border Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerBorderColor || '#e2e8f0'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerBorderColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#e2e8f0"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Border Radius</Label>
                                        <Input
                                            placeholder="8px"
                                            value={formData.pwaBannerBorderRadius || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerBorderRadius: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Padding</Label>
                                        <Input
                                            placeholder="10px 12px"
                                            value={formData.pwaBannerPadding || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerPadding: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <Label className="text-base font-semibold">Shadow Customization</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Shadow X Offset</Label>
                                            <Input
                                                placeholder="0px"
                                                value={(formData as any).pwaBannerShadowX || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaBannerShadowX: e.target.value } as any)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Shadow Y Offset</Label>
                                            <Input
                                                placeholder="4px"
                                                value={(formData as any).pwaBannerShadowY || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaBannerShadowY: e.target.value } as any)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Shadow Blur</Label>
                                            <Input
                                                placeholder="10px"
                                                value={(formData as any).pwaBannerShadowBlur || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaBannerShadowBlur: e.target.value } as any)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Shadow Spread</Label>
                                            <Input
                                                placeholder="0px"
                                                value={(formData as any).pwaBannerShadowSpread || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaBannerShadowSpread: e.target.value } as any)}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Shadow Color</Label>
                                            <ColorInput
                                                value={(formData as any).pwaBannerShadowColor || 'rgba(0,0,0,0.1)'}
                                                onChange={(color) => setFormData({ ...formData, pwaBannerShadowColor: color } as any)}
                                                allowImageVideo={false}
                                                className="relative"
                                                placeholder="rgba(0,0,0,0.1)"
                                                inputClassName="h-10 text-xs pl-9 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 hidden">
                                    <Label>Legacy Shadow</Label>
                                    <Input
                                        placeholder="0 -2px 10px rgba(0,0,0,0.1)"
                                        value={formData.pwaBannerShadow || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaBannerShadow: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Margin</Label>
                                    <Input
                                        placeholder="0 12px"
                                        value={formData.pwaBannerMargin || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaBannerMargin: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Margin around the banner (e.g., "8px 12px")</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Button Styling Section */}
                        <TabsContent value="button-styling" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                    <Icons.MousePointer className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">Install Button Styling</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Button Background</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonBgColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonBgColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Button Text Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonTextColor || formData.primaryColor || '#1e40af'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonTextColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder={formData.primaryColor || '#1e40af'}
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Button Border Radius</Label>
                                        <Input
                                            placeholder="4px"
                                            value={formData.pwaBannerButtonBorderRadius || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerButtonBorderRadius: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Button Font Size</Label>
                                        <Input
                                            placeholder="12px"
                                            value={formData.pwaBannerButtonFontSize || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerButtonFontSize: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Install Button Text</Label>
                                        <Input
                                            placeholder="Install"
                                            value={formData.pwaBannerButtonText || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerButtonText: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Hover Background</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonHoverBgColor || ''}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonHoverBgColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#333333"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Hover Text Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonHoverTextColor || ''}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonHoverTextColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    )
}
