import type { ScheduleDeparture } from "@/lib/types";
import type { RouteStep } from "./types";

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prefer departures on the first ride line that head toward the planned exit stop. */
export function filterDeparturesForFirstLeg(
  items: ScheduleDeparture[],
  step: RouteStep,
): ScheduleDeparture[] {
  const route = step.route?.toUpperCase() ?? "";
  const onLine = items.filter((i) => i.lineAbbrev.toUpperCase() === route);
  if (onLine.length === 0) return items;

  const target = normalizeName(step.toName);
  const towardExit = onLine.filter((i) => {
    const dest = normalizeName(i.destination);
    if (dest.includes(target) || target.includes(dest)) return true;
    const targetWord = target.split(" ")[0] ?? target;
    return dest.includes(targetWord);
  });

  return towardExit.length > 0 ? towardExit : onLine;
}
