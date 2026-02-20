import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Registration {
  workshopId: string;
  workshopName: string;
  name: string;
  phone: string;
  email: string;
  registeredAt: string;
}

interface StudioStore {
  registrations: Registration[];
  addRegistration: (reg: Registration) => void;
  isRegistered: (workshopId: string) => boolean;
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      registrations: [],
      addRegistration: (reg) =>
        set((state) => ({ registrations: [...state.registrations, reg] })),
      isRegistered: (workshopId) =>
        get().registrations.some((r) => r.workshopId === workshopId),
    }),
    { name: "art-studio-store" }
  )
);
