/** Steddy cache keys for trip planner schedule fetches. */
export function tripScheduleKey(
  stationCode: string,
  lineCode: string,
  fromKey: string,
): readonly ["trip-schedule", string, string, string] {
  return ["trip-schedule", stationCode, lineCode, fromKey] as const;
}
