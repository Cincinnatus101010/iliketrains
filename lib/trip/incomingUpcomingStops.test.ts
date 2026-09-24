import { describe, expect, it } from "vitest";
import { upcomingStopsAlongBoardingApproach } from "./incomingUpcomingStops";

const order = ["Dover", "Summit", "Newark Broad St", "Secaucus", "HOBOKEN"];

describe("upcomingStopsAlongBoardingApproach", () => {
  it("lists stops from estimated position through boarding", () => {
    const stops = upcomingStopsAlongBoardingApproach(order, "HOBOKEN", "Dover", true, 0.5);
    expect(stops.length).toBeGreaterThan(0);
    expect(stops.some((s) => s.name === "HOBOKEN")).toBe(true);
  });

  it("returns empty when boarding is not on the line", () => {
    expect(upcomingStopsAlongBoardingApproach(order, "Madison", "Dover", true, 0.5)).toEqual([]);
  });
});
