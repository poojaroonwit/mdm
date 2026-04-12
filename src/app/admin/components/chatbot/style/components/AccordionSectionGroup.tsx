'use client'

import * as React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionSectionContextValue {
    value: string
    onValueChange: (value: string) => void
}

const AccordionSectionContext = React.createContext<AccordionSectionContextValue | undefined>(undefined)

interface AccordionSectionWrapperProps {
    children: React.ReactNode
    defaultValue?: string
    className?: string
}

export function AccordionSectionWrapper({
    children,
    defaultValue,
    className
}: AccordionSectionWrapperProps) {
    const [value, setValue] = React.useState<string>(defaultValue || '')

    return (
        <AccordionSectionContext.Provider value={{ value, onValueChange: setValue }}>
            <Accordion
                type="single"
                collapsible
                value={value}
                onValueChange={(val) => setValue(val as string)}
            >
                <div className={cn(className)}>
                    {children}
                </div>
            </Accordion>
        </AccordionSectionContext.Provider>
    )
}

interface AccordionSectionGroupProps {
    id: string
    title: string
    icon?: LucideIcon
    children: React.ReactNode
    defaultOpen?: boolean
}

export function AccordionSectionGroup({
    id,
    title,
    icon: Icon,
    children,
    defaultOpen = false
}: AccordionSectionGroupProps) {
    const context = React.useContext(AccordionSectionContext)

    // Set default value on mount if defaultOpen is true
    React.useEffect(() => {
        if (defaultOpen && context && !context.value) {
            context.onValueChange(id)
        }
    }, [defaultOpen, id, context])

    return (
        <AccordionItem 
            value={id} 
            className="border-b border-border/50 px-4 last:border-b-0"
        >
            <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">{title}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
                {children}
            </AccordionContent>
        </AccordionItem>
    )
}
