import { describe, expect, it } from "vitest";
import type { PlannedRoute } from "@/types";
import { tripBoardingContext, walkMinutesBeforeFirstRide } from "./tripBoarding";

function route(steps: PlannedRoute["steps"]): PlannedRoute {
  return { steps, coordinatesLonLat: [], stopCount: 2 };
}

describe("tripBoarding", () => {
  it("sums walk minutes before the first ride", () => {
    const r = route([
      {
        kind: "walk",
        route: null,
        fromName: "A",
        toName: "B",
        color: null,
        walkMinutes: 4,
      },
      {
        kind: "ride",
        route: "NEC",
        fromName: "B",
        toName: "C",
        color: "#f00",
        fromKey: "njt:B",
        network: "njt",
      },
    ]);
    expect(walkMinutesBeforeFirstRide(r)).toBe(4);
    expect(tripBoardingContext(r, "A")).toEqual({
      stationKey: "njt:B",
      stationName: "B",
      walkMinutes: 4,
      tripOriginName: "A",
    });
  });

  it("uses origin when first step is a ride", () => {
    const r = route([
      {
        kind: "ride",
        route: "NEC",
        fromName: "Newark",
        toName: "NY",
        color: "#f00",
        fromKey: "njt:63",
        network: "njt",
      },
    ]);
    expect(walkMinutesBeforeFirstRide(r)).toBe(0);
    expect(tripBoardingContext(r, "Newark")?.stationKey).toBe("njt:63");
  });
});
