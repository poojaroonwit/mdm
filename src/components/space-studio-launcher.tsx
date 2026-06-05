'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  Layout, 
  Sparkles, 
  ArrowRight, 
  Database, 
  BarChart3, 
  FileText,
  Zap,
  CheckCircle
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'

interface SpaceStudioLauncherProps {
  className?: string
}

export function SpaceStudioLauncher({ className }: SpaceStudioLauncherProps) {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleLaunchStudio = async () => {
    setIsNavigating(true)
    try {
      const spaceSlug = currentSpace?.slug || currentSpace?.id
      router.push(`/${spaceSlug}/studio`)
    } catch (error) {
      console.error('Failed to navigate to Space Studio:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  const features = [
    {
      icon: Database,
      title: 'Data Model Templates',
      description: 'Auto-generated templates for your data models'
    },
    {
      icon: Layout,
      title: 'Custom Layouts',
      description: 'Drag-and-drop page builder with components'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboards',
      description: 'Visual data representation and metrics'
    },
    {
      icon: FileText,
      title: 'Form Builders',
      description: 'Create custom forms for data entry'
    }
  ]

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Space Studio</CardTitle>
              <CardDescription>
                Advanced workspace customization and template management
              </CardDescription>
            </div>
          </div>
          <StatusBadge status="new">
            <Sparkles className="h-3 w-3 mr-1" />
            New
          </StatusBadge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <IconComponent className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Key Benefits:</h4>
          <div className="space-y-1">
            {[
              'Replace traditional entity pages with customizable templates',
              'Auto-generate templates for new data models',
              'Drag-and-drop page builder with 20+ components',
              'Version control and template management',
              'Advanced styling and layout options'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            onClick={handleLaunchStudio}
            disabled={isNavigating}
            className="w-full"
            size="lg"
          >
            {isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Launching...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Launch Space Studio
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <span>Pre-built Templates</span>
          <span className="font-medium">15+</span>
        </div>
      </CardContent>
    </Card>
  )
}
