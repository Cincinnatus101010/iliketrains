import { describe, expect, it } from "vitest";
import type { LiveTrain, SavedTrip } from "@/types";
import {
  findLiveTrainForChosenDeparture,
  findNjTrainByFollowId,
  njTrainIdsMatch,
} from "./chosenDepartureLiveMatch";

const live: LiveTrain = {
  id: "njt-6644",
  network: "njt",
  route: "MNE",
  lineName: "M&E",
  label: "Summit",
  latitude: 40.7,
  longitude: -74.3,
  color: "#08A652",
  stopName: "SUMMIT",
  trainNumber: "6644",
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

describe("chosenDepartureLiveMatch", () => {
  it("matches by train number when schedule line code differs from live route id", () => {
    expect(findLiveTrainForChosenDeparture(trip, [live])).toBe(live);
  });

  it("matches numeric train ids with leading zeros", () => {
    expect(njTrainIdsMatch("06644", live)).toBe(true);
  });

  it("findNjTrainByFollowId matches by train number when id differs", () => {
    expect(findNjTrainByFollowId("njt-6644", [live])).toBe(live);
  });
});
