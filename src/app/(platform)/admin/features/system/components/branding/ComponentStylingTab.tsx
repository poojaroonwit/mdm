import { Button } from '@/components/ui/button'
import { Moon, RefreshCw, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandingConfig } from '../../types'
import { ComponentStyleFields } from './ComponentStyleFields'

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
            <div className="flex items-center justify-end">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(false)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                            !isDarkMode
                                ? 'bg-background text-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Sun className={cn('h-4 w-4', !isDarkMode ? 'text-amber-500' : 'text-muted-foreground')} />
                        <span>Light</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(true)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                            isDarkMode
                                ? 'bg-background text-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Moon className={cn('h-4 w-4', isDarkMode ? 'text-blue-500' : 'text-muted-foreground')} />
                        <span>Dark</span>
                    </button>
                </div>
            </div>

            <ComponentStyleFields
                activeComponent={activeComponent}
                currentMode={currentMode}
                currentStyling={currentStyling}
                updateComponentStyling={updateComponentStyling}
            />

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
