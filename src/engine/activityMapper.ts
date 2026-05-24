import type { Activity, GeneratedActivity, GroupDetails, TimeSlot } from "../types";
import { applyChaos } from "./chaosEngine";

function supportsGroup(activity: Activity, group: GroupDetails): boolean {
  // Adults-only groups are treated as least restrictive.
  if (group.adults >= 2 && group.teenagers === 0 && group.kids === 0) {
    return true;
  }

  const rules = activity.groupSuitability ?? {
    adults: true,
    teenagers: true,
    kids: true,
  };

  if (group.adults > 0 && !rules.adults) return false;
  if (group.teenagers > 0 && !rules.teenagers) return false;
  if (group.kids > 0 && !rules.kids) return false;
  return true;
}

/**
 * Re-rolls a single activity for a given time slot from the city deck,
 * excluding the current activity to avoid repeating the same pick.
 */
export function remapActivity(
  deck: Activity[],
  slot: TimeSlot,
  excludeIds: string[],
  chaosLevel: number,
  groupDetails: GroupDetails,
  ignoredIds: Set<string> = new Set(),
  useWholeDeck: boolean = false
): GeneratedActivity | null {
  const excluded = new Set(excludeIds);
  const basePool = deck.filter(
    (a) => useWholeDeck || a.timeSlots.includes(slot)
  );

  if (basePool.length === 0) return null;

  const candidates =
    basePool.filter(
      (a) =>
        !excluded.has(a.id) &&
        supportsGroup(a, groupDetails) &&
        !ignoredIds.has(a.id)
    ) || [];

  const fallbackNoExclusions = basePool.filter(
    (a) => supportsGroup(a, groupDetails) && !ignoredIds.has(a.id)
  );

  const fallbackIgnoreIgnored = basePool.filter((a) =>
    supportsGroup(a, groupDetails)
  );

  const fallbackAny = basePool.filter((a) => !ignoredIds.has(a.id));

  const finalPool =
    candidates.length > 0
      ? candidates
      : fallbackNoExclusions.length > 0
      ? fallbackNoExclusions
      : fallbackIgnoreIgnored.length > 0
      ? fallbackIgnoreIgnored
      : fallbackAny.length > 0
      ? fallbackAny
      : basePool;

  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
  const longText = applyChaos(picked, chaosLevel);

  return {
    id: picked.id,
    timeSlot: slot,
    category: picked.category,
    chaosLevel,
    shortText: picked.short_desc?.trim() || longText,
    finalText: longText,
  };
}
