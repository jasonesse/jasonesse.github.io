import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdventureRadius, GroupDetails } from "../types";

type UserStore = {
  preferredCity: string;
  defaultChaos: number;
  defaultGroupDetails: GroupDetails;
  adventureRadius: AdventureRadius;
  preferredHubZoneId: string | null;
  iconicMode: boolean;
  setPreferredCity: (city: string) => void;
  setDefaultChaos: (level: number) => void;
  setDefaultGroupDetails: (details: GroupDetails) => void;
  setAdventureRadius: (radius: AdventureRadius) => void;
  setPreferredHubZoneId: (id: string | null) => void;
  setIconicMode: (on: boolean) => void;
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
      adventureRadius: "nearby",
      preferredHubZoneId: null,
      iconicMode: false,
      setPreferredCity: (city) => set({ preferredCity: city }),
      setDefaultChaos: (level) => set({ defaultChaos: level }),
      setDefaultGroupDetails: (details) => set({ defaultGroupDetails: details }),
      setAdventureRadius: (radius) => set({ adventureRadius: radius }),
      setPreferredHubZoneId: (id) => set({ preferredHubZoneId: id }),
      setIconicMode: (on) => set({ iconicMode: on }),
    }),
    {
      name: "crg_user_prefs_v2",
      partialize: (state) => ({
        preferredCity: state.preferredCity,
        defaultChaos: state.defaultChaos,
        defaultGroupDetails: state.defaultGroupDetails,
        adventureRadius: state.adventureRadius,
        preferredHubZoneId: state.preferredHubZoneId,
        iconicMode: state.iconicMode,
      }),
    }
  )
);
