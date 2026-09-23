import { describe, expect, it } from "vitest";
import { resolveNjStationCodeForTrip } from "./resolveNjStation";

describe("resolveNjStationCodeForTrip", () => {
  const stations = [
    { code: "HB", name: "HOBOKEN", shortName: "HOBOKEN" },
    { code: "MA", name: "MADISON", shortName: "MADISON" },
  ];

  it("maps njt graph stop id to API station code via stop catalog", () => {
    expect(resolveNjStationCodeForTrip("njt:63", "HOBOKEN", stations)).toBe("HB");
  });

  it("matches by 2-char code on the key when present", () => {
    expect(resolveNjStationCodeForTrip("njt:HB", "HOBOKEN", stations)).toBe("HB");
  });

  it("maps other graph stop ids via stop catalog (Madison)", () => {
    expect(resolveNjStationCodeForTrip("njt:77", "MADISON", stations)).toBe("MA");
  });
});
