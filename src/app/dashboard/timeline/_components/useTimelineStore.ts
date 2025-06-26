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
  setZoomLevel: (level: ZoomLevel, centerDate?: Date) => void;
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

// Helper function to get date range for a zoom level centered on a given date
const getDateRangeForZoomLevel = (zoomLevel: ZoomLevel, centerDate: Date) => {
  switch (zoomLevel) {
    case 'year':
      return {
        start: new Date(centerDate.getFullYear(), 0, 1),
        end: new Date(centerDate.getFullYear(), 11, 31),
      };
    case 'month':
      return {
        start: new Date(centerDate.getFullYear(), centerDate.getMonth(), 1),
        end: new Date(centerDate.getFullYear(), centerDate.getMonth() + 1, 0),
      };
    case 'week':
      const startOfWeek = new Date(centerDate);
      startOfWeek.setDate(centerDate.getDate() - centerDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek,
        end: endOfWeek,
      };
    default:
      return getDefaultDateRange(zoomLevel);
  }
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  zoomLevel: 'year',
  scrollPosition: 0,
  visibleDateRange: getDefaultDateRange('year'),
  events: [],
  isLoading: false,

  setZoomLevel: (level, centerDate) => {
    const range = centerDate
      ? getDateRangeForZoomLevel(level, centerDate)
      : getDefaultDateRange(level);
    set({
      zoomLevel: level,
      visibleDateRange: range,
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