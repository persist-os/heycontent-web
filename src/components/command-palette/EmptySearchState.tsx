'use client'

import { Search } from 'lucide-react'
import { T } from '@/components/translation'

export function EmptySearchState() {
  return (
    <div className="p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center">
        <Search className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        <T context="dashboard_nav.empty_state.no_results">No results found</T>
      </h3>
      <p className="text-sm text-muted-foreground/60 font-light max-w-xs mx-auto">
        <T context="dashboard_nav.empty_state.try_adjusting">Try adjusting your search or explore available spaces above</T>
      </p>
    </div>
  );
}

