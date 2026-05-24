import type { Activity } from "../types";

export function applyChaos(activity: Activity, chaosLevel: number): string {
  if (chaosLevel < 30) return activity.chaosVariants.low;
  if (chaosLevel < 70) return activity.chaosVariants.medium;
  return activity.chaosVariants.high;
}
