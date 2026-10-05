import { describe, expect, it } from "vitest";
import type { LiveTrain, SavedTrip } from "@/app/types";
import { isFollowingChosenDeparture } from "./chosenDepartureTracking";

const chosenLive: LiveTrain = {
  id: "njt-100",
  network: "njt",
  route: "MNE",
  lineName: "M&E",
  label: "Summit",
  latitude: 40.7,
  longitude: -74.3,
  color: "#08A652",
  stopName: "SUMMIT",
  trainNumber: "100",
  direction: null,
  trackCircuit: null,
  platformTrack: null,
  scheduledDeparture: null,
  status: "On schedule",
  inMotion: true,
};

const otherLive: LiveTrain = { ...chosenLive, id: "njt-200", trainNumber: "200" };

const trip: SavedTrip = {
  fromKey: "njt:63",
  toKey: "njt:77",
  fromName: "HOBOKEN",
  toName: "MADISON",
  savedAt: new Date().toISOString(),
  route: { stopCount: 2, coordinatesLonLat: [], steps: [] },
  chosenDeparture: {
    trainId: "100",
    destination: "Dover",
    line: "Morris & Essex",
    lineCode: "ME",
    lineAbbrev: "M&E",
    track: "6",
    scheduledAt: "20-Sep-2026 10:30:00 AM",
    status: "On Time",
    secLate: 0,
  },
  tracking: { mode: "train", trainId: "njt-200" },
};

describe("isFollowingChosenDeparture", () => {
  it("is false when manually following a different train", () => {
    expect(isFollowingChosenDeparture(trip, otherLive, [chosenLive, otherLive])).toBe(false);
  });

  it("is true when the tracked train is the chosen departure", () => {
    expect(isFollowingChosenDeparture(trip, chosenLive, [chosenLive, otherLive])).toBe(true);
  });
});
