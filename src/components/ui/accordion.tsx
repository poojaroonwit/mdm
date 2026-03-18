"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem = ({ id, title, children, defaultOpen = false }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/50 shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center px-5 py-4 text-left text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
  }>;
  className?: string;
  defaultOpen?: string;
}

export const Accordion = ({ items, className, defaultOpen }: AccordionProps) => {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {items.map((item) => (
        <AccordionItem 
          key={item.id} 
          id={item.id} 
          title={item.title}
          defaultOpen={item.id === defaultOpen}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

// Legacy sub-components for backward compatibility if needed, 
// though the new Accordion uses a single prop-based API.
export const AccordionTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("font-bold", className)}>{children}</div>
);

export const AccordionContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("text-sm", className)}>{children}</div>
);
