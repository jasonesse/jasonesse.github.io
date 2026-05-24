import { create } from "zustand";
import type { DayRun, GeneratedActivity, TimeSlot } from "../types";

const STORAGE_KEY = "crg_current_session_v1";

type PersistedRunSession = {
  sessionDate: string;
  run: DayRun | null;
  keptIds: string[];
  recentActivityIds: string[];
};

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadPersistedSession(): PersistedRunSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedRunSession;
    if (!parsed || typeof parsed !== "object") return null;

    if (parsed.sessionDate !== getTodayKey()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const run = parsed.run
      ? {
          ...parsed.run,
          groupDetails: parsed.run.groupDetails ?? {
            adults: 1,
            teenagers: 0,
            kids: 0,
          },
        }
      : null;

    return {
      sessionDate: parsed.sessionDate,
      run,
      keptIds: Array.isArray(parsed.keptIds) ? parsed.keptIds : [],
      recentActivityIds: Array.isArray(parsed.recentActivityIds)
        ? parsed.recentActivityIds
        : [],
    };
  } catch {
    return null;
  }
}

function persistSession(state: {
  sessionDate: string;
  run: DayRun | null;
  keptIds: Set<string>;
  recentActivityIds: string[];
}): void {
  const payload: PersistedRunSession = {
    sessionDate: state.sessionDate,
    run: state.run,
    keptIds: [...state.keptIds],
    recentActivityIds: state.recentActivityIds,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

type RunStore = {
  sessionDate: string;
  run: DayRun | null;
  keptIds: Set<string>;
  recentActivityIds: string[];
  ensureCurrentDay: () => void;
  setRun: (run: DayRun) => void;
  rerollActivity: (updated: GeneratedActivity) => void;
  removeActivityBySlot: (slot: TimeSlot) => void;
  keepActivity: (id: string) => void;
  clearRun: () => void;
};

const initial = loadPersistedSession();

export const useRunStore = create<RunStore>((set, get) => ({
  sessionDate: initial?.sessionDate ?? getTodayKey(),
  run: initial?.run ?? null,
  keptIds: new Set(initial?.keptIds ?? []),
  recentActivityIds: initial?.recentActivityIds ?? [],

  ensureCurrentDay: () => {
    const today = getTodayKey();
    if (get().sessionDate === today) return;

    localStorage.removeItem(STORAGE_KEY);
    set({
      sessionDate: today,
      run: null,
      keptIds: new Set(),
      recentActivityIds: [],
    });
  },

  setRun: (run) => {
    const next = {
      sessionDate: getTodayKey(),
      run,
      keptIds: new Set<string>(),
      recentActivityIds: run.activities.map((a) => a.id).slice(-10),
    };
    set(next);
    persistSession(next);
  },

  rerollActivity: (updated) =>
    set((state) => {
      if (!state.run) return state;
      const nextRun = {
        ...state.run,
        activities: state.run.activities.map((a) =>
          a.timeSlot === updated.timeSlot ? updated : a
        ),
      };
      const recentActivityIds = [...state.recentActivityIds, updated.id].slice(-10);
      persistSession({
        sessionDate: state.sessionDate,
        run: nextRun,
        keptIds: state.keptIds,
        recentActivityIds,
      });
      return {
        run: nextRun,
        recentActivityIds,
      };
    }),

  removeActivityBySlot: (slot) =>
    set((state) => {
      if (!state.run) return state;
      const nextRun = {
        ...state.run,
        activities: state.run.activities.filter((a) => a.timeSlot !== slot),
      };
      persistSession({
        sessionDate: state.sessionDate,
        run: nextRun,
        keptIds: state.keptIds,
        recentActivityIds: state.recentActivityIds,
      });
      return {
        run: nextRun,
      };
    }),

  keepActivity: (id) =>
    set((state) => {
      const next = new Set(state.keptIds);
      next.add(id);
      persistSession({
        sessionDate: state.sessionDate,
        run: state.run,
        keptIds: next,
        recentActivityIds: state.recentActivityIds,
      });
      return { keptIds: next };
    }),

  clearRun: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ run: null, keptIds: new Set(), recentActivityIds: [] });
  },
}));
