import { format } from 'date-fns';
import { SearchFilter } from './types';

interface ActiveFiltersProps {
  filters: SearchFilter;
}

export function ActiveFilters({ filters }: ActiveFiltersProps) {
  if (!filters.type && !filters.dateRange && !filters.tags?.length && !filters.status) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex flex-wrap gap-2">
      {filters.type && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Type: {filters.type}
        </span>
      )}
      {filters.dateRange && (
        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
          Date: {format(filters.dateRange.start, 'MMM d')} — {format(filters.dateRange.end, 'MMM d')}
        </span>
      )}
      {filters.tags?.map(tag => (
        <span key={tag} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
          Tag: {tag}
        </span>
      ))}
      {filters.status && (
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          Status: {filters.status}
        </span>
      )}
    </div>
  );
} 