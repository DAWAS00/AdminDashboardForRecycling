import { create } from "zustand";
import type { HeatMapViewMode, MaterialFilter } from "../app/types";

interface HeatmapState {
  viewMode: HeatMapViewMode;
  materialFilter: MaterialFilter;
  selectedDistrict: string | null;
  selectedPeriod: "today" | "week" | "month" | "custom";
  customDateRange: { from: Date; to: Date } | null;
  
  // Timeline Animation States
  timeOfDay: "morning" | "afternoon" | "evening";
  isPlaying: boolean;

  setViewMode: (mode: HeatMapViewMode) => void;
  setMaterialFilter: (filter: MaterialFilter) => void;
  selectDistrict: (name: string | null) => void;
  toggleDistrict: (name: string) => void;
  setPeriod: (period: HeatmapState["selectedPeriod"]) => void;
  setCustomRange: (range: { from: Date; to: Date } | null) => void;
  
  // Timeline Actions
  setTimeOfDay: (time: "morning" | "afternoon" | "evening") => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  reset: () => void;
}

const initialState = {
  viewMode: "overview" as HeatMapViewMode,
  materialFilter: "all" as MaterialFilter,
  selectedDistrict: null as string | null,
  selectedPeriod: "week" as HeatmapState["selectedPeriod"],
  customDateRange: null as { from: Date; to: Date } | null,
  timeOfDay: "morning" as "morning" | "afternoon" | "evening",
  isPlaying: false,
};

export const useHeatmapStore = create<HeatmapState>((set) => ({
  ...initialState,
  setViewMode: (viewMode) => set({ viewMode }),
  setMaterialFilter: (materialFilter) => set({ materialFilter }),
  selectDistrict: (selectedDistrict) => set({ selectedDistrict }),
  toggleDistrict: (name) =>
    set((s) => ({ selectedDistrict: s.selectedDistrict === name ? null : name })),
  setPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setCustomRange: (customDateRange) => set({ customDateRange }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  reset: () => set(initialState),
}));
