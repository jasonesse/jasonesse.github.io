import { create } from "zustand";

type UserStore = {
  preferredCity: string;
  defaultChaos: number;
  setPreferredCity: (city: string) => void;
  setDefaultChaos: (level: number) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  preferredCity: "montreal",
  defaultChaos: 50,
  setPreferredCity: (city) => set({ preferredCity: city }),
  setDefaultChaos: (level) => set({ defaultChaos: level }),
}));
