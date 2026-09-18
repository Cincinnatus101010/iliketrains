import { MTA_SUBWAY_FEED_URLS } from "./feedUrls";

type FeedEntity = import("gtfs-realtime-bindings").transit_realtime.IFeedEntity;

const CACHE_TTL_MS = 12_000;

let entities: FeedEntity[] = [];
let fetchedAt = 0;
let inflight: Promise<FeedEntity[]> | null = null;

const MTA_USER_AGENT = "iliketrains/1.0 (+https://github.com/Cincinnatus101010/iliketrains)";

async function decodeFeed(buffer: ArrayBuffer): Promise<FeedEntity[]> {
  const mod = await import("gtfs-realtime-bindings");
  const GtfsRealtimeBindings = mod.default;
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  return feed.entity ?? [];
}

async function fetchFeed(url: string): Promise<FeedEntity[]> {
  const headers: HeadersInit = {
    "User-Agent": MTA_USER_AGENT,
    Accept: "application/x-protobuf, application/octet-stream, */*",
  };

  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  return decodeFeed(await response.arrayBuffer());
}

async function refreshFeeds(): Promise<FeedEntity[]> {
  const batches = await Promise.all(MTA_SUBWAY_FEED_URLS.map((url) => fetchFeed(url)));
  entities = batches.flat();
  fetchedAt = Date.now();
  return entities;
}

export async function getMtaFeedEntities(): Promise<FeedEntity[]> {
  const now = Date.now();
  const fresh = now - fetchedAt < CACHE_TTL_MS && entities.length > 0;
  if (fresh) return entities;

  if (inflight) return inflight;

  if (entities.length > 0) {
    inflight = refreshFeeds()
      .catch(() => entities)
      .finally(() => {
        inflight = null;
      });
    return entities;
  }

  inflight = refreshFeeds().finally(() => {
    inflight = null;
  });

  return inflight;
}
