export type TimeSlot =
  | "morning"
  | "midday"
  | "lunch"
  | "afternoon"
  | "evening";

export type EnergyState =
  | "start"
  | "explore"
  | "food"
  | "relax"
  | "observe"
  | "finish";

export type AdventureRadius = "local" | "nearby" | "citywide";

export type ChaosLevel = number;

export type GroupDetails = {
  adults: number;
  teenagers: number;
  kids: number;
};

export type ActivityGroupSuitability = {
  adults: boolean;
  teenagers: boolean;
  kids: boolean;
};

export type SponsoredInfo = {
  name?: string;
  website?: string;
  promos?: unknown[];
};

export type SponsorsBlock = {
  sponsor?: unknown[];
};

// ─── V1 Activity (legacy flat-deck format) ───────────────────────────────────
export type Activity = {
  id: string;
  baseText: string;
  short_desc?: string;
  Sponsored?: SponsoredInfo;
  sponsored?: SponsoredInfo;
  Sponsors?: SponsorsBlock;
  category: string;
  timeSlots: TimeSlot[];
  tags: string[];
  groupSuitability?: ActivityGroupSuitability;
  chaosVariants: {
    low: string;
    medium: string;
    high: string;
  };
};

// ─── V2 Activity Template (city-agnostic, reusable) ──────────────────────────
export type ActivityTemplate = {
  id: string;
  category: string;
  timeSlots: TimeSlot[];
  zoneAffinity: string[];
  energyState: EnergyState;
  shortDesc: string;
  moreText?: string;
  chaosVariants: {
    low: { withLandmark: string; withoutLandmark: string };
    medium: { withLandmark: string; withoutLandmark: string };
    high: { withLandmark: string; withoutLandmark: string };
  };
};

// ─── V2 Zone ─────────────────────────────────────────────────────────────────
export type Zone = {
  id: string;
  name: string;
  tags: string[];
  adjacentZones?: string[];
  sponsors?: SponsoredInfo[];
};

// ─── V2 Landmark ─────────────────────────────────────────────────────────────
export type Landmark = {
  id: string;
  name: string;
  zone: string;
  tags: string[];
  sponsors?: SponsoredInfo[];
};

// ─── V2 City ─────────────────────────────────────────────────────────────────
export type CityV2 = {
  city: string;
  cityId: string;
  zones: Zone[];
  landmarks: Landmark[];
};

// ─── Generated Activity (shared between V1 and V2 runs) ──────────────────────
export type GeneratedActivity = {
  id: string;
  timeSlot: TimeSlot;
  shortText: string;
  finalText: string;
  category: string;
  chaosLevel: number;
  // V1 compat
  sponsored?: SponsoredInfo;
  sponsors?: SponsoredInfo[];
  // V2 fields
  zoneId?: string;
  landmarkId?: string;
  landmarkName?: string;
  energyState?: EnergyState;
};

// ─── Day Run ─────────────────────────────────────────────────────────────────
export type DayRun = {
  city: string;
  cityId?: string;
  activities: GeneratedActivity[];
  chaosLevel: number;
  groupDetails: GroupDetails;
  // V2 fields
  hubZoneId?: string;
  hubZoneName?: string;
  radius?: AdventureRadius;
  // Iconic mode
  iconicLandmarkId?: string;
  iconicLandmarkName?: string;
};

// ─── V1 City Deck (legacy) ───────────────────────────────────────────────────
export type CityDeck = {
  city: string;
  activityDeck: Activity[];
};
