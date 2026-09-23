import { describe, expect, it } from "vitest";
import type { PlannedRoute, SavedTrip, ScheduleDeparture } from "@/types";
import { haversineMeters } from "./geo";
import { boardingNodeIndex, estimateIncomingLngLat } from "./incomingTrainEstimate";

function haversine(a: [number, number], b: [number, number]) {
  return haversineMeters(a[1], a[0], b[1], b[0]);
}

const route: PlannedRoute = {
  stopCount: 3,
  coordinatesLonLat: [
    [-74.02, 40.73],
    [-74.03, 40.74],
    [-74.04, 40.75],
  ],
  steps: [
    {
      kind: "walk",
      route: null,
      fromName: "A",
      toName: "B",
      color: null,
      fromKey: "a",
      toKey: "b",
      walkMinutes: 5,
    },
    {
      kind: "ride",
      route: "BNTN",
      fromName: "B",
      toName: "C",
      color: "#f00",
      network: "njt",
      fromKey: "b",
      toKey: "c",
    },
  ],
};

const trip: SavedTrip = {
  fromKey: "a",
  toKey: "c",
  fromName: "A",
  toName: "C",
  route,
  savedAt: new Date().toISOString(),
};

const dep: ScheduleDeparture = {
  trainId: "101",
  destination: "Dover",
  line: "Montclair-Boonton",
  lineCode: "BNTN",
  lineAbbrev: "MB",
  track: "6",
  scheduledAt: "20-Sep-2026 10:30:00 AM",
  status: "On Time",
  secLate: 0,
};

describe("boardingNodeIndex", () => {
  it("points at the first ride boarding stop along the path", () => {
    expect(boardingNodeIndex(route)).toBe(1);
  });
});

describe("estimateIncomingLngLat", () => {
  it("moves toward boarding as departure approaches", () => {
    const far = estimateIncomingLngLat(
      { ...trip, chosenDeparture: dep },
      dep,
      Date.parse("20-Sep-2026 09:00:00 AM"),
    );
    const near = estimateIncomingLngLat(
      { ...trip, chosenDeparture: dep },
      dep,
      Date.parse("20-Sep-2026 10:29:00 AM"),
    );
    expect(far).not.toEqual(near);
    const boarding = route.coordinatesLonLat[2]!;
    const distFar = haversine(far!, boarding);
    const distNear = haversine(near!, boarding);
    expect(distNear).toBeLessThan(distFar);
  });
});
