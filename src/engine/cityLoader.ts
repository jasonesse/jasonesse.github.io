import type { CityDeck } from "../types";
import {
  getFallbackCityByKey,
  loadCityCatalog,
  normalizeCityKey,
} from "../cities/cityCatalog";

const CACHE_TTL_MS = 1_000;

type CacheEntry = {
  loadedAt: number;
  deck: CityDeck;
};

const cityCache = new Map<string, CacheEntry>();

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

function isCityDeck(value: unknown): value is CityDeck {
  if (!value || typeof value !== "object") return false;
  const candidate = value as CityDeck;
  return typeof candidate.city === "string" && Array.isArray(candidate.activityDeck);
}

export async function loadCity(city: string): Promise<CityDeck> {
  const cityKey = normalizeCityKey(city);
  const cached = cityCache.get(cityKey);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.deck;
  }

  const urls = await getUrlCandidates(cityKey);

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 3000);
      if (!res.ok) continue;

      const payload = (await res.json()) as unknown;
      if (!isCityDeck(payload)) continue;

      cityCache.set(cityKey, { loadedAt: Date.now(), deck: payload });
      return payload;
    } catch {
      // try next source
    }
  }

  throw new Error(`Failed to load city data for "${city}"`);
}
