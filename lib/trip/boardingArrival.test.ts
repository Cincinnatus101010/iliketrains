import { describe, expect, it } from "vitest";
import type { LiveTrain } from "@/types";
import { isEnRouteToBoarding } from "./boardingArrival";

function train(partial: Partial<LiveTrain> & Pick<LiveTrain, "stopName">): LiveTrain {
  return {
    id: "njt-1",
    network: "njt",
    route: "MNE",
    lineName: "M&E",
    label: partial.stopName ?? "",
    latitude: 40.7,
    longitude: -74.3,
    color: "#000",
    trainNumber: "1",
    direction: null,
    trackCircuit: null,
    platformTrack: null,
    scheduledDeparture: null,
    status: "On schedule",
    inMotion: true,
    atStation: false,
    ...partial,
  };
}

const order = ["Dover", "Summit", "Newark Broad St", "Secaucus", "HOBOKEN"];

describe("isEnRouteToBoarding", () => {
  it("is false after the train has been at the boarding platform", () => {
    const live = train({ stopName: "Secaucus", inMotion: true });
    expect(
      isEnRouteToBoarding(live, "HOBOKEN", {
        orderedStops: order,
        trainDestination: "Dover",
        hasVisitedBoarding: true,
      }),
    ).toBe(false);
  });

  it("is true while still approaching boarding from the correct side", () => {
    const live = train({ stopName: "Newark Broad St", inMotion: true });
    expect(
      isEnRouteToBoarding(live, "HOBOKEN", {
        orderedStops: order,
        trainDestination: "Dover",
      }),
    ).toBe(true);
  });
});
