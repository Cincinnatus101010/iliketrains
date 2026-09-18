# iliketrains

NJ Transit **live rail map** on **Next.js** with [steddy](https://www.npmjs.com/package/steddy), [@iantroisi/ui](https://www.npmjs.com/package/@iantroisi/ui), and [@iantroisi/sickmaps](https://www.npmjs.com/package/@iantroisi/sickmaps).

## Run

```bash
npm install
cp .env.example .env.local
# NJTRANSIT_USERNAME=...
# NJTRANSIT_PASSWORD=...
npm run dev
```

Open **http://localhost:3000** — UI and `/api/trains` run on one server (no separate Express process).

## Environment (`.env.local`)

| Variable | Required |
|----------|----------|
| `NJTRANSIT_USERNAME` | Yes |
| `NJTRANSIT_PASSWORD` | Yes |

Token cache: `.data/raildata-token.json` (gitignored). NJ limits `getToken` to ~10/day.

## Deploy

```bash
npm run build
npm start
```

Dockerfile included. Set env vars on your host (Railway, Render, Vercel with Node runtime, etc.).

## License

MIT
