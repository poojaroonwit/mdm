'use client'

import { Label } from '@/components/ui/label'

interface FormRowProps {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * A 2-column form row component for style configuration.
 * Left column: label and optional description
 * Right column: input component(s)
 */
export function FormRow({ label, description, children, className = '' }: FormRowProps) {
  return (
    <div className={`grid grid-cols-[1fr_1.2fr] gap-4 items-start py-2 ${className}`}>
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  )
}

/**
 * A wrapper for form sections with consistent padding and dividers
 */
export function FormSection({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .form-section-divider > * + * {
            border-top: 1px solid hsl(var(--border)) !important;
          }
        `
      }} />
      <div className={`form-section-divider divide-y divide-border ${className}`}>
        {children}
      </div>
    </>
  )
}
