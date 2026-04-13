'use client'

import { Box } from 'lucide-react'
import type { SectionProps } from './types'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

export function FooterSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the base footer area of the chat widget.
        </p>
      </div>

      <AccordionSectionWrapper defaultValue="footer">
        <AccordionSectionGroup id="footer" title="Footer Overview" icon={Box} defaultOpen>
          <div className="px-4 pb-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use the <strong>Regular Footer Section</strong> below for detailed customization of background colors, 
              padding, borders, and input field styling. This section serves as a high-level container for general footer visibility.
            </p>
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
