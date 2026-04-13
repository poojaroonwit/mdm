import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { IconPicker } from '@/components/ui/icon-picker'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { RefreshCw, Pencil } from 'lucide-react'
import { BrandingConfig } from '../../types'
import { useState, useEffect } from 'react'

// Helper to load application logo icon
const loadAppIcon = async (iconName: string) => {
    try {
        const module = await import('lucide-react')
        return (module as any)[iconName] || null
    } catch {
        return null
    }
}

// Application Logo Icon Preview
function AppLogoIconPreview({ iconName, iconColor, backgroundColor }: { iconName?: string; iconColor?: string; backgroundColor?: string }) {
    const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null>(null)

    useEffect(() => {
        if (iconName) {
            loadAppIcon(iconName).then(setIconComponent)
        } else {
            setIconComponent(null)
        }
    }, [iconName])

    if (!IconComponent) {
        return <div className="text-muted-foreground text-sm">No icon</div>
    }

    return (
        <IconComponent
            className="h-16 w-16"
            style={{
                color: iconColor || '#000000',
                backgroundColor: backgroundColor || '#ffffff'
            }}
        />
    )
}

interface ApplicationLogoTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    handleApplyBrandingColors: () => void
}

export function ApplicationLogoTab({ branding, setBranding, handleApplyBrandingColors }: ApplicationLogoTabProps) {
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            setBranding({
                ...branding,
                applicationLogo: reader.result as string,
                applicationLogoType: 'image'
            })
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="application-name" className="text-sm font-medium">
                        Application Name
                    </Label>
                    <Input
                        id="application-name"
                        value={branding.applicationName}
                        onChange={(e) => setBranding({ ...branding, applicationName: e.target.value })}
                        placeholder="Enter application name"
                        className="mt-2"
                    />
                </div>

                <div>
                    <Label className="text-sm font-medium">Application Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                        {/* Logo Preview */}
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {branding.applicationLogoType === 'icon' && branding.applicationLogoIcon ? (
                                <AppLogoIconPreview
                                    iconName={branding.applicationLogoIcon}
                                    iconColor={branding.applicationLogoIconColor}
                                    backgroundColor={branding.applicationLogoBackgroundColor}
                                />
                            ) : branding.applicationLogo ? (
                                <img
                                    src={branding.applicationLogo}
                                    alt="Application logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm text-center px-2">No logo</div>
                            )}
                        </div>

                        {/* Pen Icon Button with Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0" align="start">
                                <Tabs defaultValue={branding.applicationLogoType || 'image'}>
                                    <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                                        <TabsTrigger value="image" className="text-xs">Upload Image</TabsTrigger>
                                        <TabsTrigger value="icon" className="text-xs">Use Icon</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="image" className="p-4 space-y-4 mt-4">
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Upload Logo Image</Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="cursor-pointer"
                                            />
                                            {branding.applicationLogo && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 w-full"
                                                    onClick={() => setBranding({
                                                        ...branding,
                                                        applicationLogo: '',
                                                        applicationLogoType: 'image'
                                                    })}
                                                >
                                                    Remove Image
                                                </Button>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="icon" className="p-4 space-y-4 mt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Select Icon</Label>
                                                <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                                                    <IconPicker
                                                        value={branding.applicationLogoIcon || ''}
                                                        onChange={(iconName) => {
                                                            setBranding({
                                                                ...branding,
                                                                applicationLogoType: 'icon',
                                                                applicationLogoIcon: iconName,
                                                                applicationLogo: '' // Clear image when using icon
                                                            })
                                                        }}
                                                        placeholder="Search icons..."
                                                        grouped={true}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">Icon Color</Label>
                                                    <ColorInput
                                                        value={branding.applicationLogoIconColor || '#000000'}
                                                        onChange={(color) => {
                                                            setBranding({
                                                                ...branding,
                                                                applicationLogoIconColor: color
                                                            })
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">Background Color</Label>
                                                    <ColorInput
                                                        value={branding.applicationLogoBackgroundColor || '#ffffff'}
                                                        onChange={(color) => {
                                                            setBranding({
                                                                ...branding,
                                                                applicationLogoBackgroundColor: color
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </PopoverContent>
                        </Popover>
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
