import type { DayRun } from "../types";

type KeptItem = {
  id: string;
  timeSlot: string;
  finalText: string;
};

export type DayHistoryRecord = {
  date: string;
  city: string;
  keptItems: KeptItem[];
};

type HistoryStore = {
  recordsByDate: Record<string, DayHistoryRecord[]>;
};

const COOKIE_NAME = "crg_kept_history_v1";
const MAX_COOKIE_CHARS = 3500;
const MAX_HISTORY_DAYS = 90;

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
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

function parseStore(): HistoryStore {
  const raw = readCookieValue(COOKIE_NAME);
  if (!raw) return { recordsByDate: {} };

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as HistoryStore;
    if (!parsed.recordsByDate || typeof parsed.recordsByDate !== "object") {
      return { recordsByDate: {} };
    }
    return parsed;
  } catch {
    return { recordsByDate: {} };
  }
}

function trimStore(store: HistoryStore): HistoryStore {
  const entries = Object.entries(store.recordsByDate).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  while (entries.length > MAX_HISTORY_DAYS) {
    entries.shift();
  }

  let next: HistoryStore = {
    recordsByDate: Object.fromEntries(entries),
  };

  let serialized = encodeURIComponent(JSON.stringify(next));
  while (serialized.length > MAX_COOKIE_CHARS && entries.length > 1) {
    entries.shift();
    next = { recordsByDate: Object.fromEntries(entries) };
    serialized = encodeURIComponent(JSON.stringify(next));
  }

  return next;
}

function persistStore(store: HistoryStore): void {
  const trimmed = trimStore(store);
  const serialized = encodeURIComponent(JSON.stringify(trimmed));
  writeCookieValue(COOKIE_NAME, serialized);
}

export function saveKeptRunForToday(run: DayRun, keptIds: Set<string>): void {
  const keptItems = run.activities
    .filter((a) => keptIds.has(a.id))
    .map((a) => ({ id: a.id, timeSlot: a.timeSlot, finalText: a.finalText }));

  if (keptItems.length === 0) return;

  const store = parseStore();
  const date = getTodayDateKey();
  const existing = store.recordsByDate[date] ?? [];

  const record: DayHistoryRecord = {
    date,
    city: run.city,
    keptItems,
  };

  store.recordsByDate[date] = [...existing, record];
  persistStore(store);
}

export function getHistoryByDate(date: string): DayHistoryRecord[] {
  const store = parseStore();
  return store.recordsByDate[date] ?? [];
}

export function deleteHistoryRecordByIndex(date: string, index: number): void {
  const store = parseStore();
  const existing = store.recordsByDate[date] ?? [];
  if (index < 0 || index >= existing.length) return;

  const next = existing.filter((_, idx) => idx !== index);
  if (next.length === 0) {
    delete store.recordsByDate[date];
  } else {
    store.recordsByDate[date] = next;
  }

  persistStore(store);
}

export function deleteHistoryByDate(date: string): void {
  const store = parseStore();
  if (!store.recordsByDate[date]) return;

  delete store.recordsByDate[date];
  persistStore(store);
}
