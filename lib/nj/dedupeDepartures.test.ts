import { describe, expect, it } from "vitest";
import type { ScheduleDeparture } from "@/types";
import {
  dedupeDeparturesByTrain,
  dedupeUpcomingDepartures,
  sortUniqueDepartureRows,
} from "./dedupeDepartures";

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

describe("sortUniqueDepartureRows", () => {
  it("keeps two departures for the same train at different times", () => {
    const items = [dep("1", "20-Sep-2026 10:19:30 PM"), dep("1", "21-Sep-2026 12:19:30 AM")];
    expect(sortUniqueDepartureRows(items)).toHaveLength(2);
  });
});

describe("dedupeDeparturesByTrain", () => {
  it("sorts by time and dedupes without dropping past departures", () => {
    const items = [
      dep("2", "20-Sep-2026 10:20:00 AM"),
      dep("1", "20-Sep-2026 10:19:30 AM"),
      dep("1", "21-Sep-2026 10:19:30 AM"),
    ];
    const out = dedupeDeparturesByTrain(items);
    expect(out.map((i) => `${i.trainId}:${i.scheduledAt}`)).toEqual([
      "1:20-Sep-2026 10:19:30 AM",
      "2:20-Sep-2026 10:20:00 AM",
    ]);
  });
});
