"use client"

import * as React from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CentralizedDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: React.ReactNode
    description?: React.ReactNode
    icon?: LucideIcon
    badge?: React.ReactNode
    headerActions?: React.ReactNode
    children: React.ReactNode
    width?: string
    zIndex?: number
    className?: string
    contentClassName?: string
    floating?: boolean
    floatingMargin?: string
}

export function CentralizedDrawer({
    open,
    onOpenChange,
    title,
    description,
    icon: Icon,
    badge,
    headerActions,
    children,
    width = "w-[720px]",
    zIndex,
    className,
    contentClassName,
    floating = true,
    floatingMargin = "16px"
}: CentralizedDrawerProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className={cn("h-screen flex flex-col", width, className)}
                style={zIndex ? { zIndex } : undefined}
                floating={floating}
                floatingMargin={floatingMargin}
            >
                <DrawerHeader className="border-b border-border/50 sticky top-0 bg-background z-10 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-5 w-5" />}
                            <DrawerTitle className="text-xl">
                                {title}
                            </DrawerTitle>
                            {badge && badge}
                        </div>
                        <div className="flex items-center gap-2">
                            {headerActions}
                            <DrawerClose asChild>
                                <Button variant="outline" size="sm">
                                    Close
                                </Button>
                            </DrawerClose>
                        </div>
                    </div>
                    {description && (
                        <div className="text-sm text-muted-foreground mt-1">
                            {description}
                        </div>
                    )}
                </DrawerHeader>

                <div className={cn("flex-1 overflow-hidden flex flex-col px-6 pb-6", contentClassName)}>
                    {children}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
