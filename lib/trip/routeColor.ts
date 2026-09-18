import { colorForSubwayRoute } from "@/lib/mta/subwayRoutes";
import { NJ_ROUTE_COLORS } from "@/lib/nj/njRoutes";

export function routeColor(routeId: string): string {
  const nj = NJ_ROUTE_COLORS[routeId.toUpperCase()];
  if (nj) return nj;
  return colorForSubwayRoute(routeId);
}
