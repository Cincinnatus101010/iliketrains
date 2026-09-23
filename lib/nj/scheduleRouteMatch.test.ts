import { describe, expect, it } from "vitest";
import type { ScheduleDeparture } from "@/types";
import { itemMatchesRoute, scheduleRowAtStation } from "./stationSchedule";

function dep(partial: Partial<ScheduleDeparture>): ScheduleDeparture {
  return {
    trainId: "1",
    destination: "Hoboken",
    line: "Morris & Essex Line",
    lineCode: "ME",
    lineAbbrev: "MNE",
    track: "1",
    scheduledAt: "20-Sep-2026 10:19:00 PM",
    status: "",
    secLate: 0,
    ...partial,
  };
}

describe("scheduleRowAtStation", () => {
  it("drops rows for other stops on the same line timetable", () => {
    expect(scheduleRowAtStation("HB", "MA")).toBe(false);
    expect(scheduleRowAtStation("MA", "MA")).toBe(true);
    expect(scheduleRowAtStation(undefined, "MA")).toBe(true);
  });
});

describe("itemMatchesRoute (19-rec fallback)", () => {
  it("matches Morris & Essex from 19-rec abbreviations", () => {
    expect(
      itemMatchesRoute(dep({ lineAbbrev: "M&E", lineCode: "ME", line: "Morristown Line" }), "MNE"),
    ).toBe(true);
  });
});
