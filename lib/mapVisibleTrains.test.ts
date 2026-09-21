import { describe, expect, it } from "vitest";
import { filterMapVisibleTrains } from "./mapVisibleTrains";
import type { LiveTrain } from "./types";

function train(
  partial: Partial<LiveTrain> & Pick<LiveTrain, "id" | "network" | "route">,
): LiveTrain {
  return {
    lineName: partial.route,
    label: partial.id,
    latitude: 40,
    longitude: -74,
    color: "#fff",
    stopName: null,
    trainNumber: null,
    direction: null,
    trackCircuit: null,
    platformTrack: null,
    scheduledDeparture: null,
    status: "",
    inMotion: true,
    ...partial,
  };
}

describe("filterMapVisibleTrains", () => {
  const trains = [
    train({ id: "mta-1", network: "mta", route: "1" }),
    train({ id: "njt-1", network: "njt", route: "MNE" }),
    train({ id: "njt-2", network: "njt", route: "NEC" }),
  ];

  it("shows every train in scope even when one is followed", () => {
    expect(filterMapVisibleTrains(trains, "all", null).map((t) => t.id)).toEqual([
      "mta-1",
      "njt-1",
      "njt-2",
    ]);
  });

  it("still honors line filter", () => {
    expect(filterMapVisibleTrains(trains, "njt", "njt:MNE").map((t) => t.id)).toEqual(["njt-1"]);
  });
});
