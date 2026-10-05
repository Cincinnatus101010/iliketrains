import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveTrain } from "@/app/types";

const getOrderedStopsForTrain = vi.fn<(train: LiveTrain) => Promise<string[]>>();

vi.mock("./routeStopOrder", () => ({
  getOrderedStopsForTrain: (train: LiveTrain) => getOrderedStopsForTrain(train),
}));

import {
  clearRouteStopsCache,
  ensureRouteStopsLoaded,
  getRouteStopsSnapshot,
  routeStopsKey,
  subscribeRouteStops,
} from "./routeStopsCache";

function train(
  partial: Partial<LiveTrain> & Pick<LiveTrain, "network" | "route" | "id">,
): LiveTrain {
  return {
    lineName: "Test",
    label: "Test",
    latitude: 0,
    longitude: 0,
    color: "#000",
    stopName: null,
    trainNumber: null,
    direction: null,
    trackCircuit: null,
    platformTrack: null,
    scheduledDeparture: null,
    status: "On schedule",
    inMotion: true,
    ...partial,
  };
}

/** Wait until mocked route-stop fetches scheduled in this tick have settled. */
async function flushRouteStopLoads(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("routeStopsKey", () => {
  it("prefers anchorStopId over stopId", () => {
    const t = train({
      id: "mta-1",
      network: "mta",
      route: "A",
      anchorStopId: "parent",
      stopId: "platform",
    });
    expect(routeStopsKey(t)).toBe("mta:A:parent");
  });
});

describe("routeStopsCache", () => {
  beforeEach(() => {
    clearRouteStopsCache();
    getOrderedStopsForTrain.mockClear();
  });

  it("returns empty snapshot until load completes", () => {
    getOrderedStopsForTrain.mockReturnValue(new Promise(() => {}));
    const t = train({ id: "njt-1", network: "njt", route: "__pending__" });
    ensureRouteStopsLoaded(t);
    expect(getRouteStopsSnapshot(t)).toEqual([]);
  });

  it("caches ordered stop names after fetch resolves", async () => {
    const t = train({ id: "njt-2", network: "njt", route: "NEC", stopId: "NY" });
    getOrderedStopsForTrain.mockResolvedValue(["Newark", "New York"]);

    ensureRouteStopsLoaded(t);
    await flushRouteStopLoads();
    expect(getRouteStopsSnapshot(t)).toEqual(["Newark", "New York"]);
    expect(getOrderedStopsForTrain).toHaveBeenCalledTimes(1);

    ensureRouteStopsLoaded(t);
    expect(getOrderedStopsForTrain).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers when data arrives", async () => {
    const t = train({ id: "mta-2", network: "mta", route: "1" });
    getOrderedStopsForTrain.mockResolvedValue(["Van Cortlandt", "South Ferry"]);
    let calls = 0;
    subscribeRouteStops(() => {
      calls += 1;
    });

    ensureRouteStopsLoaded(t);
    await flushRouteStopLoads();
    expect(calls).toBeGreaterThan(0);
  });

  it("evicts oldest entries after 64 cached routes", async () => {
    getOrderedStopsForTrain.mockImplementation(async (tr) => [`stop-for-${tr.id}`]);

    const trains: LiveTrain[] = [];
    for (let i = 0; i < 65; i += 1) {
      const t = train({ id: `njt-${i}`, network: "njt", route: `R${i}` });
      trains.push(t);
      ensureRouteStopsLoaded(t);
    }

    await flushRouteStopLoads();
    expect(getRouteStopsSnapshot(trains[64]!)).toEqual(["stop-for-njt-64"]);
    expect(getRouteStopsSnapshot(trains[0]!)).toEqual([]);
  });

  it("clearRouteStopsCache drops cached lists", async () => {
    const t = train({ id: "njt-9", network: "njt", route: "MB" });
    getOrderedStopsForTrain.mockResolvedValue(["A", "B"]);
    ensureRouteStopsLoaded(t);
    await flushRouteStopLoads();
    expect(getRouteStopsSnapshot(t).length).toBe(2);

    clearRouteStopsCache();
    expect(getRouteStopsSnapshot(t)).toEqual([]);
  });
});
