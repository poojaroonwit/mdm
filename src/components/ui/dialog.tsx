"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useControlledDialogState, useDialogBodyScrollLock, useDialogEscapeKey } from "@/lib/dialog-utils"
import { Z_INDEX } from "@/lib/z-index"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

const Dialog = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const { open, setOpen } = useControlledDialogState({
    open: controlledOpen,
    onOpenChange,
    defaultOpen
  })

  useDialogBodyScrollLock(open)

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DialogContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(true)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        if (typeof (children as any).props?.onClick === 'function') {
          (children as any).props.onClick(e)
        }
      },
      ref: (node: HTMLButtonElement) => {
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(DialogContext)

  if (!context?.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in-0 duration-300",
        className
      )}
      style={{ zIndex: Z_INDEX.overlay }}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(DialogContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(false)
    props.onClick?.(e)
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    />
  )
})
DialogClose.displayName = "DialogClose"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(DialogContext)

  useDialogEscapeKey(
    context?.open ?? false,
    () => context?.setOpen(false),
    true
  )

  if (!context?.open) return null

  const content = (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-zinc-100/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 shadow-2xl duration-300 animate-in fade-in-0 zoom-in-95 sm:rounded-2xl overflow-hidden backdrop-blur-xl",
          className
        )}
        style={{ zIndex: Z_INDEX.dialog }}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-6 top-6 rounded-lg p-2 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogPortal>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left p-6 border-b border-zinc-100/60 dark:border-zinc-800/60",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50 leading-none",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-zinc-400 dark:text-zinc-500 font-medium", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
