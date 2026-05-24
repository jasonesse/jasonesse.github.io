import { selectHubZone, getAllowedZones, findMatchingZones } from "./zoneEngine";
import { selectDayLandmarks } from "./landmarkEngine";
import { assembleText } from "./textAssembly";
import type {
  CityV2,
  ActivityTemplate,
  GeneratedActivity,
  DayRun,
  GroupDetails,
  AdventureRadius,
  TimeSlot,
  EnergyState,
  Zone,
  Landmark,
  SponsoredInfo,
} from "../types";

const TIME_SLOTS: TimeSlot[] = [
  "morning",
  "midday",
  "lunch",
  "afternoon",
  "evening",
];

// Preferred energy states per time slot (ordered by preference).
const SLOT_ENERGY_PREFERENCE: Record<TimeSlot, EnergyState[]> = {
  morning: ["start", "explore"],
  midday: ["explore", "observe"],
  lunch: ["food"],
  afternoon: ["explore", "relax", "observe"],
  evening: ["finish", "food", "relax"],
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function pickActivityForSlot(
  slot: TimeSlot,
  activities: ActivityTemplate[],
  allowedZones: Zone[],
  usedActivityIds: Set<string>,
  ignoredIds: Set<string>,
  chaosLevel: number
): { activity: ActivityTemplate; zone: Zone } | null {
  const preferredStates = new Set(SLOT_ENERGY_PREFERENCE[slot]);

  // All templates that cover this time slot and haven't been used yet.
  const eligible = activities.filter(
    (a) =>
      a.timeSlots.includes(slot) &&
      !usedActivityIds.has(a.id) &&
      !ignoredIds.has(a.id)
  );

  if (eligible.length === 0) return null;

  // Score each template: zone affinity match (+1) + energy state match (+2).
  const scored = eligible.map((activity) => {
    const matchingZones = findMatchingZones(allowedZones, activity.zoneAffinity);
    const zoneScore = matchingZones.length > 0 ? 1 : 0;
    const energyScore = preferredStates.has(activity.energyState) ? 2 : 0;
    return {
      activity,
      matchingZones: matchingZones.length > 0 ? matchingZones : allowedZones,
      score: zoneScore + energyScore,
    };
  });

  // Sort by score descending; at higher chaos inject more randomness.
  const chaosNoiseMagnitude = (chaosLevel / 100) * 2;
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    const noise = (Math.random() - 0.5) * chaosNoiseMagnitude;
    return diff + noise;
  });

  const top = scored[0];
  const zone = top.matchingZones[Math.floor(Math.random() * top.matchingZones.length)];

  return { activity: top.activity, zone };
}

// ─── Single-slot re-pick (used by reroll) ────────────────────────────────────

export function pickExperienceForSlot(
  slot: TimeSlot,
  city: CityV2,
  activities: ActivityTemplate[],
  allowedZones: Zone[],
  excludeActivityIds: Set<string>,
  ignoredIds: Set<string>,
  chaosLevel: number
): GeneratedActivity | null {
  const dayLandmarks = selectDayLandmarks(city.landmarks, allowedZones, chaosLevel);

  const pick = pickActivityForSlot(
    slot,
    activities,
    allowedZones,
    excludeActivityIds,
    ignoredIds,
    chaosLevel
  );

  if (!pick) return null;

  const landmark: Landmark | null =
    dayLandmarks.length > 0 && Math.random() > 0.5
      ? dayLandmarks[Math.floor(Math.random() * dayLandmarks.length)]
      : null;

  const { shortText, moreText } = assembleText(
    pick.activity,
    chaosLevel,
    pick.zone,
    landmark,
    city.city
  );

  return {
    id: pick.activity.id,
    timeSlot: slot,
    category: pick.activity.category,
    chaosLevel,
    shortText,
    finalText: moreText || shortText,
    zoneId: pick.zone.id,
    landmarkId: landmark?.id,
    energyState: pick.activity.energyState,
  };
}

function pickSponsors(zone: Zone, landmark: Landmark | null): SponsoredInfo[] {
  const lmSponsors = landmark?.sponsors ?? [];
  if (lmSponsors.length > 0) return lmSponsors;
  return zone.sponsors ?? [];
}

// ─── Full day generation ──────────────────────────────────────────────────────

export function generateDayV2(
  city: CityV2,
  activities: ActivityTemplate[],
  chaosLevel: number,
  groupDetails: GroupDetails,
  radius: AdventureRadius,
  ignoredIds: Set<string> = new Set(),
  recentIds: Set<string> = new Set(),
  forceHubZoneId?: string,
  iconicMode = false
): DayRun {
  const hubZone: Zone =
    (forceHubZoneId ? city.zones.find((z) => z.id === forceHubZoneId) : undefined) ??
    selectHubZone(city.zones);
  const allowedZones = getAllowedZones(hubZone, city.zones, radius);

  // In iconic mode: select a top landmark from the allowed zones so the result
  // always belongs to the chosen hub zone (respecting the adventure radius).
  // That landmark is then used for every slot so every description references
  // the iconic place.  In normal mode: use the standard probabilistic queue.
  let iconicLandmark: Landmark | undefined;
  if (iconicMode && city.landmarks.length > 0) {
    const allowedZoneIds = new Set(allowedZones.map((z) => z.id));
    const eligible = city.landmarks.filter((l) => allowedZoneIds.has(l.zone));
    const iconicEligible = eligible.filter((l) => l.tags.includes("iconic"));
    const pool = iconicEligible.length > 0 ? iconicEligible : eligible;
    if (pool.length > 0) {
      iconicLandmark = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  const dayLandmarks = iconicLandmark
    ? []
    : selectDayLandmarks(city.landmarks, allowedZones, chaosLevel);
  let landmarkQueue = [...dayLandmarks];

  const usedActivityIds = new Set(recentIds);
  const result: GeneratedActivity[] = [];

  for (const slot of TIME_SLOTS) {
    const pick = pickActivityForSlot(
      slot,
      activities,
      allowedZones,
      usedActivityIds,
      ignoredIds,
      chaosLevel
    );

    if (!pick) continue;

    usedActivityIds.add(pick.activity.id);

    // Iconic mode: every slot uses the pinned landmark.
    // Normal mode: draw from the queue with ≥60% probability per slot.
    const landmark: Landmark | null = iconicLandmark
      ? iconicLandmark
      : landmarkQueue.length > 0 && Math.random() > 0.4
      ? (landmarkQueue.shift() ?? null)
      : null;

    const { shortText, moreText } = assembleText(
      pick.activity,
      chaosLevel,
      pick.zone,
      landmark,
      city.city
    );
    const sponsors = pickSponsors(pick.zone, landmark);

    result.push({
      id: pick.activity.id,
      timeSlot: slot,
      category: pick.activity.category,
      chaosLevel,
      shortText,
      finalText: moreText || shortText,
      zoneId: pick.zone.id,
      landmarkId: landmark?.id,
      landmarkName: landmark?.name,
      sponsored: sponsors[0],
      sponsors,
      energyState: pick.activity.energyState,
    });
  }

  return {
    city: city.city,
    cityId: city.cityId,
    activities: result,
    chaosLevel,
    groupDetails,
    hubZoneId: hubZone.id,
    hubZoneName: hubZone.name,
    radius,
    iconicLandmarkId: iconicLandmark?.id,
    iconicLandmarkName: iconicLandmark?.name,
  };
}
