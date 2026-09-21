export const NJ_ROUTE_COLORS: Record<string, string> = {
  NEC: "#DD3439",
  NJCL: "#03A3DF",
  MNE: "#08A652",
  MNEG: "#A4C9AA",
  BNTN: "#E66859",
  MNBN: "#FFD411",
  PASC: "#94219A",
  RARV: "#F2A537",
  ATLC: "#075AAA",
};

const API_LINE_TO_ROUTE: Record<string, string> = {
  "Northeast Corridor Line": "NEC",
  "Northeast Corrdr": "NEC",
  "North Jersey Coast Line": "NJCL",
  "No Jersey Coast": "NJCL",
  "Morris & Essex Line": "MNE",
  "Morristown Line": "MNE",
  "Gladstone Branch": "MNEG",
  "Montclair-Boonton Line": "BNTN",
  "Main Line": "MNBN",
  "Bergen County Line": "MNBN",
  "Pascack Valley Line": "PASC",
  "Raritan Valley Line": "RARV",
  "Atlantic City Line": "ATLC",
};

/** 19-rec schedule uses short codes / abbreviations, not graph route ids. */
const LINE_CODE_TO_ROUTE: Record<string, string> = {
  NEC: "NEC",
  NE: "NEC",
  NJCL: "NJCL",
  NC: "NJCL",
  MNE: "MNE",
  ME: "MNE",
  "M&E": "MNE",
  MNEG: "MNEG",
  GB: "MNEG",
  BNTN: "BNTN",
  MB: "BNTN",
  MNBN: "MNBN",
  ML: "MNBN",
  BM: "MNBN",
  PASC: "PASC",
  PV: "PASC",
  RARV: "RARV",
  RV: "RARV",
  ATLC: "ATLC",
  AC: "ATLC",
};

export function colorForRoute(routeId: string): string {
  return NJ_ROUTE_COLORS[routeId.toUpperCase()] ?? "#666666";
}

export function canonicalNjRoute(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const code = LINE_CODE_TO_ROUTE[raw.trim().toUpperCase()];
  if (code) return code;
  return routeFromApiLine(raw);
}

export function routeFromApiLine(trainLine: string | null | undefined): string | null {
  if (!trainLine?.trim()) return null;
  const line = trainLine.trim();
  if (API_LINE_TO_ROUTE[line]) return API_LINE_TO_ROUTE[line];

  for (const [apiName, routeId] of Object.entries(API_LINE_TO_ROUTE)) {
    if (
      line.toLowerCase().includes(apiName.toLowerCase()) ||
      apiName.toLowerCase().includes(line.toLowerCase())
    ) {
      return routeId;
    }
  }

  if (line.toLowerCase().includes("northeast")) return "NEC";
  if (
    line.toLowerCase().includes("north jersey coast") ||
    line.toLowerCase().includes("coast line")
  )
    return "NJCL";
  if (line.toLowerCase().includes("morris") && line.toLowerCase().includes("essex")) return "MNE";
  if (line.toLowerCase().includes("morristown")) return "MNE";
  if (line.toLowerCase().includes("gladstone")) return "MNEG";
  if (line.toLowerCase().includes("montclair") || line.toLowerCase().includes("boonton"))
    return "BNTN";
  if (line.toLowerCase().includes("bergen") || line.toLowerCase().includes("main line"))
    return "MNBN";
  if (line.toLowerCase().includes("pascack")) return "PASC";
  if (line.toLowerCase().includes("raritan")) return "RARV";
  if (line.toLowerCase().includes("atlantic city")) return "ATLC";

  return null;
}
