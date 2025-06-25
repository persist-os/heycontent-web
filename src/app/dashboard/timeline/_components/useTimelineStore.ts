import { create } from 'zustand';

export type ZoomLevel = 'year' | 'month' | 'week';

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: 'post' | 'milestone' | 'level-up';
  persona?: {
    name: string;
    level: number;
    avatar?: string;
  };
  content?: {
    highlights?: string[];
    folders: Array<{
      color: string;
      count: number;
    }>;
  };
  streak?: number;
}

interface TimelineStore {
  zoomLevel: ZoomLevel;
  scrollPosition: number;
  visibleDateRange: {
    start: Date;
    end: Date;
  };
  events: TimelineEvent[];
  isLoading: boolean;
  
  // Actions
  setZoomLevel: (level: ZoomLevel) => void;
  setScrollPosition: (position: number) => void;
  setVisibleDateRange: (start: Date, end: Date) => void;
  addEvents: (events: TimelineEvent[]) => void;
  setLoading: (loading: boolean) => void;
}

// Helper function to get default date range for zoom level - use current dates
const getDefaultDateRange = (zoomLevel: ZoomLevel) => {
  const now = new Date();
  switch (zoomLevel) {
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek,
        end: endOfWeek,
      };
    default:
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
  }
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  zoomLevel: 'year',
  scrollPosition: 0,
  visibleDateRange: getDefaultDateRange('year'),
  events: [],
  isLoading: false,

  setZoomLevel: (level) => {
    const currentState = get();
    const currentRange = currentState.visibleDateRange;
    
    console.log('🔍 setZoomLevel called:', {
      from: currentState.zoomLevel,
      to: level,
      currentRange: {
        start: currentRange.start.toISOString(),
        end: currentRange.end.toISOString()
      }
    });
    
    // For month to week transition, find a week within the current month
    if (currentState.zoomLevel === 'month' && level === 'week') {
      // Find the first week that intersects with the current month
      const monthStart = new Date(currentRange.start.getFullYear(), currentRange.start.getMonth(), 1);
      const monthEnd = new Date(currentRange.start.getFullYear(), currentRange.start.getMonth() + 1, 0);
      
      // Find the first Monday of the month (or start of month if it's not Monday)
      const firstWeekStart = new Date(monthStart);
      const dayOfWeek = firstWeekStart.getDay();
      if (dayOfWeek !== 1) { // If not Monday
        firstWeekStart.setDate(firstWeekStart.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
      }
      
      // If first Monday is beyond the month, use the first day of month
      if (firstWeekStart > monthEnd) {
        firstWeekStart.setTime(monthStart.getTime());
      }
      
      const weekEnd = new Date(firstWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      console.log('✅ Month to Week transition:', {
        monthRange: {
          start: monthStart.toISOString(),
          end: monthEnd.toISOString()
        },
        newWeekRange: {
          start: firstWeekStart.toISOString(),
          end: weekEnd.toISOString()
        }
      });
      
      set({ 
        zoomLevel: level,
        visibleDateRange: { start: firstWeekStart, end: weekEnd }
      });
      return;
    }
    
    // For week to month transition, find the month containing the current week
    if (currentState.zoomLevel === 'week' && level === 'month') {
      const weekStart = currentRange.start;
      const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
      const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);
      
      set({ 
        zoomLevel: level,
        visibleDateRange: { start: monthStart, end: monthEnd }
      });
      return;
    }
    
    // For all other transitions, use default ranges
    const defaultRange = getDefaultDateRange(level);
    set({ 
      zoomLevel: level,
      visibleDateRange: defaultRange
    });
  },
  setScrollPosition: (position) => set({ scrollPosition: position }),
  setVisibleDateRange: (start, end) => set({ visibleDateRange: { start, end } }),
  addEvents: (newEvents) => set((state) => ({
    events: [...state.events, ...newEvents.filter(
      (newEvent) => !state.events.some((existing) => existing.id === newEvent.id)
    )],
  })),
  setLoading: (loading) => set({ isLoading: loading }),
})); 