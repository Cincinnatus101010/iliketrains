import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, njConfigured } from "./config.js";
import { getLastTokenError, getNjToken } from "./tokenService.js";
import { parseVehicle, type NjTrain } from "./parseVehicles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, njConfigured });
});

app.get("/api/trains", async (_req, res) => {
  if (!njConfigured) {
    res.status(503).json({
      trains: [] as NjTrain[],
      error: "Set NJTRANSIT_USERNAME and NJTRANSIT_PASSWORD in .env.local",
      configured: false,
    });
    return;
  }

  const token = await getNjToken(config.njUsername, config.njPassword, config.tokenUrl);
  if (!token) {
    res.json({
      trains: [] as NjTrain[],
      error: getLastTokenError(),
      configured: true,
    });
    return;
  }

  const form = new FormData();
  form.append("token", token);
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getVehicleData`;

  try {
    const response = await fetch(url, { method: "POST", body: form });
    if (!response.ok) {
      res.json({ trains: [], error: `getVehicleData HTTP ${response.status}`, configured: true });
      return;
    }

    const rows = (await response.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) {
      res.json({ trains: [], error: "Unexpected vehicle payload", configured: true });
      return;
    }

    const trains = rows.map(parseVehicle).filter((t): t is NjTrain => t != null);
    res.json({ trains, error: null, configured: true, updatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({
      trains: [],
      error: e instanceof Error ? e.message : "Fetch failed",
      configured: true,
    });
  }
});

const dist = path.join(__dirname, "..", "dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(config.port, () => {
  console.log(`NJ trains API on http://localhost:${config.port} (njConfigured=${njConfigured})`);
});
