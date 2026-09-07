# BookSwap

React/Vite frontend and Node.js/Express backend for the BookSwap marketplace MVP.

## Run locally

```bash
npm install
node --env-file=.env backend/src/scripts/migrate.js
node --env-file=.env backend/src/server.js
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

For local startup, the commands above load the root `.env` file explicitly. On Render, environment variables are supplied by Render, so the Start Command must not include `--env-file`.

For deployment, set `CLIENT_ORIGINS` on Render to the exact Vercel URL (or a comma-separated list of production and preview URLs). It must match the browser address exactly, without a trailing slash.

The current UI uses local demo listings so every required flow can be previewed without a database. Users are stored in PostgreSQL; the Express API already exposes MVP routes for listings, ratings, favorites, chats, messages, and best books. Redis and Socket.IO can be connected behind these routes next.

## Authentication

The MVP uses email and password only — there are no verification codes or social providers. Registration and sign-in are connected to `POST /api/auth/register` and `POST /api/auth/login`; passwords are salted and hashed with `scrypt`. See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries and the future PostgreSQL/Redis migration seam.
