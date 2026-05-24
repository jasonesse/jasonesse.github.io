import type { CityV2, ActivityTemplate } from "../types";
import {
  getFallbackCityByKey,
  loadCityCatalog,
  normalizeCityKey,
} from "../cities/cityCatalog";

const CACHE_TTL_MS = 5_000;

type CityCache = { loadedAt: number; city: CityV2 };
type ActivitiesCache = { loadedAt: number; activities: ActivityTemplate[] };

const cityCache = new Map<string, CityCache>();
let activitiesCache: ActivitiesCache | null = null;

async function getUrlCandidates(cityKey: string): Promise<string[]> {
  const fromCatalog = (await loadCityCatalog()).find((entry) => entry.key === cityKey);
  const fallback = getFallbackCityByKey(cityKey);

  return [...new Set([fromCatalog?.jsonPath, fallback?.jsonPath].filter(Boolean))] as string[];
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function isCityV2(value: unknown): value is CityV2 {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (typeof c.city !== "string" || typeof c.cityId !== "string") return false;
  if (!Array.isArray(c.zones)) return false;
  // Accept both old format (top-level landmarks[]) and new format (landmarks inside zones)
  if (!Array.isArray(c.landmarks)) {
    // New format: landmarks must be nested inside at least one zone
    const hasZoneLandmarks = (c.zones as unknown[]).some(
      (z) => z && typeof z === "object" && Array.isArray((z as Record<string, unknown>).landmarks)
    );
    if (!hasZoneLandmarks) return false;
  }
  return true;
}

/** Normalise a raw city payload so it always has a flat top-level `landmarks`
 *  array, regardless of whether the source JSON uses the old flat format or
 *  the new zone-nested format introduced for Montréal. */
function normalizeCityPayload(raw: unknown): CityV2 {
  const c = raw as Record<string, unknown>;
  const zones = (c.zones as Record<string, unknown>[]).map((z) => ({
    id: z.id as string,
    name: z.name as string,
    tags: (z.tags as string[]) ?? [],
    adjacentZones: (z.adjacentZones as string[] | undefined) ?? [],
  }));

  let landmarks = (c.landmarks as CityV2["landmarks"] | undefined) ?? [];

  if (landmarks.length === 0) {
    // New zone-nested format — flatten
    for (const z of c.zones as Record<string, unknown>[]) {
      const nested = z.landmarks as Array<Record<string, unknown>> | undefined;
      if (!Array.isArray(nested)) continue;
      for (const lm of nested) {
        landmarks.push({
          id: lm.id as string,
          name: lm.name as string,
          zone: z.id as string,
          tags: (lm.tags as string[]) ?? [],
          iconicScore: (lm.iconicScore as number) ?? 0,
        });
      }
    }
  }

  return {
    city: c.city as string,
    cityId: c.cityId as string,
    zones,
    landmarks,
  };
}

function isActivityTemplateArray(value: unknown): value is ActivityTemplate[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0] as Record<string, unknown>;
  return typeof first.id === "string" && typeof first.energyState === "string";
}

export async function loadCity(city: string): Promise<CityV2> {
  const cityKey = normalizeCityKey(city);
  const cached = cityCache.get(cityKey);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.city;
  }

  const urls = await getUrlCandidates(cityKey);

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 4000);
      if (!res.ok) continue;

      const payload = (await res.json()) as unknown;
      if (!isCityV2(payload)) continue;

      const city = normalizeCityPayload(payload);
      cityCache.set(cityKey, { loadedAt: Date.now(), city });
      return city;
    } catch {
      // try next source
    }
  }

  throw new Error(`Failed to load city data for "${city}"`);
}

export async function loadActivities(): Promise<ActivityTemplate[]> {
  if (activitiesCache && Date.now() - activitiesCache.loadedAt < CACHE_TTL_MS) {
    return activitiesCache.activities;
  }

  try {
    const res = await fetchWithTimeout("/activities.json", 4000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = (await res.json()) as unknown;
    if (!isActivityTemplateArray(payload)) {
      throw new Error("Invalid activities.json format");
    }

    activitiesCache = { loadedAt: Date.now(), activities: payload };
    return payload;
  } catch (e) {
    throw new Error(`Failed to load activities: ${e instanceof Error ? e.message : String(e)}`);
  }
}
