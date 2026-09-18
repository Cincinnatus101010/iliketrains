import type { LiveTrain } from "@/lib/types";

/** Compact signature so map markers skip sync when positions are unchanged. */
export function trainPositionsSignature(trains: LiveTrain[]): string {
  if (trains.length === 0) return "";
  const parts = new Array<string>(trains.length);
  for (let i = 0; i < trains.length; i++) {
    const t = trains[i]!;
    parts[i] = `${t.id}\t${t.latitude.toFixed(5)}\t${t.longitude.toFixed(5)}\t${t.platformTrack ?? ""}\t${t.inMotion ? 1 : 0}`;
  }
  parts.sort();
  return parts.join("\n");
}

export function trainVisualKey(train: LiveTrain): string {
  return [
    train.route,
    train.color,
    train.label,
    train.platformTrack ?? "",
    train.inMotion ? "1" : "0",
    train.status,
    train.network,
  ].join("\t");
}
