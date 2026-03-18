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
      "relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-900/40",
      gradient && [
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br",
        variantStyles[variant]
      ],
      "shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-none",
      className
    )}>
      {children}
    </div>
  );
};
