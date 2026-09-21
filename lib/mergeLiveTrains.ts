import type { LiveTrain } from "@/lib/types";

/** Combine bulk feeds and overlay a faster single-train follow poll when present. */
export function mergeLiveTrains(
  subway: LiveTrain[],
  nj: LiveTrain[],
  followed: LiveTrain[] | undefined,
): LiveTrain[] {
  const overlay = new Map((followed ?? []).map((train) => [train.id, train]));
  const seen = new Set<string>();
  const out: LiveTrain[] = [];

  for (const train of [...subway, ...nj]) {
    if (seen.has(train.id)) continue;
    seen.add(train.id);
    out.push(overlay.get(train.id) ?? train);
  }

  for (const train of followed ?? []) {
    if (seen.has(train.id)) continue;
    seen.add(train.id);
    out.push(train);
  }

  return out;
}
