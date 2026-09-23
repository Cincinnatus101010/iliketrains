import { parseNjScheduleAtMs } from "@/lib/formatTime";
import type { ScheduleDeparture } from "@/types";

/** When the chosen train is scheduled to depart the boarding stop (includes delay). */
export function boardingDepartureMs(dep: ScheduleDeparture, nowMs = Date.now()): number | null {
  const base = parseNjScheduleAtMs(dep.scheduledAt, nowMs);
  if (base == null) return null;
  const late = Number.isFinite(dep.secLate) ? dep.secLate : 0;
  return base + late * 1000;
}

export function msUntilBoarding(dep: ScheduleDeparture, nowMs = Date.now()): number | null {
  const at = boardingDepartureMs(dep, nowMs);
  if (at == null) return null;
  return at - nowMs;
}

export function minutesUntilBoarding(dep: ScheduleDeparture, nowMs = Date.now()): number | null {
  const ms = msUntilBoarding(dep, nowMs);
  if (ms == null) return null;
  return Math.max(0, Math.ceil(ms / 60_000));
}

export function formatMinutesUntilBoarding(dep: ScheduleDeparture, nowMs = Date.now()): string {
  const ms = msUntilBoarding(dep, nowMs);
  if (ms == null) return "—";
  if (ms <= 0) return "Boarding now";
  if (ms < 60_000) return "Less than 1 min";
  const mins = Math.ceil(ms / 60_000);
  return mins === 1 ? "1 min" : `${mins} min`;
}
