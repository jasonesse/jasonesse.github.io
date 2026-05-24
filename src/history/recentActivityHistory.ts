type RecentActivityStore = {
  byCity: Record<string, string[]>;
};

const STORAGE_KEY = "crg_recent_activity_v1";
const MAX_ITEMS_PER_CITY = 60;

function cityKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

function parseStore(): RecentActivityStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byCity: {} };

    const parsed = JSON.parse(raw) as RecentActivityStore;
    if (!parsed || typeof parsed !== "object" || !parsed.byCity) {
      return { byCity: {} };
    }

    return parsed;
  } catch {
    return { byCity: {} };
  }
}

function persistStore(store: RecentActivityStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getRecentActivityIdsByCity(city: string, limit = 30): Set<string> {
  const key = cityKey(city);
  const store = parseStore();
  const list = store.byCity[key] ?? [];
  return new Set(list.slice(0, Math.max(0, limit)));
}

export function rememberActivitiesForCity(city: string, activityIds: string[]): void {
  if (activityIds.length === 0) return;

  const key = cityKey(city);
  const store = parseStore();
  const existing = store.byCity[key] ?? [];

  // Most recent IDs should appear first and never duplicate.
  const merged = [...activityIds, ...existing];
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const id of merged) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
    if (deduped.length >= MAX_ITEMS_PER_CITY) break;
  }

  store.byCity[key] = deduped;
  persistStore(store);
}

export function clearRecentActivitiesForCity(city: string): void {
  const key = cityKey(city);
  const store = parseStore();
  if (!store.byCity[key]) return;

  delete store.byCity[key];
  persistStore(store);
}
