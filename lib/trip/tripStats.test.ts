import { describe, expect, it } from "vitest";
import type { PlannedRoute } from "@/types";
import { buildTripStats, tripConnectionLabel } from "./tripStats";

function route(steps: PlannedRoute["steps"]): PlannedRoute {
  return { steps, coordinatesLonLat: [], stopCount: 2 };
}

describe("tripConnectionLabel", () => {
  it("returns Direct for a single ride", () => {
    const r = route([
      {
        kind: "ride",
        route: "MNE",
        fromName: "Madison",
        toName: "Hoboken",
        color: "#f00",
        network: "njt",
      },
    ]);
    expect(tripConnectionLabel(r)).toBe("Direct");
  });

  it("names the transfer stop for two rides", () => {
    const r = route([
      {
        kind: "ride",
        route: "MNE",
        fromName: "Madison",
        toName: "Secaucus",
        color: "#f00",
        network: "njt",
      },
      {
        kind: "ride",
        route: "NEC",
        fromName: "Secaucus",
        toName: "New York Penn",
        color: "#00f",
        network: "njt",
      },
    ]);
    expect(tripConnectionLabel(r)).toBe("Transfer at Secaucus");
    expect(buildTripStats(r.steps, 3).transferCount).toBe(1);
  });
});
