import type { Landmark, Zone } from "../types";

/**
 * Select 0–2 landmarks for the day.
 *
 * Rules:
 *  - Low chaos  → more likely to get 2 landmarks
 *  - Mid chaos  → 0 or 1
 *  - High chaos → 0 (pure abstract exploration)
 *
 * Landmarks are drawn from zones allowed by the current radius.
 */
export function selectDayLandmarks(
  landmarks: Landmark[],
  allowedZones: Zone[],
  chaosLevel: number
): Landmark[] {
  // Determine the maximum number of landmarks for the day.
  const maxLandmarks = chaosLevel < 30 ? 2 : chaosLevel < 70 ? 1 : 0;

  if (maxLandmarks === 0) return [];

  // Add stochasticity: even at low chaos we sometimes get fewer.
  const targetCount = Math.floor(Math.random() * (maxLandmarks + 1));
  if (targetCount === 0) return [];

  const allowedZoneIds = new Set(allowedZones.map((z) => z.id));

  // Eligible landmarks must be in an allowed zone.
  const eligible = landmarks.filter((l) => allowedZoneIds.has(l.zone));

  if (eligible.length === 0) return [];

  // Full random shuffle of all eligible landmarks.
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, targetCount);
}
