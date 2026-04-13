'use client'

interface SectionGroupProps {
  title: string
  children: React.ReactNode
  isFirst?: boolean
}

export function SectionGroup({ 
  title, 
  children, 
  isFirst = false 
}: SectionGroupProps) {
  return (
    <div className={isFirst ? "mb-6" : "border-t border-border/50 pt-6 mb-6"}>
      <h4 className="text-sm font-semibold mb-4 text-foreground">{title}</h4>
      {children}
    </div>
  )
}

