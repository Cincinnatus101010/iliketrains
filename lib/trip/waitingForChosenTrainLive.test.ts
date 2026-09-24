import { describe, expect, it } from "vitest";
import type { LiveTrain, SavedTrip } from "@/types";
import { waitingForChosenTrainLive } from "./waitingForChosenTrainLive";

const live: LiveTrain = {
  id: "njt-06644",
  network: "njt",
  route: "MNE",
  lineName: "M&E",
  label: "Summit",
  latitude: 40.7,
  longitude: -74.3,
  color: "#08A652",
  stopName: "SUMMIT",
  trainNumber: "06644",
  direction: null,
  trackCircuit: null,
  platformTrack: null,
  scheduledDeparture: null,
  status: "On schedule",
  inMotion: true,
};

const trip: SavedTrip = {
  fromKey: "njt:63",
  toKey: "njt:77",
  fromName: "HOBOKEN",
  toName: "MADISON",
  savedAt: new Date().toISOString(),
  route: { stopCount: 2, coordinatesLonLat: [], steps: [] },
  chosenDeparture: {
    trainId: "6644",
    destination: "Dover",
    line: "Morris & Essex",
    lineCode: "ME",
    lineAbbrev: "M&E",
    track: "6",
    scheduledAt: "20-Sep-2026 10:30:00 AM",
    status: "On Time",
    secLate: 0,
  },
  tracking: { mode: "auto" },
};

describe("waitingForChosenTrainLive", () => {
  it("is false when the chosen train is in the feed (including padded vehicle ids)", () => {
    expect(waitingForChosenTrainLive(trip, [live])).toBe(false);
  });

  it("is true when the chosen train is not in the feed", () => {
    expect(waitingForChosenTrainLive(trip, [])).toBe(true);
  });
});
