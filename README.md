# BookSwap

React/Vite frontend and Node.js/Express backend for the BookSwap marketplace MVP.

## Run locally

```bash
npm install
npm run migrate --workspace backend
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

The current UI uses local demo listings so every required flow can be previewed without a database. Users are stored in PostgreSQL; the Express API already exposes MVP routes for listings, ratings, favorites, chats, messages, and best books. Redis and Socket.IO can be connected behind these routes next.

## Authentication

The MVP uses email and password only — there are no verification codes or social providers. Registration and sign-in are connected to `POST /api/auth/register` and `POST /api/auth/login`; passwords are salted and hashed with `scrypt`. See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries and the future PostgreSQL/Redis migration seam.
