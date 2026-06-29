import { create } from "zustand";

interface FleetState {
  selectedRiderId: string | null;
  filterStatus: "all" | "delivering" | "picking_up" | "idle" | "offline";
  showFleetRadar: boolean;

  selectRider: (id: string | null) => void;
  setFilterStatus: (status: FleetState["filterStatus"]) => void;
  toggleFleetRadar: () => void;
  reset: () => void;
}

const initialState = {
  selectedRiderId: null as string | null,
  filterStatus: "all" as FleetState["filterStatus"],
  showFleetRadar: false,
};

export const useFleetStore = create<FleetState>((set) => ({
  ...initialState,
  selectRider: (id) =>
    set((s) => ({ selectedRiderId: s.selectedRiderId === id ? null : id })),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  toggleFleetRadar: () => set((s) => ({ showFleetRadar: !s.showFleetRadar })),
  reset: () => set(initialState),
}));
