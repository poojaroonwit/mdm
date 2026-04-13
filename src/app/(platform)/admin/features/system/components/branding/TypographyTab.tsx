import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
    RefreshCw,
    Type,
    Key,
    CornerUpRight,
    Minus,
    Sparkles,
    Box,
    Zap
} from 'lucide-react'
import { BrandingConfig } from '../../types'

interface TypographyTabProps {
    branding: BrandingConfig
    setBranding: (branding: BrandingConfig) => void
    handleApplyBrandingColors: () => void
    googleFonts: string[]
}

export function TypographyTab({ branding, setBranding, handleApplyBrandingColors, googleFonts }: TypographyTabProps) {
    const popularFonts = [
        'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
        'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Poppins',
        'Inter', 'Rubik', 'Ubuntu', 'Playfair Display', 'Work Sans', 'Fira Sans'
    ];

    const fontOptions = googleFonts.length > 0 ? googleFonts : popularFonts;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    Google Fonts API Key
                </Label>
                <Input
                    value={branding.googleFontsApiKey || ''}
                    onChange={(e) => setBranding({ ...branding, googleFontsApiKey: e.target.value })}
                    placeholder="Enter your Google Fonts API Key for dynamic list"
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    Leave empty to use a default list of popular Google Fonts.
                </p>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold mb-4">Font Settings</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Font Family
                        </Label>
                        <Select
                            value={branding.globalStyling.fontFamily || 'default'}
                            onValueChange={(value) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, fontFamily: value === 'default' ? '' : value },
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="default">Default System Font</SelectItem>
                                {fontOptions.map((font) => (
                                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                        {font}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            Monospaced Font Family
                        </Label>
                        <Input
                            value={branding.globalStyling.fontFamilyMono || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, fontFamilyMono: e.target.value },
                                })
                            }
                            placeholder='"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace'
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Used for code, prompts, and parameters
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold mb-4">Border & Spacing</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Border Radius
                        </Label>
                        <Input
                            value={branding.globalStyling.borderRadius || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, borderRadius: e.target.value },
                                })
                            }
                            placeholder="10px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Border Width
                        </Label>
                        <Input
                            value={branding.globalStyling.borderWidth || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, borderWidth: e.target.value },
                                })
                            }
                            placeholder="0.5px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Button Border Radius
                        </Label>
                        <Input
                            value={branding.globalStyling.buttonBorderRadius || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, buttonBorderRadius: e.target.value },
                                })
                            }
                            placeholder="10px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Button Border Width
                        </Label>
                        <Input
                            value={branding.globalStyling.buttonBorderWidth || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, buttonBorderWidth: e.target.value },
                                })
                            }
                            placeholder="0px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Input Border Radius
                        </Label>
                        <Input
                            value={branding.globalStyling.inputBorderRadius || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, inputBorderRadius: e.target.value },
                                })
                            }
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Input Border Width
                        </Label>
                        <Input
                            value={branding.globalStyling.inputBorderWidth || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, inputBorderWidth: e.target.value },
                                })
                            }
                            placeholder="0.5px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Select Border Radius
                        </Label>
                        <Input
                            value={branding.globalStyling.selectBorderRadius || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, selectBorderRadius: e.target.value },
                                })
                            }
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Select Border Width
                        </Label>
                        <Input
                            value={branding.globalStyling.selectBorderWidth || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, selectBorderWidth: e.target.value },
                                })
                            }
                            placeholder="0.5px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <CornerUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            Textarea Border Radius
                        </Label>
                        <Input
                            value={branding.globalStyling.textareaBorderRadius || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, textareaBorderRadius: e.target.value },
                                })
                            }
                            placeholder="8px"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            Textarea Border Width
                        </Label>
                        <Input
                            value={branding.globalStyling.textareaBorderWidth || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, textareaBorderWidth: e.target.value },
                                })
                            }
                            placeholder="0.5px"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold mb-4">Animations & Transitions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                            Transition Duration
                        </Label>
                        <Input
                            value={branding.globalStyling.transitionDuration || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, transitionDuration: e.target.value },
                                })
                            }
                            placeholder="200ms"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                            Transition Timing
                        </Label>
                        <Input
                            value={branding.globalStyling.transitionTiming || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, transitionTiming: e.target.value },
                                })
                            }
                            placeholder="cubic-bezier(0.4, 0, 0.2, 1)"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-xs font-semibold mb-4">Shadows</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-muted-foreground" />
                            Shadow Small
                        </Label>
                        <Input
                            value={branding.globalStyling.shadowSm || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, shadowSm: e.target.value },
                                })
                            }
                            placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-muted-foreground" />
                            Shadow Medium
                        </Label>
                        <Input
                            value={branding.globalStyling.shadowMd || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, shadowMd: e.target.value },
                                })
                            }
                            placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-muted-foreground" />
                            Shadow Large
                        </Label>
                        <Input
                            value={branding.globalStyling.shadowLg || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, shadowLg: e.target.value },
                                })
                            }
                            placeholder="0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-muted-foreground" />
                            Shadow Extra Large
                        </Label>
                        <Input
                            value={branding.globalStyling.shadowXl || ''}
                            onChange={(e) =>
                                setBranding({
                                    ...branding,
                                    globalStyling: { ...branding.globalStyling, shadowXl: e.target.value },
                                })
                            }
                            placeholder="0 20px 25px -5px rgba(0, 0, 0, 0.1)"
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
