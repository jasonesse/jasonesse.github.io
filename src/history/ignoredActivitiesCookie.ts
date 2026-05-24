export type IgnoredActivity = {
  id: string;
  label: string;
  category?: string;
  ignoredAt: number;
};

type IgnoredStore = {
  byCity: Record<string, IgnoredActivity[]>;
};

const COOKIE_NAME = "crg_ignored_activity_v1";
const MAX_COOKIE_CHARS = 3500;
const MAX_ITEMS_PER_CITY = 200;

function cityKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

function readCookieValue(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) {
      return c.slice(name.length + 1);
    }
  }
  return null;
}

function writeCookieValue(name: string, value: string): void {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${value}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
}

function parseStore(): IgnoredStore {
  const raw = readCookieValue(COOKIE_NAME);
  if (!raw) return { byCity: {} };

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as IgnoredStore;
    if (!parsed.byCity || typeof parsed.byCity !== "object") {
      return { byCity: {} };
    }
    return parsed;
  } catch {
    return { byCity: {} };
  }
}

function persistStore(store: IgnoredStore): void {
  for (const key of Object.keys(store.byCity)) {
    const dedupedMap = new Map<string, IgnoredActivity>();
    for (const item of store.byCity[key]) {
      dedupedMap.set(item.id, item);
    }

    const sorted = [...dedupedMap.values()]
      .sort((a, b) => b.ignoredAt - a.ignoredAt)
      .slice(0, MAX_ITEMS_PER_CITY);

    store.byCity[key] = sorted;
  }

  let serialized = encodeURIComponent(JSON.stringify(store));

  // Drop the oldest item from the largest city bucket until it fits.
  while (serialized.length > MAX_COOKIE_CHARS) {
    const entries = Object.entries(store.byCity).filter(([, arr]) => arr.length > 0);
    if (entries.length === 0) break;

    entries.sort((a, b) => b[1].length - a[1].length);
    const [largestCity] = entries[0];
    store.byCity[largestCity].pop();

    if (store.byCity[largestCity].length === 0) {
      delete store.byCity[largestCity];
    }

    serialized = encodeURIComponent(JSON.stringify(store));
  }

  writeCookieValue(COOKIE_NAME, serialized);
}

export function ignoreActivityForCity(
  city: string,
  activity: { id: string; label: string; category?: string }
): void {
  const key = cityKey(city);
  const store = parseStore();

  const next: IgnoredActivity = {
    id: activity.id,
    label: activity.label,
    category: activity.category,
    ignoredAt: Date.now(),
  };

  const existing = store.byCity[key] ?? [];
  store.byCity[key] = [next, ...existing];

  persistStore(store);
}

export function reactivateIgnoredActivity(city: string, activityId: string): void {
  const key = cityKey(city);
  const store = parseStore();

  const existing = store.byCity[key] ?? [];
  store.byCity[key] = existing.filter((item) => item.id !== activityId);

  if (store.byCity[key].length === 0) {
    delete store.byCity[key];
  }

  persistStore(store);
}

export function getIgnoredActivitiesByCity(city: string): IgnoredActivity[] {
  const key = cityKey(city);
  const store = parseStore();
  return store.byCity[key] ?? [];
}

export function getIgnoredActivityIdsByCity(city: string): Set<string> {
  return new Set(getIgnoredActivitiesByCity(city).map((item) => item.id));
}

export function getIgnoredCities(): string[] {
  const store = parseStore();
  return Object.keys(store.byCity).sort();
}
