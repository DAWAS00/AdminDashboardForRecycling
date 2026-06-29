import { create } from "zustand";

interface PartnerState {
  selectedClientId: string | null;
  filterTier: "all" | "free" | "basic" | "pro" | "enterprise";
  sortBy: "health" | "earnings" | "joined" | "renewal";

  selectClient: (id: string | null) => void;
  setFilterTier: (tier: PartnerState["filterTier"]) => void;
  setSortBy: (sort: PartnerState["sortBy"]) => void;
  reset: () => void;
}

const initialState = {
  selectedClientId: null as string | null,
  filterTier: "all" as PartnerState["filterTier"],
  sortBy: "health" as PartnerState["sortBy"],
};

export const usePartnerStore = create<PartnerState>((set) => ({
  ...initialState,
  selectClient: (id) =>
    set((s) => ({ selectedClientId: s.selectedClientId === id ? null : id })),
  setFilterTier: (filterTier) => set({ filterTier }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () => set(initialState),
}));
