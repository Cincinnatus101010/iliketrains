import { describe, expect, it } from "vitest";
import type { PlannedRoute, RouteStep } from "@/types";
import { boardingScheduleLineCodes } from "./boardingLines";

function ride(
  partial: Partial<RouteStep> &
    Pick<RouteStep, "route" | "fromKey" | "toKey" | "fromName" | "toName">,
): RouteStep {
  return {
    kind: "ride",
    color: null,
    network: "njt",
    ...partial,
  };
}

function hobokenToMadison(): PlannedRoute {
  return {
    stopCount: 2,
    coordinatesLonLat: [],
    steps: [
      ride({
        route: "BNTN",
        fromName: "HOBOKEN",
        toName: "NEWARK BROAD ST",
        fromKey: "njt:63",
        toKey: "njt:106",
      }),
      ride({
        route: "MNE",
        fromName: "NEWARK BROAD ST",
        toName: "MADISON",
        fromKey: "njt:106",
        toKey: "njt:77",
      }),
    ],
  };
}

describe("boardingScheduleLineCodes", () => {
  it("at origin hub includes first-leg and later trip lines (Hoboken → Madison)", () => {
    expect(boardingScheduleLineCodes(hobokenToMadison(), "njt:63").sort()).toEqual(["BNTN", "MNE"]);
  });

  it("direct single-leg trip uses only that line (Madison → Morristown)", () => {
    const route: PlannedRoute = {
      stopCount: 2,
      coordinatesLonLat: [],
      steps: [
        ride({
          route: "MNE",
          fromName: "MADISON",
          toName: "MORRISTOWN",
          fromKey: "njt:77",
          toKey: "njt:92",
        }),
      ],
    };
    expect(boardingScheduleLineCodes(route, "njt:77")).toEqual(["MNE"]);
  });

  it("boards after walk uses lines departing that stop, not the trip origin", () => {
    const route: PlannedRoute = {
      stopCount: 3,
      coordinatesLonLat: [],
      steps: [
        {
          kind: "walk",
          route: null,
          fromName: "A",
          toName: "NEWARK PENN STATION",
          color: null,
          fromKey: "njt:100",
          toKey: "njt:107",
          walkMinutes: 8,
        },
        ride({
          route: "NEC",
          fromName: "NEWARK PENN STATION",
          toName: "TRENTON",
          fromKey: "njt:107",
          toKey: "njt:148",
        }),
      ],
    };
    expect(boardingScheduleLineCodes(route, "njt:107")).toEqual(["NEC"]);
  });

  it("transfer boarding at mid-trip stop does not pull lines from other stations", () => {
    const route = hobokenToMadison();
    expect(boardingScheduleLineCodes(route, "njt:106").sort()).toEqual(["MNE"]);
  });

  it("NEC-only corridor trip at origin requests one line (Newark Penn → Trenton)", () => {
    const route: PlannedRoute = {
      stopCount: 2,
      coordinatesLonLat: [],
      steps: [
        ride({
          route: "NEC",
          fromName: "NEWARK PENN STATION",
          toName: "TRENTON",
          fromKey: "njt:107",
          toKey: "njt:148",
        }),
      ],
    };
    expect(boardingScheduleLineCodes(route, "njt:107")).toEqual(["NEC"]);
  });

  it("non-hub transfer origin only queries lines boarding there (Secaucus → Newark → Madison)", () => {
    const route: PlannedRoute = {
      stopCount: 3,
      coordinatesLonLat: [],
      steps: [
        ride({
          route: "PASC",
          fromName: "SECAUCUS LOWER LEVEL",
          toName: "NEWARK BROAD ST",
          fromKey: "njt:38174",
          toKey: "njt:106",
        }),
        ride({
          route: "MNE",
          fromName: "NEWARK BROAD ST",
          toName: "MADISON",
          fromKey: "njt:106",
          toKey: "njt:77",
        }),
      ],
    };
    expect(boardingScheduleLineCodes(route, "njt:38174").sort()).toEqual(["PASC"]);
  });
});
