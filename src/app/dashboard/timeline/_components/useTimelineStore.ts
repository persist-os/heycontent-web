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

export const useTimelineStore = create<TimelineStore>((set, get) => {
  return {
    zoomLevel: 'year',
    scrollPosition: 0,
    // Force fresh current date calculation on every store creation
    visibleDateRange: (() => {
      const currentDate = new Date();
      return {
        start: new Date(currentDate.getFullYear(), 0, 1),
        end: new Date(currentDate.getFullYear(), 11, 31),
      };
    })(),
    events: [],
    isLoading: false,

    setZoomLevel: (level) => {
      // Just set the zoom level without changing the visible date range
      // The calling code (wheel zoom, buttons) will handle date range updates if needed
      set({ 
        zoomLevel: level
      });
    },
    setScrollPosition: (position) => set({ scrollPosition: position }),
    setVisibleDateRange: (start, end) => {
      set({ visibleDateRange: { start, end } });
    },
    addEvents: (newEvents) => set((state) => ({
      events: [...state.events, ...newEvents.filter(
        (newEvent) => !state.events.some((existing) => existing.id === newEvent.id)
      )],
    })),
    setLoading: (loading) => set({ isLoading: loading }),
  };
}); 