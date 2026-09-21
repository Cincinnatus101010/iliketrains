import { describe, expect, it } from "vitest";
import { mergeLiveTrains } from "./mergeLiveTrains";
import type { LiveTrain } from "./types";

function train(partial: Partial<LiveTrain> & Pick<LiveTrain, "id">): LiveTrain {
  return {
    network: "njt",
    route: "MNE",
    lineName: "Morris & Essex",
    label: partial.id,
    latitude: 40,
    longitude: -74,
    color: "#08A652",
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

describe("mergeLiveTrains", () => {
  it("keeps subway and NJ trains when nothing is followed", () => {
    const subway = [train({ id: "mta-1", network: "mta", route: "1" })];
    const nj = [train({ id: "njt-1" }), train({ id: "njt-2" })];
    expect(mergeLiveTrains(subway, nj, undefined).map((t) => t.id)).toEqual([
      "mta-1",
      "njt-1",
      "njt-2",
    ]);
  });

  it("overlays the followed train without dropping the rest", () => {
    const subway = [train({ id: "mta-1", network: "mta", route: "1" })];
    const nj = [train({ id: "njt-6941", latitude: 40.1 })];
    const followed = [train({ id: "njt-6941", latitude: 40.9 })];
    const merged = mergeLiveTrains(subway, nj, followed);
    expect(merged.map((t) => t.id)).toEqual(["mta-1", "njt-6941"]);
    expect(merged[1]?.latitude).toBe(40.9);
  });

  it("still includes a followed train missing from the bulk feed", () => {
    const merged = mergeLiveTrains([], [train({ id: "njt-1" })], [train({ id: "njt-9" })]);
    expect(merged.map((t) => t.id)).toEqual(["njt-1", "njt-9"]);
  });
});
