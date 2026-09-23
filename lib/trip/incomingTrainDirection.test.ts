import { describe, expect, it } from "vitest";
import { approachFromHighDist } from "./incomingTrainDirection";

const line = ["DOVER", "MORRISTOWN", "SUMMIT", "NEWARK BROAD ST", "HOBOKEN", "NEW YORK"];

describe("approachFromHighDist", () => {
  it("train heading west to Hoboken approaches from higher milepost (NY side)", () => {
    expect(approachFromHighDist(line, "HOBOKEN", "Dover")).toBe(true);
  });

  it("train heading east from Hoboken approaches from lower milepost", () => {
    expect(approachFromHighDist(line, "HOBOKEN", "New York")).toBe(false);
  });

  it("returns null when destination is not on the ordered list", () => {
    expect(approachFromHighDist(line, "HOBOKEN", "Trenton")).toBeNull();
  });
});
