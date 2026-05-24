import fallbackCatalog from "virtual:city-catalog";

export type CityCatalogEntry = {
  key: string;
  label: string;
  jsonPath: string;
  imagePath?: string;
};

const CATALOG_TTL_MS = 60_000;

let cachedCatalog: CityCatalogEntry[] | null = null;
let cacheExpiresAt = 0;

export function normalizeCityKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFallbackCatalog(): CityCatalogEntry[] {
  return (fallbackCatalog as CityCatalogEntry[]).slice();
}

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

function rawGithubUrl(repo: string, ...segments: string[]): string {
  const encodedSegments = segments.map((segment) => encodeURIComponent(segment));
  return `https://raw.githubusercontent.com/${repo}/main/${encodedSegments.join("/")}`;
}

function toStem(fileName: string): { stem: string; ext: string } | null {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return null;
  return {
    stem: fileName.slice(0, dot),
    ext: fileName.slice(dot + 1).toLowerCase(),
  };
}

function buildCatalogFromFileNames(fileNames: string[], resolver: (fileName: string) => string): CityCatalogEntry[] {
  const byStem = new Map<string, { label: string; jsonPath?: string; imagePath?: string }>();

  for (const fileName of fileNames) {
    const parsed = toStem(fileName);
    if (!parsed) continue;

    const current = byStem.get(parsed.stem) ?? { label: parsed.stem };
    if (parsed.ext === "json") {
      current.jsonPath = resolver(fileName);
    }
    if (["jpg", "jpeg", "png", "webp", "avif"].includes(parsed.ext)) {
      current.imagePath = resolver(fileName);
    }
    byStem.set(parsed.stem, current);
  }

  return [...byStem.entries()]
    .filter(([, value]) => value.jsonPath)
    .map(([stem, value]) => ({
      key: normalizeCityKey(stem),
      label: value.label,
      jsonPath: value.jsonPath!,
      imagePath: value.imagePath,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function loadRemoteCatalog(): Promise<CityCatalogEntry[] | null> {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (["localhost", "127.0.0.1"].includes(host)) return null;

  for (const repo of getGithubRepoCandidates()) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/public/cities`, {
        cache: "no-store",
      });
      if (!res.ok) continue;

      const payload = (await res.json()) as Array<{ name?: string }>;
      const fileNames = payload
        .map((item) => item.name)
        .filter((name): name is string => typeof name === "string");

      const catalog = buildCatalogFromFileNames(fileNames, (fileName) =>
        rawGithubUrl(repo, "public", "cities", fileName)
      );

      if (catalog.length > 0) {
        return catalog;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

export async function loadCityCatalog(): Promise<CityCatalogEntry[]> {
  const now = Date.now();
  if (cachedCatalog && now < cacheExpiresAt) {
    return cachedCatalog;
  }

  const remoteCatalog = await loadRemoteCatalog();
  cachedCatalog = remoteCatalog ?? getFallbackCatalog();
  cacheExpiresAt = now + CATALOG_TTL_MS;
  return cachedCatalog;
}

export function getFallbackCityByKey(city: string): CityCatalogEntry | undefined {
  const key = normalizeCityKey(city);
  return getFallbackCatalog().find((entry) => entry.key === key);
}
