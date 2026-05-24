import type { Activity, GeneratedActivity, GroupDetails, TimeSlot } from "../types";
import { applyChaos } from "./chaosEngine";

function supportsGroup(activity: Activity, group: GroupDetails): boolean {
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
  ignoredIds: Set<string> = new Set()
): GeneratedActivity | null {
  const excluded = new Set(excludeIds);
  const candidates = deck.filter(
    (a) =>
      a.timeSlots.includes(slot) &&
      !excluded.has(a.id) &&
      supportsGroup(a, groupDetails) &&
      !ignoredIds.has(a.id)
  );

  if (candidates.length === 0) return null;

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    id: picked.id,
    timeSlot: slot,
    category: picked.category,
    chaosLevel,
    finalText: applyChaos(picked, chaosLevel),
  };
}
