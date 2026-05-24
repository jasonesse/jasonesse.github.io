import type { CityDeck } from "../types";

const CACHE_TTL_MS = 1_000;

type CacheEntry = {
  loadedAt: number;
  deck: CityDeck;
};

const cityCache = new Map<string, CacheEntry>();

function getGithubRepoCandidates(): string[] {
  if (typeof window === "undefined") return ["jasonesse/jasonesse.github.io"];

  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith(".github.io")) {
    return ["jasonesse/jasonesse.github.io"];
  }

  const user = host.split(".")[0];
  const firstPath = window.location.pathname.split("/").filter(Boolean)[0];

  const candidates = new Set<string>([`${user}/${user}.github.io`]);
  if (firstPath) {
    candidates.add(`${user}/${firstPath}`);
  }

  return [...candidates];
}

function getUrlCandidates(cityKey: string): string[] {
  const fileName = `${cityKey}.json`;
  const cacheBuster = `v=${Math.floor(Date.now() / CACHE_TTL_MS)}`;
  const repos = getGithubRepoCandidates();
  const isLocalDev =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname.toLowerCase());

  const remote = repos.flatMap((repo) => [
    `https://raw.githubusercontent.com/${repo}/main/public/${fileName}?${cacheBuster}`,
    `https://raw.githubusercontent.com/${repo}/main/${fileName}?${cacheBuster}`,
  ]);

  const local = [`/${fileName}`];
  return isLocalDev ? [...local, ...remote] : [...remote, ...local];
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
  const cityKey = city.trim().toLowerCase();
  const cached = cityCache.get(cityKey);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.deck;
  }

  const urls = getUrlCandidates(cityKey);

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
