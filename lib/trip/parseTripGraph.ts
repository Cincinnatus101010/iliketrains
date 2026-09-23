import type { TripGraph } from "@/types";

type GraphNode = { name: string; lat: number; lon: number; network: string };
type GraphEdge = { from: string; to: string; route: string };

export function parseTripGraphRaw(raw: {
  nodes?: Record<string, GraphNode>;
  edges?: GraphEdge[];
}): TripGraph {
  const nodes = new Map(Object.entries(raw.nodes ?? {}));
  const adjacency = new Map<string, GraphEdge[]>();
  for (const e of raw.edges ?? []) {
    const list = adjacency.get(e.from) ?? [];
    list.push(e);
    adjacency.set(e.from, list);
  }
  return { nodes, adjacency };
}
