import { create } from "zustand";

interface TripStore {
  selectedTripId: number | null;

  setSelectedTripId: (id: number) => void;
}

export const useTripStore =
  create<TripStore>((set) => ({
    selectedTripId: null,

    setSelectedTripId: (id) =>
      set({
        selectedTripId: id
      })
  }));