import { getStationsResponse } from "@/lib/nj/getStations";
import type { TripPlanResponse } from "@/types";
import { boardingDeparturesForRoute } from "./boardingDepartures";
import { loadTripGraphServer } from "./loadGraphServer";
import { planTrip } from "./planTrip";
import { ensureRouteStats } from "./tripStats";

export async function getTripPlanResponse(
  fromKey: string,
  toKey: string,
): Promise<TripPlanResponse> {
  const from = fromKey.trim();
  const to = toKey.trim();

  if (!from || !to) {
    return {
      fromKey: from,
      toKey: to,
      fromName: "",
      toName: "",
      route: null,
      boarding: null,
      error: "from and to station keys are required",
    };
  }

  const graph = await loadTripGraphServer();
  if (!graph) {
    return {
      fromKey: from,
      toKey: to,
      fromName: "",
      toName: "",
      route: null,
      boarding: null,
      error: "Route data missing.",
    };
  }

  const fromNode = graph.nodes.get(from);
  const toNode = graph.nodes.get(to);
  if (!fromNode || !toNode) {
    return {
      fromKey: from,
      toKey: to,
      fromName: fromNode?.name ?? "",
      toName: toNode?.name ?? "",
      route: null,
      boarding: null,
      error: "Unknown station.",
    };
  }

  const planned = planTrip(graph, from, to);
  if (!planned) {
    return {
      fromKey: from,
      toKey: to,
      fromName: fromNode.name,
      toName: toNode.name,
      route: null,
      boarding: null,
      error: "No route found between those stations.",
    };
  }

  const route = ensureRouteStats(planned);
  const { stations } = await getStationsResponse();
  const boarding = await boardingDeparturesForRoute(route, fromNode.name, stations);

  return {
    fromKey: from,
    toKey: to,
    fromName: fromNode.name,
    toName: toNode.name,
    route,
    boarding,
    error: null,
  };
}
