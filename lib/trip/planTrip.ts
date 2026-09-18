import { haversineMeters, walkMinutesForDistanceM } from "./geo";
import type { TripGraph } from "./loadGraph";
import { routeColor } from "./routeColor";
import { buildTripStats } from "./tripStats";
import type { PlannedRoute, RouteStep } from "./types";

export function planTrip(graph: TripGraph, fromKey: string, toKey: string): PlannedRoute | null {
  if (!graph.nodes.has(fromKey) || !graph.nodes.has(toKey)) {
    return null;
  }

  if (fromKey === toKey) {
    const node = graph.nodes.get(fromKey)!;
    const steps: RouteStep[] = [
      {
        kind: "stay",
        route: null,
        fromName: node.name,
        toName: node.name,
        color: null,
        fromKey,
        toKey: fromKey,
      },
    ];
    return {
      steps,
      coordinatesLonLat: [[node.lon, node.lat]],
      stopCount: 1,
      stats: buildTripStats(steps, 1),
    };
  }

  const prev = new Map<string, { from: string; route: string }>();
  const queue: string[] = [fromKey];
  prev.set(fromKey, { from: fromKey, route: "" });

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === toKey) break;

    const edges = graph.adjacency.get(cur) ?? [];
    for (const edge of edges) {
      if (prev.has(edge.to)) continue;
      prev.set(edge.to, { from: cur, route: edge.route });
      queue.push(edge.to);
    }
  }

  if (!prev.has(toKey)) return null;

  const pathNodes: string[] = [];
  const pathEdges: string[] = [];
  for (let at = toKey; at !== fromKey; ) {
    pathNodes.push(at);
    const step = prev.get(at)!;
    pathEdges.push(step.route);
    at = step.from;
  }
  pathNodes.push(fromKey);
  pathNodes.reverse();
  pathEdges.reverse();

  const steps = buildSteps(graph, pathNodes, pathEdges);
  const coordinatesLonLat = pathNodes.map((k) => {
    const n = graph.nodes.get(k)!;
    return [n.lon, n.lat] as [number, number];
  });

  const stopCount = pathNodes.length;
  return {
    steps,
    coordinatesLonLat,
    stopCount,
    stats: buildTripStats(steps, stopCount),
  };
}

function buildSteps(graph: TripGraph, nodes: string[], edgeRoutes: string[]): RouteStep[] {
  const steps: RouteStep[] = [];
  if (nodes.length < 2) return steps;

  let segStart = 0;
  for (let i = 0; i < edgeRoutes.length; i++) {
    const route = edgeRoutes[i]!;
    const nextRoute = i + 1 < edgeRoutes.length ? edgeRoutes[i + 1] : null;
    if (nextRoute && route.toLowerCase() === nextRoute.toLowerCase()) continue;

    const fromNode = graph.nodes.get(nodes[segStart]!)!;
    const toNode = graph.nodes.get(nodes[i + 1]!)!;
    const isWalk = route.toLowerCase() === "walk";
    const kind = isWalk ? "walk" : "ride";
    const walkDistanceM = isWalk
      ? haversineMeters(fromNode.lat, fromNode.lon, toNode.lat, toNode.lon)
      : undefined;
    steps.push({
      kind,
      route: kind === "ride" ? route : null,
      fromName: fromNode.name,
      toName: toNode.name,
      color: kind === "ride" ? routeColor(route) : null,
      network: kind === "ride" ? (fromNode.network === "njt" ? "njt" : "mta") : undefined,
      fromKey: nodes[segStart]!,
      toKey: nodes[i + 1]!,
      walkDistanceM,
      walkMinutes: walkDistanceM != null ? walkMinutesForDistanceM(walkDistanceM) : undefined,
    });
    segStart = i + 1;
  }

  return steps;
}
