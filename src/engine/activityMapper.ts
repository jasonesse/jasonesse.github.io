import type {
  ActivityTemplate,
  CityV2,
  GeneratedActivity,
  GroupDetails,
  TimeSlot,
  AdventureRadius,
} from "../types";
import { getAllowedZones } from "./zoneEngine";
import { pickExperienceForSlot } from "./experienceEngine";

/**
 * Re-rolls a single time slot using the V2 experience engine.
 *
 * Excluded activity IDs are template IDs (e.g. "morning-walk") sourced from
 * the current run's activity list and recent history.
 */
export function remapActivity(
  city: CityV2,
  activities: ActivityTemplate[],
  slot: TimeSlot,
  excludeIds: string[],
  chaosLevel: number,
  _groupDetails: GroupDetails,
  radius: AdventureRadius,
  hubZoneId: string,
  ignoredIds: Set<string> = new Set()
): GeneratedActivity | null {
  const hubZone = city.zones.find((z) => z.id === hubZoneId) ?? city.zones[0];
  if (!hubZone) return null;

  const allowedZones = getAllowedZones(hubZone, city.zones, radius);
  const excluded = new Set(excludeIds);

  return pickExperienceForSlot(
    slot,
    city,
    activities,
    allowedZones,
    excluded,
    ignoredIds,
    chaosLevel
  );
}
