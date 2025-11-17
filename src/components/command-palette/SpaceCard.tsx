'use client'

import { LucideIcon } from 'lucide-react'
import { T } from '@/components/translation'
import { BaseCard } from '@/components/ui/base-card'
import { cn } from '@/lib/utils'

interface SpaceCardProps {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  dataAttr: string;
}

export function SpaceCard({
  id,
  label,
  description,
  icon: Icon,
  isActive,
  onClick,
  dataAttr,
}: SpaceCardProps) {
  return (
    <BaseCard
      variant="space"
      onClick={onClick}
      className={cn(
        "w-full flex flex-col gap-3 p-5 transition-all duration-200 text-left group",
        isActive && "bg-primary/10 border-primary/20",
        !isActive && "bg-muted/30 border-border/30 hover:bg-muted/50"
      )}
      {...{[dataAttr]: true}}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm flex-shrink-0",
          isActive && "bg-primary/20",
          !isActive && "bg-muted/40 group-hover:bg-muted/60"
        )}>
          <Icon className={cn(
            "w-6 h-6 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )} />
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors">
          <T context={`dashboard_nav.nav_item.${id}.label`}>{label}</T>
        </h4>
        <p className="text-sm text-muted-foreground font-light leading-relaxed">
          <T context={`dashboard_nav.nav_item.${id}.description`}>{description}</T>
        </p>
      </div>
    </BaseCard>
  );
}

