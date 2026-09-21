import { describe, expect, it } from "vitest";
import { routeStepsForDisplay, tripTransferStopNames } from "./routeDisplaySteps";
import type { RouteStep } from "./types";

describe("routeStepsForDisplay", () => {
  it("inserts a platform transfer between two rides", () => {
    const steps: RouteStep[] = [
      {
        kind: "ride",
        route: "MNE",
        fromName: "Madison",
        toName: "Newark Broad St",
        color: "#f00",
        network: "njt",
      },
      {
        kind: "ride",
        route: "BNTN",
        fromName: "Newark Broad St",
        toName: "Hoboken",
        color: "#0f0",
        network: "njt",
      },
    ];
    const out = routeStepsForDisplay(steps);
    expect(out).toHaveLength(3);
    expect(out[1]?.kind).toBe("walk");
    expect(out[1]?.fromName).toBe("Newark Broad St");
    expect(out[1]?.toName).toBe("Newark Broad St");
  });
});

describe("tripTransferStopNames", () => {
  it("lists end of each ride except the last", () => {
    const steps: RouteStep[] = [
      {
        kind: "ride",
        route: "MNE",
        fromName: "A",
        toName: "Newark Broad St",
        color: null,
      },
      {
        kind: "ride",
        route: "BNTN",
        fromName: "Newark Broad St",
        toName: "Hoboken",
        color: null,
      },
    ];
    expect(tripTransferStopNames(steps)).toEqual(["Newark Broad St"]);
  });
});
