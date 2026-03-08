import { create } from 'zustand';
import { subDays, format } from 'date-fns';

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube';
export const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];

interface DashboardState {
  selectedClient: string;
  selectedPlatforms: Platform[];
  startDate: string;
  endDate: string;
  activeTab: string;
  setSelectedClient: (id: string) => void;
  togglePlatform: (p: Platform) => void;
  setAllPlatforms: () => void;
  setDateRange: (start: string, end: string) => void;
  setActiveTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedClient: 'client-1',
  selectedPlatforms: [...ALL_PLATFORMS],
  startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  activeTab: 'overview',

  setSelectedClient: (id) => set({ selectedClient: id }),

  togglePlatform: (p) =>
    set((state) => {
      const has = state.selectedPlatforms.includes(p);
      if (has && state.selectedPlatforms.length === 1) return state;
      const next = has
        ? state.selectedPlatforms.filter((x) => x !== p)
        : [...state.selectedPlatforms, p];
      return { selectedPlatforms: next };
    }),

  setAllPlatforms: () => set({ selectedPlatforms: [...ALL_PLATFORMS] }),

  setDateRange: (start, end) => set({ startDate: start, endDate: end }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
