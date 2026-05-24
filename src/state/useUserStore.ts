import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserStore = {
  preferredCity: string;
  defaultChaos: number;
  setPreferredCity: (city: string) => void;
  setDefaultChaos: (level: number) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferredCity: "montreal",
      defaultChaos: 20,
      setPreferredCity: (city) => set({ preferredCity: city }),
      setDefaultChaos: (level) => set({ defaultChaos: level }),
    }),
    {
      name: "crg_user_prefs_v1",
      partialize: (state) => ({
        preferredCity: state.preferredCity,
        defaultChaos: state.defaultChaos,
      }),
    }
  )
);
