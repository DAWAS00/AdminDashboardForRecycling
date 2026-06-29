import { create } from "zustand";

interface HubState {
  selectedHubId: string | null;
  placingHub: boolean;
  pendingCoords: { lat: number; lng: number } | null;

  selectHub: (id: string | null) => void;
  startPlacing: () => void;
  cancelPlacing: () => void;
  confirmCoords: (coords: { lat: number; lng: number }) => void;
  reset: () => void;
}

const initialState = {
  selectedHubId: null as string | null,
  placingHub: false,
  pendingCoords: null as { lat: number; lng: number } | null,
};

export const useHubStore = create<HubState>((set) => ({
  ...initialState,
  selectHub: (id) =>
    set((s) => ({ selectedHubId: s.selectedHubId === id ? null : id })),
  startPlacing: () => set({ placingHub: true, pendingCoords: null }),
  cancelPlacing: () => set({ placingHub: false, pendingCoords: null }),
  confirmCoords: (coords) => set({ pendingCoords: coords, placingHub: false }),
  reset: () => set(initialState),
}));
