import { describe, expect, it } from "vitest";
import type { ScheduleDeparture } from "@/lib/types";
import { filterDeparturesAfterArrival } from "./filterDepartures";

function dep(at: string): ScheduleDeparture {
  return {
    trainId: "1",
    destination: "NY",
    line: "Northeast Corridor",
    lineCode: "NEC",
    lineAbbrev: "NEC",
    track: null,
    scheduledAt: at,
    status: "",
    secLate: 0,
  };
}

describe("filterDeparturesAfterArrival", () => {
  const now = Date.parse("20-Sep-2026 10:00:00 AM");

  it("keeps departures after walk time from now", () => {
    const items = [dep("20-Sep-2026 10:05:00 AM"), dep("20-Sep-2026 10:20:00 AM")];
    const out = filterDeparturesAfterArrival(items, 10, now);
    expect(out.map((i) => i.scheduledAt)).toEqual(["20-Sep-2026 10:20:00 AM"]);
  });
});
