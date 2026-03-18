'use client'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'

export function FooterSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="footer" className="border-b border-border/50 px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Footer
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <p className="text-sm text-muted-foreground">
          Configure the footer area styling and appearance. Use the Regular Footer Section for detailed customization options.
        </p>
      </AccordionContent>
    </AccordionItem>
  )
}

