import { describe, expect, it } from "vitest";
import type { PlannedRoute, ScheduleDeparture } from "@/types";
import {
  boardingDepartureKind,
  filterDeparturesAfterArrival,
  filterDeparturesTowardTrip,
} from "./filterDepartures";

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

function madisonToHoboken(): PlannedRoute {
  return {
    steps: [
      {
        kind: "ride",
        route: "MNE",
        fromName: "Madison",
        toName: "Hoboken",
        color: "#f00",
        fromKey: "njt:MA",
        toKey: "njt:HB",
        network: "njt",
      },
    ],
    coordinatesLonLat: [],
    stopCount: 2,
  };
}

describe("filterDeparturesTowardTrip", () => {
  it("drops opposite-direction trains on the same line", () => {
    const items = [
      {
        ...dep("20-Sep-2026 10:19:00 PM"),
        trainId: "1",
        destination: "Hoboken",
        lineAbbrev: "MNE",
      },
      {
        ...dep("20-Sep-2026 10:31:00 PM"),
        trainId: "2",
        destination: "Dover",
        lineAbbrev: "MNE",
      },
    ];
    const out = filterDeparturesTowardTrip(items, madisonToHoboken());
    expect(out.map((i) => i.trainId)).toEqual(["1"]);
  });

  it("keeps departures that are not clearly opposite direction", () => {
    const items = [
      {
        ...dep("20-Sep-2026 10:19:00 PM"),
        trainId: "1",
        destination: "Hoboken",
        lineAbbrev: "MNE",
      },
      {
        ...dep("20-Sep-2026 10:25:00 PM"),
        trainId: "3",
        destination: "Summit",
        lineAbbrev: "MNE",
      },
      {
        ...dep("20-Sep-2026 10:31:00 PM"),
        trainId: "2",
        destination: "Dover",
        lineAbbrev: "MNE",
      },
    ];
    const out = filterDeparturesTowardTrip(items, madisonToHoboken());
    expect(out.map((i) => i.trainId)).toEqual(["1", "3"]);
  });
});

describe("boardingDepartureKind", () => {
  it("marks through-trains direct and others as transfer", () => {
    const route: PlannedRoute = {
      stopCount: 2,
      coordinatesLonLat: [],
      stats: {
        transferCount: 1,
        rideCount: 2,
        walkCount: 0,
        stationCount: 2,
        totalWalkM: 0,
        totalWalkMin: 0,
        lines: [],
      },
      steps: [
        {
          kind: "ride",
          route: "BNTN",
          fromName: "HOBOKEN",
          toName: "NEWARK BROAD ST",
          color: null,
          fromKey: "a",
          toKey: "b",
        },
        {
          kind: "ride",
          route: "MNE",
          fromName: "NEWARK BROAD ST",
          toName: "MADISON",
          color: null,
          fromKey: "b",
          toKey: "c",
        },
      ],
    };
    expect(boardingDepartureKind(route, { ...dep(""), destination: "Madison" })).toBe("direct");
    expect(boardingDepartureKind(route, { ...dep(""), destination: "Dover" })).toBe("transfer");
  });
});

describe("filterDeparturesAfterArrival", () => {
  const now = Date.parse("20-Sep-2026 10:00:00 AM");

  it("keeps departures after walk time from now", () => {
    const items = [dep("20-Sep-2026 10:05:00 AM"), dep("20-Sep-2026 10:20:00 AM")];
    const out = filterDeparturesAfterArrival(items, 10, now);
    expect(out.map((i) => i.scheduledAt)).toEqual(["20-Sep-2026 10:20:00 AM"]);
  });
});
