import { describe, expect, it } from "vitest";
import type { ScheduleDeparture } from "@/app/types";
import { parseNjScheduleAtMs } from "@/lib/formatTime";
import { formatMinutesUntilBoarding, msUntilBoarding } from "./chosenDepartureEta";

function njAt(raw: string): number {
  const ms = parseNjScheduleAtMs(raw);
  if (ms == null) throw new Error(`invalid NJ schedule: ${raw}`);
  return ms;
}

const dep: ScheduleDeparture = {
  trainId: "1",
  destination: "X",
  line: "Line",
  lineCode: "BNTN",
  lineAbbrev: "L",
  track: null,
  scheduledAt: "20-Sep-2026 10:30:00 AM",
  status: "On Time",
  secLate: 120,
};

describe("chosenDepartureEta", () => {
  it("includes secLate in boarding time", () => {
    const base = njAt("20-Sep-2026 10:29:00 AM");
    const ms = msUntilBoarding(dep, base);
    expect(ms).toBe(180_000);
  });

  it("formats minutes until boarding", () => {
    const label = formatMinutesUntilBoarding(dep, njAt("20-Sep-2026 10:00:00 AM"));
    expect(label).toMatch(/min/);
  });
});
