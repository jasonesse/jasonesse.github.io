import type { ActivityTemplate, Zone, Landmark } from "../types";

type ChaosKey = "low" | "medium" | "high";

function getChaosKey(chaosLevel: number): ChaosKey {
  if (chaosLevel < 30) return "low";
  if (chaosLevel < 70) return "medium";
  return "high";
}

/**
 * Replace {landmark}, {zone}, and {city} tokens in a template string.
 */
function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/**
 * Assemble the final experience text from an activity template, chaos level,
 * the assigned zone, an optional landmark, and the city name.
 *
 * When a landmark is provided the withLandmark template variant is used and
 * {landmark} is substituted.  Otherwise the withoutLandmark variant is used
 * and any {zone}/{city} tokens are substituted for local flavour.
 */
export function assembleText(
  activity: ActivityTemplate,
  chaosLevel: number,
  zone: Zone | null,
  landmark: Landmark | null,
  cityName: string
): { shortText: string; moreText: string } {
  const key = getChaosKey(chaosLevel);
  const variant = activity.chaosVariants[key];

  const vars: Record<string, string> = {
    landmark: landmark?.name ?? zone?.name ?? cityName,
    zone: zone?.name ?? cityName,
    city: cityName,
  };

  const template = landmark ? variant.withLandmark : variant.withoutLandmark;
  const shortText = substitute(template, vars);
  const moreText = activity.moreText ? substitute(activity.moreText, vars) : "";

  return { shortText, moreText };
}
