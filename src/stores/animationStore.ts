import { create } from "zustand";
import type { ActiveRoute, CompletedTrip } from "../app/types";

interface AnimationState {
  activeRoute: ActiveRoute | null;
  completedTrips: CompletedTrip[];

  setActiveRoute: (route: ActiveRoute | null) => void;
  updateRouteProgress: (coordIndex: number) => void;
  completeTrip: (trip: CompletedTrip) => void;
  reset: () => void;
}

const initialState = {
  activeRoute: null as ActiveRoute | null,
  completedTrips: [] as CompletedTrip[],
};

export const useAnimationStore = create<AnimationState>((set) => ({
  ...initialState,
  setActiveRoute: (activeRoute) => set({ activeRoute }),
  updateRouteProgress: (coordIndex) =>
    set((s) => {
      if (!s.activeRoute) return s;
      const progressPct = Math.round(
        (coordIndex / Math.max(s.activeRoute.route.coords.length - 1, 1)) * 100
      );
      return { activeRoute: { ...s.activeRoute, currentCoordIndex: coordIndex, progressPct } };
    }),
  completeTrip: (trip) =>
    set((s) => ({ activeRoute: null, completedTrips: [...s.completedTrips, trip] })),
  reset: () => set(initialState),
}));
