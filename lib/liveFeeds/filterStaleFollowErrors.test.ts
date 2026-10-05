import { describe, expect, it } from "vitest";
import type { LiveTrain } from "@/types";
import { filterStaleFollowFeedErrors } from "./filterStaleFollowErrors";

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

describe("filterStaleFollowFeedErrors", () => {
  it("drops follow miss when train is already in merged feed", () => {
    expect(filterStaleFollowFeedErrors(["Train not in live feed"], "njt-6644", [live])).toEqual([]);
  });

  it("keeps follow miss when train is absent", () => {
    expect(filterStaleFollowFeedErrors(["Train not in live feed"], "njt-9999", [live])).toEqual([
      "Train not in live feed",
    ]);
  });
});
