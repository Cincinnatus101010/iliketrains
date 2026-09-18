import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

export const config = {
  port: Number(process.env.PORT ?? 8787),
  njUsername: process.env.NJTRANSIT_USERNAME ?? "",
  njPassword: process.env.NJTRANSIT_PASSWORD ?? "",
  tokenUrl:
    process.env.NJTRANSIT_TOKEN_URL ??
    "https://raildata.njtransit.com/api/TrainData/getToken",
  apiBaseUrl:
    process.env.NJTRANSIT_API_BASE_URL ??
    "https://raildata.njtransit.com/api/TrainData/",
};

export const njConfigured = Boolean(config.njUsername && config.njPassword);
