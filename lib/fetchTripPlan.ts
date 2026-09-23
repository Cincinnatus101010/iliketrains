import type { TripPlanResponse } from "@/types";

export async function fetchTripPlan(
  fromKey: string,
  toKey: string,
  signal?: AbortSignal,
): Promise<TripPlanResponse> {
  const params = new URLSearchParams({
    from: fromKey,
    to: toKey,
  });
  const res = await fetch(`/api/trip?${params}`, { signal, cache: "no-store" });
  const body = (await res.json()) as TripPlanResponse;
  if (!res.ok && !body.error) {
    return {
      ...body,
      route: body.route ?? null,
      boarding: body.boarding ?? null,
      error: body.error ?? `HTTP ${res.status}`,
    };
  }
  return body;
}
