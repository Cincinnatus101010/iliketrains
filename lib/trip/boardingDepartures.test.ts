import { describe, expect, it } from "vitest";
import type { PlannedRoute, ScheduleDeparture } from "@/types";
import { departuresForBoarding } from "./boardingDepartures";

function hobokenToMadisonRoute(): PlannedRoute {
  return {
    stopCount: 2,
    coordinatesLonLat: [],
    steps: [
      {
        kind: "ride",
        route: "BNTN",
        fromName: "HOBOKEN",
        toName: "NEWARK BROAD ST",
        color: "#E66859",
        network: "njt",
        fromKey: "njt:63",
        toKey: "njt:106",
      },
      {
        kind: "ride",
        route: "MNE",
        fromName: "NEWARK BROAD ST",
        toName: "MADISON",
        color: "#08A652",
        network: "njt",
        fromKey: "njt:106",
        toKey: "njt:77",
      },
    ],
  };
}

function dep(
  partial: Partial<ScheduleDeparture> & Pick<ScheduleDeparture, "destination">,
): ScheduleDeparture {
  return {
    trainId: partial.trainId ?? "1",
    destination: partial.destination,
    line: partial.line ?? "BNTN",
    lineCode: partial.lineCode ?? "BNTN",
    lineAbbrev: partial.lineAbbrev ?? "BNTN",
    track: partial.track ?? "3",
    scheduledAt: partial.scheduledAt ?? "2026-06-01T18:30:00",
    status: "Scheduled",
    secLate: 0,
  };
}

describe("departuresForBoarding", () => {
  const now = Date.parse("2026-06-01T17:00:00.000Z");

  it("keeps BNTN departures toward Newark Broad St or Madison", () => {
    const items = [
      dep({ trainId: "101", destination: "Newark Broad St", scheduledAt: "2026-06-01T18:30:00" }),
      dep({ trainId: "102", destination: "Dover", scheduledAt: "2026-06-01T18:45:00" }),
      dep({ trainId: "103", destination: "New York", scheduledAt: "2026-06-01T19:00:00" }),
    ];
    const out = departuresForBoarding(items, hobokenToMadisonRoute(), "BNTN", 0, now);
    expect(out.map((d) => d.trainId)).toEqual(["101", "102"]);
  });

  it("includes track on each row", () => {
    const items = [
      dep({
        trainId: "101",
        destination: "Newark Broad St",
        track: "7",
        scheduledAt: "2026-06-01T18:30:00",
      }),
    ];
    const out = departuresForBoarding(items, hobokenToMadisonRoute(), "BNTN", 0, now);
    expect(out[0]?.track).toBe("7");
  });
});
