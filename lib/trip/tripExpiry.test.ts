import { describe, expect, it } from "vitest";
import type { SavedTrip } from "./savedTrip";
import {
  activeTripOrNull,
  isTripExpired,
  msUntilTripExpires,
  TRIP_MAX_AGE_MS,
  tripSavedAtMs,
} from "./tripExpiry";

function trip(savedAt: string): SavedTrip {
  return {
    fromKey: "a",
    toKey: "b",
    fromName: "A",
    toName: "B",
    savedAt,
    route: { steps: [], stopCount: 0 },
  };
}

describe("tripExpiry", () => {
  const t0 = Date.parse("2026-06-01T12:00:00.000Z");

  it("parses savedAt", () => {
    expect(tripSavedAtMs(trip("2026-06-01T12:00:00.000Z"))).toBe(t0);
    expect(tripSavedAtMs(trip("not-a-date"))).toBeNull();
  });

  it("expires after 12 hours", () => {
    const active = trip("2026-06-01T12:00:00.000Z");
    expect(isTripExpired(active, t0 + TRIP_MAX_AGE_MS - 1)).toBe(false);
    expect(isTripExpired(active, t0 + TRIP_MAX_AGE_MS)).toBe(true);
  });

  it("msUntilTripExpires", () => {
    const active = trip("2026-06-01T12:00:00.000Z");
    expect(msUntilTripExpires(active, t0)).toBe(TRIP_MAX_AGE_MS);
    expect(msUntilTripExpires(active, t0 + TRIP_MAX_AGE_MS)).toBe(0);
  });

  it("activeTripOrNull drops expired trips", () => {
    const active = trip("2026-06-01T12:00:00.000Z");
    expect(activeTripOrNull(active, t0)).toBe(active);
    expect(activeTripOrNull(active, t0 + TRIP_MAX_AGE_MS)).toBeNull();
  });
});
