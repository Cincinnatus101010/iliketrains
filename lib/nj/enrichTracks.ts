import type { NjTrain } from "@/lib/types";
import type { ScheduleDeparture } from "@/lib/types";
import { fetchStationList, resolveStationCode } from "./stations";
import { fetchStationSchedule, matchPlatformTrack } from "./schedule";

export async function enrichLiveTrainsWithTracks(trains: NjTrain[], token: string): Promise<NjTrain[]> {
  if (trains.length === 0) return trains;

  const stations = await fetchStationList(token);
  const codesNeeded = new Set<string>();

  for (const train of trains) {
    if (!train.trainNumber || !train.stopName) continue;
    const code = resolveStationCode(train.stopName, stations);
    if (code) codesNeeded.add(code);
  }

  const scheduleCache = new Map<string, ScheduleDeparture[]>();
  const codes = [...codesNeeded].slice(0, 12);
  await Promise.all(
    codes.map(async (code) => {
      const res = await fetchStationSchedule(token, code);
      scheduleCache.set(code, res.items);
    }),
  );

  return trains.map((train) => {
    if (!train.trainNumber || !train.stopName) return train;
    const code = resolveStationCode(train.stopName, stations);
    if (!code) return train;
    const platformTrack = matchPlatformTrack(train.trainNumber, scheduleCache.get(code) ?? []);
    if (!platformTrack) return train;
    return { ...train, platformTrack };
  });
}
