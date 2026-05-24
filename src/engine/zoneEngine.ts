import type { Zone, AdventureRadius } from "../types";

/**
 * Randomly pick a hub zone from the city's zone list.
 */
export function selectHubZone(zones: Zone[]): Zone {
  return zones[Math.floor(Math.random() * zones.length)];
}

/**
 * Return all zones eligible for activity placement based on the chosen radius.
 *
 * local    → hub zone only
 * nearby   → hub zone + its declared adjacent zones
 * citywide → entire city zone list
 */
export function getAllowedZones(
  hubZone: Zone,
  allZones: Zone[],
  radius: AdventureRadius
): Zone[] {
  if (radius === "local") {
    return [hubZone];
  }

  if (radius === "nearby") {
    const adjacentIds = new Set(hubZone.adjacentZones ?? []);
    return allZones.filter((z) => z.id === hubZone.id || adjacentIds.has(z.id));
  }

  // citywide
  return allZones;
}

/**
 * From the allowed zones, return those whose tags overlap with the given
 * affinity tag list.  Used for matching an activity template to a zone.
 */
export function findMatchingZones(
  allowedZones: Zone[],
  affinityTags: string[]
): Zone[] {
  const tagSet = new Set(affinityTags);
  return allowedZones.filter((z) => z.tags.some((t) => tagSet.has(t)));
}
