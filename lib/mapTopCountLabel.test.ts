import { describe, expect, it } from "vitest";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { mapTopCountLabel } from "./mapTopCountLabel";

const sampleTrip = {
  savedAt: "2026-01-01T00:00:00.000Z",
  fromKey: "njt:NYP",
  toKey: "njt:NBK",
  fromName: "New York",
  toName: "Newark",
  route: { steps: [], coordinatesLonLat: [], stopCount: 0 },
} satisfies SavedTrip;

describe("mapTopCountLabel", () => {
  it("shows onboard copy when tracking", () => {
    expect(mapTopCountLabel(3, { isTracking: true, savedTrip: null })).toBe("On train");
  });

  it("shows route count during a trip", () => {
    expect(mapTopCountLabel(2, { isTracking: false, savedTrip: sampleTrip })).toBe("2 on route");
  });

  it("shows scoped live count otherwise", () => {
    expect(mapTopCountLabel(5, { isTracking: false, savedTrip: null })).toBe("5 live");
  });
});
