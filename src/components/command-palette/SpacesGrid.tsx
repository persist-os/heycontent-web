'use client'

import { T } from '@/components/translation'
import { SpaceCard } from './SpaceCard'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  dataAttr: string;
  category: string;
}

interface SpacesGridProps {
  items: NavItem[];
  isItemActive: (item: NavItem) => boolean;
  onNavigate: (href: string) => void;
}

export function SpacesGrid({ items, isItemActive, onNavigate }: SpacesGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="p-6">
      <h3 className="text-sm font-light text-muted-foreground/70 mb-4 tracking-wide">
        <T context="dashboard_nav.section.spaces">Spaces</T>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <SpaceCard
            key={item.id}
            id={item.id}
            label={item.label}
            description={item.description}
            icon={item.icon}
            isActive={isItemActive(item)}
            onClick={() => onNavigate(item.href)}
            dataAttr={item.dataAttr}
          />
        ))}
      </div>
    </div>
  );
}

