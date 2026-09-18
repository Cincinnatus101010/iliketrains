type GraphNode = { name: string; lat: number; lon: number; network: string };
type GraphEdge = { from: string; to: string; route: string };

export type TripGraph = {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
};

let cached: TripGraph | null = null;
let inflight: Promise<TripGraph | null> | null = null;

export async function loadTripGraph(): Promise<TripGraph | null> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/data/transit-graph.json");
      if (!res.ok) return null;
      const raw = (await res.json()) as {
        nodes: Record<string, GraphNode>;
        edges: GraphEdge[];
      };

      const nodes = new Map(Object.entries(raw.nodes ?? {}));
      const adjacency = new Map<string, GraphEdge[]>();
      for (const e of raw.edges ?? []) {
        const list = adjacency.get(e.from) ?? [];
        list.push(e);
        adjacency.set(e.from, list);
      }

      cached = { nodes, adjacency };
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function listPlanStations(): Promise<
  { key: string; name: string; network: "mta" | "njt" }[]
> {
  const graph = await loadTripGraph();
  if (!graph) return [];

  return [...graph.nodes.entries()]
    .map(([key, n]) => ({
      key,
      name: n.name,
      network: (n.network === "njt" ? "njt" : "mta") as "mta" | "njt",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
