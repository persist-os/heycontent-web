/**
 * Types for Recent Activity feature
 * 
 * NOTE: All useQuery calls are now in RecentActivityTable component
 * per convex-frontend-data-display.md rule (components call useQuery directly)
 */

export type ActivityItemType = 'note' | 'artifact' | 'chat' | 'assignment';

export interface RecentActivityItem {
  id: string;
  name: string;
  type: ActivityItemType;
  lastOpened: number;
  url?: string;
}

