import { describe, expect, it } from "vitest";
import type { LiveTrain, SavedTrip } from "@/types";
import { resolveTrackedTrain } from "./resolveTrackedTrain";

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

const manualLive: LiveTrain = {
  ...chosenLive,
  id: "njt-200",
  trainNumber: "200",
  label: "Other",
};

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

describe("resolveTrackedTrain", () => {
  it("respects manual follow when user picked a different train than the departure", () => {
    expect(resolveTrackedTrain([chosenLive, manualLive], "njt-200", trip)).toBe(manualLive);
  });

  it("uses chosen departure match in auto mode", () => {
    const autoTrip = { ...trip, tracking: { mode: "auto" as const } };
    expect(resolveTrackedTrain([chosenLive, manualLive], "njt-100", autoTrip)).toBe(chosenLive);
  });
});
