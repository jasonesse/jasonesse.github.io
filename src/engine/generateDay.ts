import { applyChaos } from "./chaosEngine";
import type {
  Activity,
  CityDeck,
  DayRun,
  GeneratedActivity,
  GroupDetails,
  TimeSlot,
} from "../types";

const TIME_SLOTS: TimeSlot[] = [
  "morning",
  "midday",
  "lunch",
  "afternoon",
  "evening",
];

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

export function generateDay(
  cityDeck: CityDeck,
  chaosLevel: number,
  groupDetails: GroupDetails,
  ignoredIds: Set<string> = new Set()
): DayRun {
  const result: GeneratedActivity[] = [];
  const usedIds = new Set<string>();

  for (const slot of TIME_SLOTS) {
    const candidates = cityDeck.activityDeck.filter(
      (a) =>
        a.timeSlots.includes(slot) &&
        !usedIds.has(a.id) &&
      supportsGroup(a, groupDetails) &&
      !ignoredIds.has(a.id)
    );

    // Fisher-Yates shuffle for unbiased random selection
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const picked = shuffled[0];
    if (!picked) continue;

    usedIds.add(picked.id);
    result.push({
      id: picked.id,
      timeSlot: slot,
      category: picked.category,
      chaosLevel,
      finalText: applyChaos(picked, chaosLevel),
    });
  }

  return {
    city: cityDeck.city,
    chaosLevel,
    activities: result,
    groupDetails,
  };
}
