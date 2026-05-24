import type { Activity } from "../types";

export function applyChaos(activity: Activity, chaosLevel: number): string {
  const variant =
    chaosLevel < 30
      ? activity.chaosVariants.low
      : chaosLevel < 70
      ? activity.chaosVariants.medium
      : activity.chaosVariants.high;

  const base = activity.baseText.trim();
  if (!base) return variant;

  const separator = /[.!?]$/.test(base) ? " " : ". ";
  return `${base}${separator}${variant}`;
}
