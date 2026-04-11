import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { RefreshCw, Image as ImageIcon } from 'lucide-react'
import { BrandingConfig } from '../../types'

interface LoginBackgroundTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    handleApplyBrandingColors: () => void
}

export function LoginBackgroundTab({ branding, setBranding, handleApplyBrandingColors }: LoginBackgroundTabProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Background Type</Label>
                <Select
                    value={branding.loginBackground.type}
                    onValueChange={(value) =>
                        setBranding({
                            ...branding,
                            loginBackground: {
                                ...branding.loginBackground,
                                type: value as 'color' | 'gradient' | 'image' | 'video',
                            },
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="color">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {branding.loginBackground.type === 'color' && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Background Color</Label>
                    <ColorInput
                        value={branding.loginBackground.color || '#1e40af'}
                        onChange={(color) =>
                            setBranding({
                                ...branding,
                                loginBackground: {
                                    ...branding.loginBackground,
                                    color,
                                },
                            })
                        }
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#1e40af"
                        inputClassName="h-7 text-xs pl-7 w-full"
                    />
                </div>
            )}

            {branding.loginBackground.type === 'gradient' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">From Color</Label>
                            <ColorInput
                                value={branding.loginBackground.gradient?.from || '#1e40af'}
                                onChange={(color) =>
                                    setBranding({
                                        ...branding,
                                        loginBackground: {
                                            ...branding.loginBackground,
                                            gradient: {
                                                ...branding.loginBackground.gradient!,
                                                from: color,
                                            },
                                        },
                                    })
                                }
                                allowImageVideo={false}
                                className="w-full"
                                placeholder="#1e40af"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">To Color</Label>
                            <ColorInput
                                value={branding.loginBackground.gradient?.to || '#1e40af'}
                                onChange={(color) =>
                                    setBranding({
                                        ...branding,
                                        loginBackground: {
                                            ...branding.loginBackground,
                                            gradient: {
                                                ...branding.loginBackground.gradient!,
                                                to: color,
                                            },
                                        },
                                    })
                                }
                                allowImageVideo={false}
                                className="w-full"
                                placeholder="#1e40af"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Angle (degrees)</Label>
                        <Input
                            type="number"
                            value={branding.loginBackground.gradient?.angle || 135}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    loginBackground: {
                                        ...branding.loginBackground,
                                        gradient: {
                                            ...branding.loginBackground.gradient!,
                                            angle: parseInt(e.target.value) || 135,
                                        },
                                    },
                                })
                            }
                            min={0}
                            max={360}
                            className="w-full"
                        />
                    </div>
                </div>
            )}

            {branding.loginBackground.type === 'image' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Image URL</Label>
                        <Input
                            value={branding.loginBackground.image || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    loginBackground: {
                                        ...branding.loginBackground,
                                        image: e.target.value,
                                    },
                                })
                            }
                            placeholder="https://example.com/image.jpg"
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                    setBranding({
                                        ...branding,
                                        loginBackground: {
                                            ...branding.loginBackground,
                                            image: reader.result as string,
                                        },
                                    })
                                }
                                reader.readAsDataURL(file)
                            }}
                            className="hidden"
                            id="bg-image-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('bg-image-upload')?.click()}
                            className="flex items-center gap-2"
                        >
                            <ImageIcon className="h-4 w-4" />
                            Upload Image
                        </Button>
                    </div>
                    {branding.loginBackground.image && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                            <img
                                src={branding.loginBackground.image}
                                alt="Login background"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>
            )}

            {branding.loginBackground.type === 'video' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Video URL</Label>
                        <Input
                            value={branding.loginBackground.video || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    loginBackground: {
                                        ...branding.loginBackground,
                                        video: e.target.value,
                                    },
                                })
                            }
                            placeholder="https://example.com/video.mp4"
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Supported formats: MP4, WebM. Video will autoplay and loop.
                        </p>
                    </div>
                    {branding.loginBackground.video && (
                         <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                            <video
                                src={branding.loginBackground.video}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    )}
                </div>
            )}

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
