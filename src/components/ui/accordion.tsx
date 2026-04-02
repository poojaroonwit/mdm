"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Context for Accordion (manages which item is open)
interface AccordionContextValue {
  value: string;
  onValueChange: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

// Context for AccordionItem (passes open state to Trigger/Content)
interface AccordionItemContextValue {
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

// Accordion — supports both children-based API and legacy items-based API
interface AccordionProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
  // Legacy items-based API (kept for backward compatibility)
  items?: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
  }>;
}

export const Accordion = ({
  collapsible = false,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  className,
  children,
  items,
}: AccordionProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? (controlledValue as string) : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  // Legacy items-based rendering
  if (items) {
    return (
      <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, collapsible }}>
        <div className={cn("w-full space-y-3", className)}>
          {(items ?? []).map((item) => {
            const isOpen = value === item.id;
            const onToggle = () => {
              if (collapsible && value === item.id) {
                handleValueChange("");
              } else {
                handleValueChange(item.id);
              }
            };
            return (
              <AccordionItemContext.Provider key={item.id} value={{ isOpen, onToggle }}>
                <div className="border border-zinc-100/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden bg-zinc-50/30 dark:bg-zinc-950/20 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full justify-between items-center px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-300 group"
                  >
                    <span>{item.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-zinc-400 transition-transform duration-300",
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
                      <div className="px-5 pb-5 pt-0 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItemContext.Provider>
            );
          })}
        </div>
      </AccordionContext.Provider>
    );
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, collapsible }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// AccordionItem — container for each accordion entry
export const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext);
  const isOpen = context ? context.value === value : false;

  const onToggle = () => {
    if (!context) return;
    if (context.collapsible && context.value === value) {
      context.onValueChange("");
    } else {
      context.onValueChange(value);
    }
  };

  return (
    <AccordionItemContext.Provider value={{ isOpen, onToggle }}>
      <div ref={ref} className={cn("border-b border-zinc-100 dark:border-zinc-800", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = "AccordionItem";

// AccordionTrigger — clickable header with chevron
export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext);

  return (
    <button
      ref={ref}
      type="button"
      onClick={context?.onToggle}
      className={cn(
        "flex flex-1 w-full items-center justify-between py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white transition-all duration-300 hover:text-zinc-600 dark:hover:text-zinc-400 group",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-transform duration-300",
          context?.isOpen && "rotate-180"
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

// AccordionContent — animated content area
export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext);

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out",
        context?.isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden">
        <div ref={ref} className={cn("pb-5 pt-0 text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed", className)} {...props}>
          {children}
        </div>
      </div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent";
