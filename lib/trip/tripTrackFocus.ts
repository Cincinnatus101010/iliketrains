import { canonicalNjRoute } from "@/lib/nj/njRoutes";
import type { Network } from "@/types";
import { firstRideStep } from "./firstRideStep";
import type { SavedTrip } from "./savedTrip";
export type TripTrackFocus = {
  network: Network;
  routes: string[];
};

/** Show only the chosen departure line (or first ride leg) while waiting for live GPS. */
export function tripTrackFocusForWaitingTrain(trip: SavedTrip): TripTrackFocus | null {
  const firstRide = firstRideStep(trip.route);
  const dep = trip.chosenDeparture;
  const routeCode = canonicalNjRoute(dep?.lineCode ?? dep?.lineAbbrev ?? dep?.line);
  const fallback = canonicalNjRoute(firstRide?.route ?? null);
  const resolved = routeCode ?? fallback;
  if (!resolved) return null;

  const network =
    firstRide?.network === "mta" || firstRide?.network === "njt" ? firstRide.network : "njt";

  return { network, routes: [resolved] };
}
