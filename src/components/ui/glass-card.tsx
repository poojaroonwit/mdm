"use client";

import React, { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  variant?: "default" | "indigo";
}

export const GlassCard = ({ 
  children, 
  className, 
  gradient = false,
  variant = "default" 
}: GlassCardProps) => {
  const variantStyles = {
    default: "before:from-blue-500/10 before:to-purple-500/10",
    indigo: "before:from-indigo-500/20 before:to-indigo-600/10",
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/40 p-6 backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-black/20",
      gradient && [
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br",
        variantStyles[variant]
      ],
      "shadow-lg dark:shadow-none",
      className
    )}>
      {children}
    </div>
  );
};
