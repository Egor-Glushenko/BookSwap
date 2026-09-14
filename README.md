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

The UI reads marketplace data from PostgreSQL through the Express API. Guests can browse listings, cards, ratings, search, and filters; JWT-authenticated users can create listings, chat, rate books, save favorites, use the profile area, and leave seller reviews. Moderator and administrator endpoints cover reports, listing removal, user blocking, category management, and moderator role management.

## Authentication

The MVP uses login/password only — there are no verification codes or social providers. Regular users sign in with their email and password. Admin and moderator access is issued only when `POST /api/auth/login` receives the exact special login/password pairs from `ADMIN_LOGIN`/`ADMIN_PASSWORD` or `MODERATOR_LOGIN`/`MODERATOR_PASSWORD`; ordinary database passwords cannot open staff roles. Passwords are salted and hashed with `scrypt`, and authenticated requests use a `Bearer` JWT. See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries.
