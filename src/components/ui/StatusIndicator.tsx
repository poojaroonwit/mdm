"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StatusType = "online" | "away" | "busy" | "offline" | "success" | "warning" | "error" | "info";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

export const StatusIndicator = ({
  status,
  label,
  size = "md",
  className,
  pulse = false,
}: StatusIndicatorProps) => {
  const statusStyles = {
    online: "bg-emerald-500",
    success: "bg-emerald-500",
    away: "bg-amber-500",
    warning: "bg-amber-500",
    busy: "bg-red-500",
    error: "bg-red-500",
    offline: "bg-zinc-400 dark:bg-zinc-600",
    info: "bg-blue-500",
  };

  const sizeStyles = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        {pulse && status !== "offline" && (
          <span className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            statusStyles[status]
          )} />
        )}
        <div className={cn(
          "rounded-full ring-2 ring-white dark:ring-zinc-950",
          statusStyles[status],
          sizeStyles[size]
        )} />
      </div>
      {label && (
        <span className={cn(
          "font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500",
          size === "sm" ? "text-[8px]" : size === "md" ? "text-[9px]" : "text-[10px]"
        )}>
          {label}
        </span>
      )}
    </div>
  );
};
