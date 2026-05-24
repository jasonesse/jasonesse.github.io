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

function toSponsoredInfo(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : undefined;
  const website = typeof record.website === "string" ? record.website : undefined;
  const directPromos = Array.isArray(record.promos) ? record.promos : [];
  const keyedPromos = Object.entries(record)
    .filter(([key, val]) => key.toLowerCase().startsWith("promo") && val != null)
    .map(([, val]) => val);
  const promos = [...directPromos, ...keyedPromos];
  if (!name && !website && promos.length === 0) return null;
  return { name, website, promos };
}

function extractSponsors(activity: Activity) {
  const single = toSponsoredInfo(activity.Sponsored ?? activity.sponsored);
  const fromListRaw = activity.Sponsors?.sponsor;
  const fromList = Array.isArray(fromListRaw)
    ? fromListRaw
        .map((entry) => toSponsoredInfo(entry))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  if (single && fromList.length === 0) return [single];
  return fromList;
}

export function generateDay(
  cityDeck: CityDeck,
  chaosLevel: number,
  groupDetails: GroupDetails,
  ignoredIds: Set<string> = new Set(),
  recentIds: Set<string> = new Set()
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

    const freshCandidates = candidates.filter((a) => !recentIds.has(a.id));
    const pool = freshCandidates.length > 0 ? freshCandidates : candidates;

    // Fisher-Yates shuffle for unbiased random selection
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const picked = shuffled[0];
    if (!picked) continue;

    usedIds.add(picked.id);
    const longText = applyChaos(picked, chaosLevel);
    const sponsors = extractSponsors(picked);
    result.push({
      id: picked.id,
      timeSlot: slot,
      category: picked.category,
      chaosLevel,
      shortText: picked.short_desc?.trim() || longText,
      finalText: longText,
      sponsored: sponsors[0],
      sponsors,
    });
  }

  return {
    city: cityDeck.city,
    chaosLevel,
    activities: result,
    groupDetails,
  };
}
