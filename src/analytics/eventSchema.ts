export type EventType =
  | "RUN_GENERATED"
  | "ACTIVITY_VIEWED"
  | "ACTIVITY_KEPT"
  | "ACTIVITY_REROLLED"
  | "ACTIVITY_EXPLORED"
  | "RUN_COMPLETED"
  // V2 events
  | "HUB_ZONE_SELECTED"
  | "RADIUS_SELECTED"
  | "LANDMARK_USED"
  | "ZONE_VISITED";

export type AnalyticsEvent = {
  id: string;
  type: EventType;
  timestamp: number;
  data: {
    city?: string;
    chaosLevel?: number;
    activityId?: string;
    timeSlot?: string;
    // V2 fields
    cityId?: string;
    hubZoneId?: string;
    radius?: string;
    zoneId?: string;
    landmarkId?: string;
  };
};
