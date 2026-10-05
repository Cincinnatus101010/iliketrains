import { approachFromHighDist } from "./incomingTrainDirection";
import { loadNjRouteStopOrder } from "./loadNjRouteStopOrder";

export async function resolveIncomingApproachDirection(
  routeId: string,
  boardingStationName: string,
  trainDestination: string | null | undefined,
): Promise<boolean | null> {
  const stopOrder = await loadNjRouteStopOrder(routeId);
  if (stopOrder.length < 2) return null;

  return approachFromHighDist(stopOrder, boardingStationName, trainDestination);
}
