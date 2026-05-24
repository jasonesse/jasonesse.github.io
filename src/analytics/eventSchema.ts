export type EventType =
  | "RUN_GENERATED"
  | "ACTIVITY_VIEWED"
  | "ACTIVITY_KEPT"
  | "ACTIVITY_REROLLED"
  | "ACTIVITY_EXPLORED"
  | "RUN_COMPLETED";

export type AnalyticsEvent = {
  id: string;
  type: EventType;
  timestamp: number;
  data: {
    city?: string;
    chaosLevel?: number;
    activityId?: string;
    timeSlot?: string;
  };
};
