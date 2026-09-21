/** Steddy cache key — station + line (day timetable when available, else 19-rec fallback). */
export function tripScheduleKey(
  stationCode: string,
  lineCode: string,
  boardKey: string,
): readonly ["trip-schedule-station", string, string, string] {
  return ["trip-schedule-station", stationCode, lineCode, boardKey] as const;
}
