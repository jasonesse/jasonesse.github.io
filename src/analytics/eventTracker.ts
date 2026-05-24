import type { AnalyticsEvent, EventType } from "./eventSchema";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function trackEvent(
  type: EventType,
  data: AnalyticsEvent["data"] = {}
): void {
  const payload: AnalyticsEvent = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    data,
  };

  try {
    const existing: AnalyticsEvent[] = JSON.parse(
      localStorage.getItem("crg_events") ?? "[]"
    );
    existing.push(payload);
    localStorage.setItem("crg_events", JSON.stringify(existing));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }

  // Future: send to backend API
  // void fetch("/api/events", { method: "POST", body: JSON.stringify(payload) });
}

export function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem("crg_events") ?? "[]");
  } catch {
    return [];
  }
}
