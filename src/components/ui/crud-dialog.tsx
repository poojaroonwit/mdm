"use client"

import * as React from "react"

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CrudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  trigger?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  contentClassName?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  footer,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: CrudDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn("p-0 overflow-hidden", contentClassName)}>
        <DialogHeader className={cn("p-6 pb-2", headerClassName)}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody className={cn("p-6 pt-2 pb-4", bodyClassName)}>
          {children}
        </DialogBody>
        {footer ? (
          <DialogFooter className={cn("p-6 pt-2", footerClassName)}>
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
