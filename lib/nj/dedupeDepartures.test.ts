import { describe, expect, it } from "vitest";
import type { ScheduleDeparture } from "@/lib/types";
import { dedupeUpcomingDepartures } from "./dedupeDepartures";

function dep(trainId: string, at: string): ScheduleDeparture {
  return {
    trainId,
    destination: "NY",
    line: "MNE",
    lineCode: "MNE",
    lineAbbrev: "MNE",
    track: "1",
    scheduledAt: at,
    status: "",
    secLate: 0,
  };
}

describe("dedupeUpcomingDepartures", () => {
  const ref = Date.parse("Sun Sep 20 2026 21:55:00 GMT-0400");

  it("keeps the soonest future row per train when API duplicates service dates", () => {
    const items = [
      dep("6945", "20-Sep-2026 12:19:30 AM"),
      dep("6945", "21-Sep-2026 12:19:30 AM"),
      dep("6941", "20-Sep-2026 10:19:30 PM"),
    ];
    const out = dedupeUpcomingDepartures(items, ref);
    expect(out.map((i) => i.scheduledAt)).toEqual([
      "20-Sep-2026 10:19:30 PM",
      "21-Sep-2026 12:19:30 AM",
    ]);
  });
});
