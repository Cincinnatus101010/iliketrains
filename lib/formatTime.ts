/** Parse NJ RailData datetime like "18-Sep-2026 11:52:00 AM" */
export function formatNjDateTime(raw: string | null | undefined): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
