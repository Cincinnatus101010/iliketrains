import fs from "node:fs";
import path from "node:path";

let idToName: Map<string, string> | null = null;

/** GTFS-style stop_id from `public/data/njt-stops.txt` → stop name. */
export function njtStopNameById(stopId: string): string | null {
  const id = stopId.trim();
  if (!id) return null;

  if (!idToName) {
    idToName = new Map();
    const csvPath = path.join(process.cwd(), "public/data/njt-stops.txt");
    if (fs.existsSync(csvPath)) {
      for (const line of fs.readFileSync(csvPath, "utf8").split("\n").slice(1)) {
        if (!line.trim()) continue;
        const comma = line.indexOf(",");
        if (comma <= 0) continue;
        const rowId = line.slice(0, comma).trim();
        const name = line
          .slice(comma + 1)
          .split(",")[0]
          ?.trim();
        if (rowId && name) idToName.set(rowId, name);
      }
    }
  }

  return idToName.get(id) ?? null;
}
