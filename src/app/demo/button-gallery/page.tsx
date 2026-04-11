'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ButtonGalleryPage() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Button Gallery</h1>
        <p className="text-muted-foreground text-lg">
          Showcase of the new Premium and Classic button styles added to the design system.
        </p>
      </div>

      {/* Premium Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Premium Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 flex flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Luxury</span>
            <Button variant="luxury" size="lg">Unlock Premium</Button>
            <p className="text-xs text-center text-muted-foreground italic">Deep Navy Gradient + Indigo Glow</p>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center space-y-4 bg-slate-950 text-white">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Glass</span>
            <Button variant="glass" size="lg">Get Started</Button>
            <p className="text-xs text-center text-slate-500 italic">Frosted Glassmorphism (Best on Dark/Images)</p>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center space-y-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Classic Gradient</span>
            <Button variant="gradient" size="lg">Join Now</Button>
            <p className="text-xs text-center text-muted-foreground italic">Blue to Indigo (User Request)</p>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center space-y-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Soft Tint</span>
            <Button variant="soft" size="lg">Learn More</Button>
            <p className="text-xs text-center text-muted-foreground italic">Subtle Indigo Background</p>
          </Card>
        </div>
      </section>

      {/* Core Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Core Variants</h2>
        <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Sizes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Sizes</h2>
        <div className="flex flex-wrap gap-4 items-end">
            <Button variant="luxury" size="sm">Small</Button>
            <Button variant="luxury" size="md">Medium</Button>
            <Button variant="luxury" size="lg">Large</Button>
            <Button variant="luxury" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
        </div>
      </section>
    </div>
  )
}
