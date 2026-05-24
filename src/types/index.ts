export type TimeSlot =
  | "morning"
  | "midday"
  | "lunch"
  | "afternoon"
  | "evening";

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

export type Activity = {
  id: string;
  baseText: string;
  short_desc?: string;
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

export type GeneratedActivity = {
  id: string;
  timeSlot: TimeSlot;
  shortText: string;
  finalText: string;
  category: string;
  chaosLevel: number;
};

export type DayRun = {
  city: string;
  activities: GeneratedActivity[];
  chaosLevel: number;
  groupDetails: GroupDetails;
};

export type CityDeck = {
  city: string;
  activityDeck: Activity[];
};
