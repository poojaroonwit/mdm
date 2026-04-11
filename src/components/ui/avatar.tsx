import * as React from "react"

import { cn } from "@/lib/utils"

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-primary-light dark:border-primary-blue-light shadow-none",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, ...props }, ref) => {
    const [error, setError] = React.useState(false)
    
    if (error || !src || src === '') return null
    
    return (
      <img
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        onError={() => setError(true)}
        src={src}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-primary-blue-light/50 dark:bg-primary-blue-light/20 text-primary-brand dark:text-primary-blue font-black uppercase tracking-widest text-[11px]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
