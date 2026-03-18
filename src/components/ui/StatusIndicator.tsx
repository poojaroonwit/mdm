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
    online: "bg-green-500",
    success: "bg-green-500",
    away: "bg-amber-500",
    warning: "bg-amber-500",
    busy: "bg-red-500",
    error: "bg-red-500",
    offline: "bg-slate-400 dark:bg-slate-600",
    info: "bg-blue-500",
  };

  const sizeStyles = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
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
          "rounded-full ring-2 ring-white dark:ring-slate-950",
          statusStyles[status],
          sizeStyles[size]
        )} />
      </div>
      {label && (
        <span className={cn(
          "font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300",
          size === "sm" ? "text-[8px]" : size === "md" ? "text-[10px]" : "text-xs"
        )}>
          {label}
        </span>
      )}
    </div>
  );
};
