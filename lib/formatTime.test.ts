import { describe, expect, it } from "vitest";
import { formatNjScheduleDeparture, parseNjScheduleAtMs } from "./formatTime";

describe("parseNjScheduleAtMs", () => {
  const ref = Date.parse("Sun Sep 20 2026 21:55:00 GMT-0400");

  it("parses dated NJ strings with seconds", () => {
    expect(parseNjScheduleAtMs("20-Sep-2026 10:19:30 PM", ref)).toBe(
      Date.parse("Sun Sep 20 2026 22:19:30 GMT-0400"),
    );
  });

  it("does not roll past same-calendar-day times forward", () => {
    const ms = parseNjScheduleAtMs("20-Sep-2026 12:19:30 AM", ref);
    expect(ms).toBe(Date.parse("Sun Sep 20 2026 00:19:30 GMT-0400"));
    expect(ms!).toBeLessThan(ref);
  });
});

describe("formatNjScheduleDeparture", () => {
  const ref = Date.parse("Sun Sep 20 2026 21:55:00 GMT-0400");

  it("shows time only for departures today", () => {
    expect(formatNjScheduleDeparture("20-Sep-2026 10:19:30 PM", ref)).toBe("10:19 PM");
  });

  it("labels tomorrow using the API calendar date", () => {
    expect(formatNjScheduleDeparture("21-Sep-2026 12:19:30 AM", ref)).toMatch(
      /^Tomorrow 12:19 AM$/,
    );
  });
});
