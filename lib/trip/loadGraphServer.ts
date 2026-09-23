import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TripGraph } from "@/types";
import { parseTripGraphRaw } from "./parseTripGraph";

let cached: TripGraph | null = null;
let inflight: Promise<TripGraph | null> | null = null;

export async function loadTripGraphServer(): Promise<TripGraph | null> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const filePath = path.join(process.cwd(), "public/data/transit-graph.json");
      const text = await readFile(filePath, "utf8");
      const raw = JSON.parse(text) as Parameters<typeof parseTripGraphRaw>[0];
      cached = parseTripGraphRaw(raw);
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
