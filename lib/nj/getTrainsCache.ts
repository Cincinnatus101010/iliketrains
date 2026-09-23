import type { TrainsResponse } from "@/types";

const CACHE_MS = 8_000;

let cached: { at: number; body: TrainsResponse } | null = null;
let inflight: Promise<TrainsResponse> | null = null;

export async function withTrainsCache(
  fetchFresh: () => Promise<TrainsResponse>,
): Promise<TrainsResponse> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return cached.body;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const body = await fetchFresh();
      cached = { at: Date.now(), body };
      return body;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
