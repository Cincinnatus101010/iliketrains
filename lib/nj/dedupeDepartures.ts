import { parseNjScheduleAtMs } from "@/lib/formatTime";
import type { ScheduleDeparture } from "@/types";

const UPCOMING_GRACE_MS = 2 * 60 * 1000;

/** NJ day schedules often list the same train twice (service date + calendar date). Keep the next departure per train. */
export function dedupeUpcomingDepartures(
  items: ScheduleDeparture[],
  refMs = Date.now(),
): ScheduleDeparture[] {
  const cutoff = refMs - UPCOMING_GRACE_MS;
  const byTrain = new Map<string, { item: ScheduleDeparture; at: number }>();

  for (const item of items) {
    const at = parseNjScheduleAtMs(item.scheduledAt, refMs);
    if (at == null || at < cutoff) continue;
    const prev = byTrain.get(item.trainId);
    if (!prev || at < prev.at) {
      byTrain.set(item.trainId, { item, at });
    }
  }

  return [...byTrain.values()].sort((a, b) => a.at - b.at).map((row) => row.item);
}

/** Collapse duplicate rows per train and sort by time — no “now” cutoff (trip planner). */
export function dedupeDeparturesByTrain(items: ScheduleDeparture[]): ScheduleDeparture[] {
  const byTrain = new Map<string, { item: ScheduleDeparture; at: number }>();

  for (const item of items) {
    const at = parseNjScheduleAtMs(item.scheduledAt);
    if (at == null) continue;
    const prev = byTrain.get(item.trainId);
    if (!prev || at < prev.at) {
      byTrain.set(item.trainId, { item, at });
    }
  }

  return [...byTrain.values()].sort((a, b) => a.at - b.at).map((row) => row.item);
}

/** Remove exact duplicate rows; keep every distinct departure time (trip picker). */
export function sortUniqueDepartureRows(items: ScheduleDeparture[]): ScheduleDeparture[] {
  const seen = new Set<string>();
  const rows: { item: ScheduleDeparture; at: number }[] = [];

  for (const item of items) {
    const at = parseNjScheduleAtMs(item.scheduledAt);
    if (at == null) continue;
    const key = `${item.trainId}\0${item.scheduledAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ item, at });
  }

  return rows.sort((a, b) => a.at - b.at).map((row) => row.item);
}
