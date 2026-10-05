import { describe, expect, it } from "vitest";
import { upcomingStopsAlongBoardingApproach } from "./incomingUpcomingStops";

const order = ["Dover", "Summit", "Newark Broad St", "Secaucus", "HOBOKEN"];

describe("upcomingStopsAlongBoardingApproach", () => {
  it("lists high-milepost approach stops toward boarding (not the terminal side)", () => {
    const stops = upcomingStopsAlongBoardingApproach(order, "HOBOKEN", "Dover", true, 0.5);
    expect(stops.some((s) => s.name === "HOBOKEN")).toBe(true);
    expect(stops.some((s) => s.name === "Dover")).toBe(false);
    expect(stops.some((s) => s.name === "Summit")).toBe(false);
  });

  it("returns empty when boarding is not on the line", () => {
    expect(upcomingStopsAlongBoardingApproach(order, "Madison", "Dover", true, 0.5)).toEqual([]);
  });
});
