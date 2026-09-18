# iliketrains

**NYC Subway + NJ Transit** live map on **Next.js** with [steddy](https://www.npmjs.com/package/steddy), [@iantroisi/ui](https://www.npmjs.com/package/@iantroisi/ui), and [@iantroisi/sickmaps](https://www.npmjs.com/package/@iantroisi/sickmaps). Subway positions come from MTA’s public **GTFS-realtime** protobuf feeds (same URLs as [njtrains](https://github.com/Cincinnatus101010/njtrains)) — no developer API key or signup. (MTA **Bus Time** is a separate product that still uses keys; this app does not use it.)

## Run

```bash
npm install
cp .env.example .env.local
# NJTRANSIT_USERNAME=...
# NJTRANSIT_PASSWORD=...
npm run dev
```

Open **http://localhost:3000** — UI and `/api/trains` run on one server (no separate Express process).

If dev crashes with `Cannot find module './873.js'` or missing `.next/routes-manifest.json`, stop the server and run `npm run dev:clean` (stale webpack cache after hot reload).

## Environment (`.env.local`)

| Variable | Required |
|----------|----------|
| `NJTRANSIT_USERNAME` | For NJ Rail |
| `NJTRANSIT_PASSWORD` | For NJ Rail |

Token cache: `.data/raildata-token.json` (gitignored). NJ limits `getToken` to ~10/day.

## Deploy

```bash
npm run build
npm start
```

Dockerfile included. Set env vars on your host (Railway, Render, Vercel with Node runtime, etc.).

## License

MIT
