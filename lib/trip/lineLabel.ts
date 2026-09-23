import { subwayLineName } from "@/lib/mta/lines";
import { lineName as njLineName } from "@/lib/nj/lines";
import type { Network } from "@/types";

export function tripLineLabel(network: Network | undefined, route: string): string {
  if (network === "mta") return subwayLineName(route);
  if (network === "njt") return njLineName(route);
  return route;
}
