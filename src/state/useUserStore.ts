import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GroupDetails } from "../types";

type UserStore = {
  preferredCity: string;
  defaultChaos: number;
  defaultGroupDetails: GroupDetails;
  setPreferredCity: (city: string) => void;
  setDefaultChaos: (level: number) => void;
  setDefaultGroupDetails: (details: GroupDetails) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferredCity: "montreal",
      defaultChaos: 20,
      defaultGroupDetails: {
        adults: 2,
        teenagers: 0,
        kids: 0,
      },
      setPreferredCity: (city) => set({ preferredCity: city }),
      setDefaultChaos: (level) => set({ defaultChaos: level }),
      setDefaultGroupDetails: (details) => set({ defaultGroupDetails: details }),
    }),
    {
      name: "crg_user_prefs_v1",
      partialize: (state) => ({
        preferredCity: state.preferredCity,
        defaultChaos: state.defaultChaos,
        defaultGroupDetails: state.defaultGroupDetails,
      }),
    }
  )
);
